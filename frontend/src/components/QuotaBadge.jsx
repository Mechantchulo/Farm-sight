export default function QuotaBadge({ quota }) {
  if (quota?.remaining === null || quota?.remaining === undefined) return null;

  const remaining = Number.parseInt(quota.remaining, 10) || 0;
  const limits = Number.parseInt(quota.limit, 10) || 1000;
  let background = '#2D6A4F';

  if (remaining <= 50) {
    background = '#e63946';
  } else if (remaining <= 200) {
    background = '#F4A261';
  }

  return (
    <div
      className="inline-flex max-w-full items-center rounded-full px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm sm:px-3 sm:text-sm"
      style={{ backgroundColor: background }}
      aria-label={`${remaining} of ${limits} requests remaining`}
    >
      <span className="truncate">{remaining.toLocaleString()} / {limits.toLocaleString()} requests</span>
    </div>
  );
}
