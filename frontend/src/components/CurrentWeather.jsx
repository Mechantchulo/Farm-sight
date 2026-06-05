function conditionLabel(conditionCode) {
  const code = String(conditionCode ?? '');
  const labels = {
    0: 'Clear sky',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Cloudy',
    45: 'Foggy',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Heavy drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    80: 'Rain showers',
    81: 'Heavy showers',
    82: 'Violent showers',
  };
  return labels[code] ?? `Condition ${code || '--'}`;
}

export default function CurrentWeather({ weather, city, region, lang, onLangToggle }) {
  if (!weather) return null;

  const current = weather.current ?? {};
  const details = current.current ?? {};
  const aiSummary = current.ai_summary;
  const iconUrl = details.icon;
  const temperature = details.temperature;
  const country = current.location?.country;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Current Weather</p>

      <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#E7F0E9] sm:h-20 sm:w-20">
            {iconUrl ? <img src={iconUrl} width="56" height="56" alt={details.condition_code ?? 'weather icon'} /> : null}
          </div>
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-bold text-slate-900 sm:text-3xl">{city || 'Your area'}</h2>
            <p className="break-words text-sm text-slate-500">
              {region || city || 'Local area'}
              {country ? `, ${country}` : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center md:ml-auto">
          <button
            type="button"
            onClick={() => onLangToggle('en')}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              lang === 'en'
                ? 'border-[#2D6A4F] bg-[#2D6A4F] text-white'
                : 'border-[#2D6A4F] bg-white text-[#2D6A4F]'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onLangToggle('sw')}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              lang === 'sw'
                ? 'border-[#2D6A4F] bg-[#2D6A4F] text-white'
                : 'border-[#2D6A4F] bg-white text-[#2D6A4F]'
            }`}
          >
            SW
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
        <div className="flex items-end gap-1">
          <span className="text-5xl font-bold leading-none tracking-tight text-[#2D6A4F] sm:text-6xl">
            {Number.isFinite(temperature) ? Math.round(temperature) : '--'}
          </span>
          <span className="pb-1 text-xl text-slate-500">°C</span>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <span>
            Wind <strong className="text-slate-800">{Number.isFinite(details.wind_speed) ? `${details.wind_speed} km/h` : '-- km/h'}</strong>
          </span>
          <span>{conditionLabel(details.condition_code)}</span>
        </div>
      </div>

      <div className={`mt-5 rounded-2xl border-l-4 p-4 ${aiSummary ? 'border-[#2D6A4F] bg-[#eef6ef]' : 'border-slate-300 bg-[#f7f5ef]'}`}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">AI Insight</p>
        <p className="mt-1 break-words text-sm text-slate-500">{aiSummary ?? 'AI summaries available on Pro plan'}</p>
      </div>
    </section>
  );
}
