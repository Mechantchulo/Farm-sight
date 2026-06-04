from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    error: str
    code: str


class WeatherGeoResponse(BaseModel):
    lat: float
    lon: float
    city: str | None = None
    region: str | None = None
    country: str | None = None


class WeatherCurrentResponse(BaseModel):
    ai_summary: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class WeatherCombinedResponse(BaseModel):
    current: dict[str, Any]
    forecast: list[dict[str, Any]]
    ratelimit_remaining: int | None = None


class TreeHealthResponse(BaseModel):
    healthy: int
    needs_care: int
    needs_replacement: int


class TreesResponse(BaseModel):
    total_tree_count: int
    tree_density_per_acre: float
    confidence_score: float
    canopy_coverage_pct: float
    tree_health: TreeHealthResponse
    observations: list[str]
    recommendations: list[str]
    original_image_url: str
    overlay_image_url: str
    tree_species_guess: str
