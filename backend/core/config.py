from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(BACKEND_ENV_PATH, override=False)
load_dotenv(override=False)

WAI_API_KEY = os.getenv("WAI_API_KEY", "")
WEATHERAI_BASE_URL = os.getenv("WEATHERAI_BASE_URL", "https://api.weather-ai.co").rstrip("/")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
DEMO_MODE = os.getenv("DEMO_MODE", "true").strip().lower() in {"1", "true", "yes", "on"}


def get_settings() -> dict[str, object]:
    return {
        "WAI_API_KEY": WAI_API_KEY,
        "WEATHERAI_BASE_URL": WEATHERAI_BASE_URL,
        "FRONTEND_ORIGIN": FRONTEND_ORIGIN,
        "DEMO_MODE": DEMO_MODE,
    }
