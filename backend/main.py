from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import FRONTEND_ORIGIN
from routers.trees import router as trees_router
from routers.weather import router as weather_router

app = FastAPI(title="FarmSight API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(dict.fromkeys(["http://localhost:5173", FRONTEND_ORIGIN])),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(weather_router)
app.include_router(trees_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
