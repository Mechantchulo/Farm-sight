import { useEffect, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastStrip from './components/ForecastStrip';
import QuotaBadge from './components/QuotaBadge';
import SkeletonCard from './components/SkeletonCard';
import TreeAnalyzer from './components/TreeAnalyzer';
import { formatApiError, getGeo, getWeather } from './services/api';

export default function App() {
  const [geo, setGeo] = useState(null);
  const [weather, setWeather] = useState(null);
  const [quota, setQuota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lang, setLang] = useState('en');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [locationSource, setLocationSource] = useState('device');
  const [locating, setLocating] = useState(false);

  const applyLocation = async (latitude, longitude, nextLang = lang, geoMeta = {}, source = locationSource) => {
    const weatherResult = await getWeather(latitude, longitude, nextLang);
    setGeo({
      lat: latitude,
      lon: longitude,
      city: geoMeta.city ?? null,
      region: geoMeta.region ?? null,
      source,
    });
    setWeather(weatherResult.data);
    setQuota({
      limit: weatherResult.limit,
      remaining: weatherResult.remaining,
      reset: weatherResult.reset,
    });
  };

  const tryDeviceLocation = async () => {
    if (!navigator.geolocation) {
      throw new Error('This device does not support location detection.');
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });

    return {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };
  };

  const loadLocation = async ({ preferDevice = true, latitude, longitude, nextLang = lang } = {}) => {
    setLoading(true);
    setError('');

    try {
      let resolvedLat = latitude;
      let resolvedLon = longitude;
      let source = 'manual';
      let geoMeta = {
        city: 'Custom location',
        region: 'Manual coordinates',
      };

      if (preferDevice) {
        setLocating(true);
        try {
          const deviceLocation = await tryDeviceLocation();
          resolvedLat = deviceLocation.lat;
          resolvedLon = deviceLocation.lon;
          source = 'device';
          geoMeta = {
            city: 'Current device location',
            region: `Lat ${resolvedLat.toFixed(4)}, Lon ${resolvedLon.toFixed(4)}`,
          };
        } catch {
          const fallbackLat = Number.parseFloat(manualLat);
          const fallbackLon = Number.parseFloat(manualLon);
          if (Number.isFinite(fallbackLat) && Number.isFinite(fallbackLon)) {
            resolvedLat = fallbackLat;
            resolvedLon = fallbackLon;
            source = 'manual';
            geoMeta = {
              city: 'Custom location',
              region: `Lat ${resolvedLat.toFixed(4)}, Lon ${resolvedLon.toFixed(4)}`,
            };
          } else {
            const geoData = await getGeo();
            resolvedLat = geoData.lat;
            resolvedLon = geoData.lon;
            source = 'backend';
            geoMeta = {
              city: geoData.city ?? 'Detected location',
              region: geoData.region ?? `Lat ${resolvedLat.toFixed(4)}, Lon ${resolvedLon.toFixed(4)}`,
            };
          }
        } finally {
          setLocating(false);
        }
      }

      if (!Number.isFinite(resolvedLat) || !Number.isFinite(resolvedLon)) {
        throw new Error('Please enter valid latitude and longitude values.');
      }

      await applyLocation(resolvedLat, resolvedLon, nextLang, geoMeta, source);
    } catch (caughtError) {
      setError(formatApiError(caughtError, 'We could not load your weather data right now.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocation({ preferDevice: true, nextLang: 'en' });
  }, []);

  const handleLangToggle = async (nextLang) => {
    if (!geo || nextLang === lang) return;
    setLang(nextLang);
    setError('');
    try {
      const weatherResult = await getWeather(geo.lat, geo.lon, nextLang);
      setWeather(weatherResult.data);
      setQuota({
        limit: weatherResult.limit,
        remaining: weatherResult.remaining,
        reset: weatherResult.reset,
      });
    } catch (caughtError) {
      setError(formatApiError(caughtError, 'We could not switch the language right now.'));
    }
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    const latitude = Number.parseFloat(manualLat);
    const longitude = Number.parseFloat(manualLon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('Please enter a valid latitude and longitude.');
      return;
    }
    setLocationSource('manual');
    await loadLocation({
      preferDevice: false,
      latitude,
      longitude,
      nextLang: lang,
    });
  };

  const handleUseDeviceLocation = async () => {
    setLocationSource('device');
    await loadLocation({ preferDevice: true, nextLang: lang });
  };

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[#2d6a4f]/20 bg-[#2D6A4F] px-4 py-3 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <div className="text-lg font-semibold tracking-tight">FarmSight</div>
          </div>
          <QuotaBadge quota={quota} />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Weather and farm intelligence</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            Simple weather updates and tree checks for Kenyan smallholder farmers.
          </p>
        </div>

        {error ? (
          <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Location</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {geo?.city || 'Use your device location'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {geo?.source === 'manual'
                    ? 'Using your entered coordinates'
                    : geo?.source === 'backend'
                      ? 'Using backend location lookup'
                      : geo?.source === 'device'
                        ? 'Using your current device location'
                        : 'Enter coordinates if location permission is blocked'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleUseDeviceLocation}
                className="rounded-full border border-[#2D6A4F] bg-white px-4 py-2 text-sm font-semibold text-[#2D6A4F]"
              >
                {locating ? 'Finding location...' : 'Use my location'}
              </button>
            </div>

            <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleManualSubmit}>
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#2D6A4F]"
                placeholder="Latitude"
                inputMode="decimal"
                value={manualLat}
                onChange={(event) => setManualLat(event.target.value)}
              />
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#2D6A4F]"
                placeholder="Longitude"
                inputMode="decimal"
                value={manualLon}
                onChange={(event) => setManualLon(event.target.value)}
              />
              <button
                type="submit"
                className="rounded-xl bg-[#2D6A4F] px-5 py-3 text-base font-semibold text-white transition hover:opacity-95"
              >
                Load weather
              </button>
            </form>
          </div>

          {loading ? <SkeletonCard className="h-56" /> : null}
          <CurrentWeather weather={weather} city={geo?.city} region={geo?.region} lang={lang} onLangToggle={handleLangToggle} />
          <ForecastStrip forecast={weather?.forecast ?? []} />
          <TreeAnalyzer />
        </section>
      </div>
    </main>
  );
}
