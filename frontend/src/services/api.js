const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

async function readResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

function buildApiError(data, fallbackMessage) {
  const message = data && typeof data === 'object' && data.error ? data.error : fallbackMessage;
  const error = new Error(message);
  if (data && typeof data === 'object' && data.code) {
    error.code = data.code;
  }
  return error;
}

export function formatApiError(error, fallbackMessage) {
  if (error?.code === 'INTERNAL_ERROR') {
    return 'WeatherAI is temporarily unavailable. Please try again in a moment.';
  }

  if (error?.code === 'RATE_LIMIT_EXCEEDED') {
    return 'You have reached the monthly quota. Please try again after the reset.';
  }

  return error?.message || fallbackMessage;
}

async function requestJson(path, options = {}, fallbackMessage) {
  const res = await fetch(`${BASE}${path}`, options);
  const data = await readResponse(res);
  const headers = {
    limit: res.headers.get('X-RateLimit-Limit'),
    remaining: res.headers.get('X-RateLimit-Remaining'),
    reset: res.headers.get('X-RateLimit-Reset'),
  };

  if (!res.ok) {
    throw buildApiError(data, fallbackMessage);
  }

  return { data, headers };
}

export async function getGeo() {
  const { data } = await requestJson('/v1/api/weather-geo', {}, 'Could not detect your location');
  return data;
}

export async function getWeather(lat, lon, lang = 'en') {
  const { data, headers } = await requestJson(
    `/v1/api/weather?lat=${lat}&lon=${lon}&lang=${lang}`,
    {},
    'Could not load weather data',
  );
  return { data, ...headers };
}

export async function getTrees(formData) {
  const { data } = await requestJson('/v1/api/trees', {
    method: 'POST',
    body: formData,
  }, 'Farm analysis failed');
  return data;
}
