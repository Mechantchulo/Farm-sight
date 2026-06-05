import { useRef, useState } from 'react';
import { formatApiError, getTrees } from '../services/api';

function PreviewCard({ src, label, placeholder }) {
  const isPlaceholder = !src || src.startsWith('/mock/');

  return (
    <div className="min-w-0">
      <div className="flex aspect-[4/3] min-h-36 items-center justify-center rounded-2xl bg-[#f3f1ea] text-center text-sm text-slate-400 ring-1 ring-slate-200 sm:min-h-40">
        {isPlaceholder ? (
          <div className="px-3">
            <div className="break-words text-sm font-medium text-slate-400 sm:text-base">{placeholder}</div>
          </div>
        ) : (
          <img src={src} alt={label} className="h-full w-full rounded-2xl object-cover" />
        )}
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-slate-600">{label}</p>
    </div>
  );
}

export default function TreeAnalyzer() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [farmerId, setFarmerId] = useState('');
  const [county, setCounty] = useState('');
  const [landAcres, setLandAcres] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleDrop = (event) => {
    event.preventDefault();
    setFile(event.dataTransfer.files?.[0] ?? null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please choose an image first.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      if (farmerId) formData.append('farmerId', farmerId);
      if (county) formData.append('county', county);
      if (landAcres) formData.append('landAcres', landAcres);
      if (location) formData.append('location', location);
      if (notes) formData.append('notes', notes);
      const data = await getTrees(formData);
      setResult(data);
    } catch (caughtError) {
      setError(formatApiError(caughtError, 'Tree analysis failed.'));
    } finally {
      setLoading(false);
    }
  };

  const healthy = result?.tree_health?.healthy ?? 0;
  const needsCare = result?.tree_health?.needs_care ?? 0;
  const needsReplacement = result?.tree_health?.needs_replacement ?? 0;
  const totalHealth = healthy + needsCare + needsReplacement || 1;
  const healthyPct = (healthy / totalHealth) * 100;
  const carePct = (needsCare / totalHealth) * 100;
  const replacementPct = (needsReplacement / totalHealth) * 100;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:rounded-3xl sm:p-6">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Analyze Your Farm</p>

      <form className="mt-4 grid gap-3" onSubmit={submit}>
        <label
          className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-[#faf8f2] px-4 py-6 text-center transition hover:border-[#2D6A4F] sm:rounded-3xl"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="text-4xl">🌳</div>
          <p className="mt-2 text-base text-slate-700">Tap to upload a farm photo</p>
          <p className="mt-1 text-sm text-slate-400">Drone or aerial image · JPEG, PNG, WEBP</p>
          <input ref={inputRef} className="hidden" type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <button
            className="mt-4 max-w-full truncate rounded-full border border-[#2D6A4F] bg-white px-4 py-2 text-sm font-semibold text-[#2D6A4F]"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            {file ? file.name : 'Choose file'}
          </button>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#2D6A4F]"
            placeholder="County (e.g. Bomet)"
            value={county}
            onChange={(event) => setCounty(event.target.value)}
          />
          <input
            className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#2D6A4F]"
            placeholder="Land size in acres"
            value={landAcres}
            onChange={(event) => setLandAcres(event.target.value)}
          />
        </div>

        <input
          className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-[#2D6A4F]"
          placeholder="Notes (e.g. Tea plantation, recently pruned)"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        <button
          className="rounded-xl bg-[#2D6A4F] px-5 py-3 text-base font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Analyzing...' : 'Analyze farm'}
        </button>
      </form>

      {error ? <div className="mt-4 break-words rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</div> : null}

      {result ? (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
            Results {result.original_image_url?.startsWith('/mock/') ? '— Demo Data' : ''}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f7f5ef] px-4 py-5 text-center">
              <div className="text-sm text-slate-500">Trees found</div>
              <div className="mt-1 break-words text-3xl font-bold text-[#2D6A4F]">{result.total_tree_count}</div>
            </div>
            <div className="rounded-2xl bg-[#f7f5ef] px-4 py-5 text-center">
              <div className="text-sm text-slate-500">Canopy cover</div>
              <div className="mt-1 text-3xl font-bold text-[#2D6A4F]">{Math.round(result.canopy_coverage_pct)}%</div>
            </div>
            <div className="rounded-2xl bg-[#f7f5ef] px-4 py-5 text-center">
              <div className="text-sm text-slate-500">Confidence</div>
              <div className="mt-1 text-3xl font-bold text-[#2D6A4F]">{Math.round(result.confidence_score * 100)}%</div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Tree Health</p>
            <div className="mt-3 h-4 overflow-hidden rounded-full bg-slate-100">
              <div className="flex h-full w-full">
                <div className="h-full bg-[#2D6A4F]" style={{ width: `${healthyPct}%` }} />
                <div className="h-full bg-[#F4A261]" style={{ width: `${carePct}%` }} />
                <div className="h-full bg-[#e63946]" style={{ width: `${replacementPct}%` }} />
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#2D6A4F]" />{healthy} healthy</span>
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#F4A261]" />{needsCare} need care</span>
              <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-[#e63946]" />{needsReplacement} need replacement</span>
            </div>
            {result.tree_species_guess ? (
              <p className="mt-3 break-words italic text-slate-600">
                Detected species: <span className="font-medium text-slate-700">{result.tree_species_guess}</span>
              </p>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <PreviewCard src={result.original_image_url} label="Original photo" placeholder="Image preview available on live deployment" />
            <PreviewCard src={result.overlay_image_url} label="Annotated overlay" placeholder="Annotated overlay available on live deployment" />
          </div>

          {result.observations?.length ? (
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">What we found</p>
              <ul className="mt-3 divide-y divide-slate-200 rounded-2xl bg-white">
                {result.observations.map((item) => (
                  <li key={item} className="flex gap-3 px-2 py-3 text-sm text-slate-700">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#2D6A4F]" />
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.recommendations?.length ? (
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">What to do</p>
              <div className="mt-3 grid gap-3">
                {result.recommendations.map((item) => (
                  <div key={item} className="break-words rounded-2xl border-l-4 border-[#2D6A4F] bg-[#f7fbf7] px-4 py-3 text-sm text-slate-700">
                    ✓ {item}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
