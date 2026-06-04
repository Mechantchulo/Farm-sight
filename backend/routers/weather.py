from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from models.responses import ErrorResponse
from services.weather import WeatherAIError, fetch_usage, fetch_weather, fetch_weather_geo

router = APIRouter(prefix="/v1/api", tags=["weather"])


def _attach_rate_limit_headers(response: JSONResponse, headers: dict[str, str]) -> JSONResponse:
    for header_name in ("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"):
        if header_name in headers:
            response.headers[header_name] = headers[header_name]
    return response


@router.get("/weather-geo")
async def weather_geo(request: Request):
    client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
    try:
        return await fetch_weather_geo(client_ip)
    except WeatherAIError as exc:
        response = JSONResponse(status_code=exc.status_code, content=ErrorResponse(error=exc.message, code=exc.code).dict())
        return _attach_rate_limit_headers(response, exc.rate_limit_headers)


@router.get("/weather")
async def weather(lat: float, lon: float, lang: str = "en"):
    try:
        current, forecast, remaining, headers = await fetch_weather(lat, lon, lang)
        payload = {
            "current": current,
            "forecast": forecast,
            "ratelimit_remaining": remaining,
        }
        response = JSONResponse(content=payload)
        return _attach_rate_limit_headers(response, headers)
    except WeatherAIError as exc:
        response = JSONResponse(status_code=exc.status_code, content=ErrorResponse(error=exc.message, code=exc.code).dict())
        return _attach_rate_limit_headers(response, exc.rate_limit_headers)


@router.get("/usage")
async def usage():
    try:
        payload, headers = await fetch_usage()
        response = JSONResponse(content=payload)
        return _attach_rate_limit_headers(response, headers)
    except WeatherAIError as exc:
        response = JSONResponse(status_code=exc.status_code, content=ErrorResponse(error=exc.message, code=exc.code).dict())
        return _attach_rate_limit_headers(response, exc.rate_limit_headers)
