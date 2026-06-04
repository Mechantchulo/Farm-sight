# API Reference

All frontend traffic should go through the FastAPI backend.

## Base URL

Local development:

```text
http://localhost:8000
```

## Routes

### `GET /v1/api/weather-geo`

Returns the caller’s approximate location.

Response:

```json
{
  "lat": -1.3005272,
  "lon": 36.824646,
  "city": "Nairobi",
  "region": "Nairobi County",
  "country": "KE"
}
```

### `GET /v1/api/weather?lat=&lon=&lang=en`

Returns current conditions and a 7-day forecast.

Response shape:

```json
{
  "current": {
    "location": {},
    "current": {},
    "daily": [],
    "ai_summary": null
  },
  "forecast": [],
  "ratelimit_remaining": 997
}
```

The backend also forwards these headers when available:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

### `POST /v1/api/trees`

Multipart form upload for farm image analysis.

Required field:

- `image`

Optional fields:

- `farmerId`
- `county`
- `landAcres`
- `location`
- `notes`

Response:

```json
{
  "analysis_id": "Kx8mP2qRvTnZ",
  "timestamp": "2026-06-01T09:15:00.000Z",
  "farmer_id": "F-001",
  "county": "Bomet",
  "location": "Kapkimolwa Farm, Block C",
  "land_acres": 2.5,
  "total_tree_count": 84,
  "tree_density_per_acre": 33.6,
  "confidence_score": 0.87,
  "canopy_coverage_pct": 41.2,
  "tree_health": {
    "healthy": 68,
    "needs_care": 12,
    "needs_replacement": 4
  },
  "low_confidence": false,
  "tree_species_guess": "Tea (Camellia sinensis)",
  "observations": [],
  "recommendations": [],
  "original_image_url": "https://...",
  "overlay_image_url": "https://...",
  "cv_debug": {}
}
```

### `GET /v1/api/usage`

Returns usage and plan data from WeatherAI.

### Error format

Errors are returned as JSON:

```json
{
  "error": "Internal server error.",
  "code": "INTERNAL_ERROR"
}
```

Common codes:

- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `RATE_LIMIT_EXCEEDED`
- `INTERNAL_ERROR`
- `SERVICE_UNAVAILABLE`

## Tree Analysis Notes

- `DEMO_MODE=true` returns mock tree-analysis data from the backend.
- `DEMO_MODE=false` forwards the request to WeatherAI.
- When WeatherAI is unavailable, the backend returns structured JSON instead of an HTML traceback.
