from __future__ import annotations

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse

from models.responses import ErrorResponse
from services.weather import WeatherAIError, analyze_trees

router = APIRouter(prefix="/v1/api", tags=["trees"])


def _attach_rate_limit_headers(response: JSONResponse, headers: dict[str, str]) -> JSONResponse:
    for header_name in ("X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"):
        if header_name in headers:
            response.headers[header_name] = headers[header_name]
    return response


@router.post("/trees")
async def trees(
    image: UploadFile = File(...),
    farmerId: str | None = Form(None),
    county: str | None = Form(None),
    landAcres: str | None = Form(None),
    location: str | None = Form(None),
    notes: str | None = Form(None),
):
    try:
        image_bytes = await image.read()
        result, headers = await analyze_trees(
            {
                "farmerId": farmerId,
                "county": county,
                "landAcres": landAcres,
                "location": location,
                "notes": notes,
            },
            image_bytes,
            image.filename or "upload.jpg",
            image.content_type,
        )
        response = JSONResponse(content=result)
        return _attach_rate_limit_headers(response, headers)
    except WeatherAIError as exc:
        response = JSONResponse(status_code=exc.status_code, content=ErrorResponse(error=exc.message, code=exc.code).dict())
        return _attach_rate_limit_headers(response, exc.rate_limit_headers)
