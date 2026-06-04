# FarmSight

FarmSight is a full-stack weather and farm intelligence platform for Kenyan smallholder farmers.

It consists of:

- a React + Vite frontend for field-friendly weather and farm analysis
- a FastAPI backend that securely proxies WeatherAI API calls

The frontend never talks to WeatherAI directly. All WeatherAI requests flow through the backend so the API key remains server-side.

## Quick Start

### Backend

```bash
cp backend/.env.example backend/.env
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cp frontend/.env.example frontend/.env
cd frontend
npm install
npm run dev
```

## Documentation

- [Architecture and development guide](docs/development.md)
- [API reference](docs/api-reference.md)

## Key Features

- Device geolocation with manual latitude/longitude fallback
- Current weather and 7-day forecast
- Tree analysis via multipart image upload
- WeatherAI quota and rate-limit visibility
- Demo mode for safe local development

## Environment Variables

Backend:

```env
WAI_API_KEY=wai_your_key_here
WEATHERAI_BASE_URL=https://api.weather-ai.co
FRONTEND_ORIGIN=http://localhost:5173
DEMO_MODE=true
```

Frontend:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Docker

```bash
docker compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

## Validation

```bash
python -m compileall backend
cd frontend && npm run build
```
