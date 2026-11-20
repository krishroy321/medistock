export function FloatingDataCard({ label, value, detail, className = '' }) {
  return <div className={`rounded-2xl border border-white/60 bg-white/80 p-3 shadow-lift backdrop-blur-md dark:border-white/10 dark:bg-surface/80 ${className}`}><p className="text-[9px] font-bold uppercase tracking-[.18em] text-brand-700 dark:text-brand-300">{label}</p><p className="mt-1 font-display text-xl font-bold tracking-tight text-fg">{value}</p>{detail && <p className="mt-0.5 text-[11px] text-muted">{detail}</p>}</div>
}
