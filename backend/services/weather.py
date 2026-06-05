from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from core.config import DEMO_MODE, WEATHERAI_BASE_URL, WAI_API_KEY

logger = logging.getLogger(__name__)


ERROR_CODE_BY_STATUS = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_ERROR",
    503: "SERVICE_UNAVAILABLE",
}


class WeatherAIError(RuntimeError):
    def __init__(
        self,
        message: str,
        code: str = "WEATHER_UNAVAILABLE",
        status_code: int = 502,
        rate_limit_headers: dict[str, str] | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.rate_limit_headers = rate_limit_headers or {}


def _auth_headers(extra_headers: dict[str, str] | None = None) -> dict[str, str]:
    headers = {
        "Accept": "application/json",
    }
    api_key = WAI_API_KEY
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
        headers["X-API-Key"] = api_key
    if extra_headers:
        headers.update(extra_headers)
    return headers


def _parse_rate_limit(headers: httpx.Headers) -> int | None:
    value = headers.get("X-RateLimit-Remaining")
    if value is None:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _rate_limit_headers(headers: httpx.Headers) -> dict[str, str]:
    result: dict[str, str] = {}
    for source, target in (
        ("X-RateLimit-Limit", "X-RateLimit-Limit"),
        ("X-RateLimit-Remaining", "X-RateLimit-Remaining"),
        ("X-RateLimit-Reset", "X-RateLimit-Reset"),
    ):
        value = headers.get(source)
        if value is not None:
            result[target] = value
    return result


def _map_error_status(status_code: int) -> tuple[int, str]:
    return status_code, ERROR_CODE_BY_STATUS.get(status_code, "WEATHER_UNAVAILABLE")


async def _request_json(
    client: httpx.AsyncClient,
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    data: Any | None = None,
    files: Any | None = None,
) -> tuple[dict[str, Any] | list[Any], httpx.Headers]:
    try:
        response = await client.request(method, path, params=params, headers=headers, data=data, files=files)
    except httpx.HTTPError as exc:
        raise WeatherAIError(f"WeatherAI request failed: {exc}") from exc
    if response.status_code >= 400:
        message = f"WeatherAI returned {response.status_code}"
        response_code = ERROR_CODE_BY_STATUS.get(response.status_code, "WEATHER_UNAVAILABLE")
        try:
            payload = response.json()
        except ValueError:
            payload = None
        if isinstance(payload, dict):
            message = payload.get("error") or payload.get("message") or message
            response_code = payload.get("code") or response_code
        raise WeatherAIError(
            message,
            code=response_code,
            status_code=response.status_code,
            rate_limit_headers=_rate_limit_headers(response.headers),
        )
    try:
        return response.json(), response.headers
    except ValueError as exc:
        raise WeatherAIError("WeatherAI returned invalid JSON") from exc


async def fetch_weather_geo(client_ip: str | None) -> dict[str, Any]:
    async with httpx.AsyncClient(base_url=WEATHERAI_BASE_URL, timeout=30.0) as client:
        headers = _auth_headers({"X-Forwarded-For": client_ip or ""})
        data, response_headers = await _request_json(
            client,
            "GET",
            "/v1/weather-geo",
            params={"ip": "auto"},
            headers=headers,
        )
    payload = dict(data) if isinstance(data, dict) else {}
    return {
        "lat": payload.get("lat"),
        "lon": payload.get("lon"),
        "city": response_headers.get("X-City") or payload.get("city"),
        "region": payload.get("region"),
        "country": payload.get("country"),
    }


async def fetch_weather(
    lat: float,
    lon: float,
    lang: str = "en",
) -> tuple[dict[str, Any], dict[str, Any], int | None, dict[str, str]]:
    async with httpx.AsyncClient(base_url=WEATHERAI_BASE_URL, timeout=30.0) as client:
        weather_task = _request_json(
            client,
            "GET",
            "/v1/weather",
            params={"lat": lat, "lon": lon, "ai": "true", "lang": lang, "units": "metric"},
            headers=_auth_headers(),
        )
        daily_task = _request_json(
            client,
            "GET",
            "/v1/daily",
            params={"lat": lat, "lon": lon, "days": 7, "units": "metric"},
            headers=_auth_headers(),
        )
        weather_data, daily_data = await asyncio.gather(weather_task, daily_task, return_exceptions=True)

    if isinstance(weather_data, Exception):
        if isinstance(weather_data, WeatherAIError):
            logger.warning(
                "WeatherAI /v1/weather failed",
                extra={"status_code": weather_data.status_code, "code": weather_data.code},
            )
            raise weather_data
        logger.warning("WeatherAI /v1/weather failed", exc_info=weather_data)
        raise WeatherAIError(str(weather_data))

    weather_json, weather_headers = weather_data
    daily_json = None
    if isinstance(daily_data, Exception):
        if isinstance(daily_data, WeatherAIError):
            logger.warning(
                "WeatherAI /v1/daily failed",
                extra={"status_code": daily_data.status_code, "code": daily_data.code},
            )
        else:
            logger.warning("WeatherAI /v1/daily failed", exc_info=daily_data)
        daily_json = None
    else:
        daily_json, _ = daily_data

    current: dict[str, Any]
    if isinstance(weather_json, dict):
        current = dict(weather_json)
    else:
        current = {"payload": weather_json}

    if "ai_summary" not in current:
        current["ai_summary"] = current.get("summary") or current.get("ai") or current.get("description")

    forecast_source: Any
    if isinstance(daily_json, dict):
        forecast_source = daily_json.get("forecast") or daily_json.get("daily") or daily_json.get("data") or []
    else:
        forecast_source = daily_json

    forecast = forecast_source if isinstance(forecast_source, list) else []
    rate_limit_remaining = _parse_rate_limit(weather_headers)
    return current, forecast, rate_limit_remaining, _rate_limit_headers(weather_headers)


async def fetch_usage() -> tuple[dict[str, Any], dict[str, str]]:
    async with httpx.AsyncClient(base_url=WEATHERAI_BASE_URL, timeout=30.0) as client:
        data, headers = await _request_json(client, "GET", "/v1/usage", headers=_auth_headers())
    return (data if isinstance(data, dict) else {"data": data}, _rate_limit_headers(headers))


async def analyze_trees(
    form_data: dict[str, Any],
    image_bytes: bytes,
    filename: str,
    content_type: str | None,
) -> tuple[dict[str, Any], dict[str, str]]:
    if DEMO_MODE:
        return {
            "total_tree_count": 84,
            "tree_density_per_acre": 33.6,
            "confidence_score": 0.87,
            "canopy_coverage_pct": 41.2,
            "tree_health": {
                "healthy": 68,
                "needs_care": 12,
                "needs_replacement": 4,
            },
            "observations": [
                "Dense canopy in northern quadrant - possible over-crowding",
                "3 trees near water source show yellowing - likely waterlogging",
            ],
            "recommendations": [
                "Consider thinning northern section to improve light penetration",
                "Improve drainage around water source trees",
            ],
            "original_image_url": "/mock/original.jpg",
            "overlay_image_url": "/mock/overlay.jpg",
            "tree_species_guess": "Tea (Camellia sinensis)",
        }, {}

    files = {
        "image": (filename, image_bytes, content_type or "application/octet-stream"),
    }
    data = {key: str(value) for key, value in form_data.items() if value is not None}
    async with httpx.AsyncClient(base_url=WEATHERAI_BASE_URL, timeout=60.0) as client:
        result, headers = await _request_json(
            client,
            "POST",
            "/v1/trees/analyze",
            headers=_auth_headers(),
            data=data,
            files=files,
        )
    return (result if isinstance(result, dict) else {"data": result}, _rate_limit_headers(headers))
