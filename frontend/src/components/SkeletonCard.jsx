export default function SkeletonCard({ className = '' }) {
  return <div className={`animate-pulse rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 ${className}`} />;
}
