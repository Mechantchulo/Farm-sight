function dayLabel(dateString, index) {
  const date = new Date(dateString);
  if (index === 0) return 'Today';
  if (Number.isNaN(date.getTime())) return 'Day';
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export default function ForecastStrip({ forecast = [] }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">7-Day Forecast</p>

      <div className="mt-4 relative">
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white to-transparent lg:hidden" />
        <div className="grid auto-cols-[minmax(92px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2 pr-8 lg:grid-flow-row lg:grid-cols-7 lg:overflow-visible lg:pb-0 lg:pr-0">
          {forecast.slice(0, 7).map((day, index) => {
            const isToday = index === 0;
            return (
              <article
                key={day.date ?? index}
                className={`min-w-0 rounded-2xl border bg-white px-3 py-4 text-center ${
                  isToday ? 'border-[#2D6A4F] ring-2 ring-[#2D6A4F]/10' : 'border-slate-200'
                }`}
              >
                <p className="text-sm font-semibold text-slate-700">{dayLabel(day.date, index)}</p>
                {day.icon ? <img src={day.icon} alt={day.condition_code ?? 'forecast icon'} className="mx-auto my-2 h-10 w-10" /> : null}
                <p className="text-lg font-bold text-slate-900">{Math.round(day.temp_max)}°</p>
                <p className="text-sm text-slate-500">{Math.round(day.temp_min)}°</p>
                {day.precipitation_probability > 20 ? (
                  <span className="mt-3 inline-flex rounded-full bg-[#F4A261]/20 px-2 py-1 text-[11px] font-semibold text-[#9a5b17]">
                    {day.precipitation_probability}% rain
                  </span>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
