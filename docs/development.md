# Development Guide

## System Overview

FarmSight uses a two-tier architecture:

- `frontend/` renders the user interface and calls only the FastAPI backend
- `backend/` proxies all WeatherAI requests and keeps `WAI_API_KEY` server-side

### Request Flow

1. The frontend tries browser geolocation first.
2. If geolocation is unavailable, it falls back to manual latitude/longitude input.
3. If both are unavailable, it uses backend geo detection.
4. The backend proxies requests to WeatherAI and forwards rate-limit headers back to the client.

## Frontend Responsibilities

- Fetch weather, geo, and tree-analysis data from the backend
- Handle loading, error, and success states for each screen
- Display quota information using rate-limit headers from the weather response
- Provide a simple, mobile-friendly UI for non-technical users

## Backend Responsibilities

- Proxy WeatherAI requests
- Preserve the API key on the server
- Forward `X-RateLimit-*` headers to the frontend
- Return structured JSON errors with a stable `code`
- Support `DEMO_MODE` for safe tree-analysis development

## Demo Mode

Set `DEMO_MODE=true` in `backend/.env` to return mock tree-analysis data.

Use demo mode while iterating locally to avoid consuming tree-analysis quota.

Set `DEMO_MODE=false` when you want the backend to call the live WeatherAI trees API.

## Local Environment

### Backend

Required variables:

```env
WAI_API_KEY=wai_your_key_here
WEATHERAI_BASE_URL=https://api.weather-ai.co
FRONTEND_ORIGIN=http://localhost:5173
DEMO_MODE=true
```

### Frontend

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Docker

The repository includes Docker support for both services.

```bash
docker compose up --build
```

## Notes for Contributors

- Keep API changes mirrored between backend route shapes and frontend service calls.
- Prefer structured JSON errors over ad hoc strings.
- Avoid calling WeatherAI directly from the frontend.
- Keep new UI states accessible on mobile first.

