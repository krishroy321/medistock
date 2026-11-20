import { useLayoutEffect, useRef } from 'react'
import { CheckCircle2, Info, AlertTriangle, XCircle, X, Inbox } from 'lucide-react'
import { gsap } from '../../lib/gsap.js'
import { cn } from '../../lib/cn.js'
import { useStore } from '../../store/useStore.js'
import { prefersReducedMotion } from '../../hooks/useEnvironment.js'

/* ------------------------------------------------------------------ */
/* SegmentedControl — compact tab-like switcher (radio group semantics) */
/* ------------------------------------------------------------------ */
export function SegmentedControl({ options, value, onChange, size = 'md', className, label }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-xl border border-line bg-surface-2 p-1', className)}>
      {options.map((o) => {
        const opt = typeof o === 'string' ? { value: o, label: o } : o
        const active = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all duration-200',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-surface text-fg shadow-soft ring-1 ring-line' : 'text-muted hover:text-fg',
            )}
          >
            {Icon && <Icon size={14} aria-hidden />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* ProgressBar                                                          */
/* ------------------------------------------------------------------ */
const BAR_TONES = { brand: 'bg-brand-500', amber: 'bg-low', red: 'bg-expiring', blue: 'bg-accent-500', dark: 'bg-out' }
export function ProgressBar({ value, max = 100, tone = 'brand', className, label, size = 'md' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('w-full overflow-hidden rounded-full bg-surface-3', size === 'sm' ? 'h-1.5' : 'h-2', className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-700 ease-out', BAR_TONES[tone])} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* EmptyState                                                           */
/* ------------------------------------------------------------------ */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-subtle ring-1 ring-line">
        <Icon size={22} aria-hidden />
      </span>
      <p className="text-sm font-semibold text-fg">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Spinner / page loader                                                */
/* ------------------------------------------------------------------ */
export function Spinner({ className, size = 20 }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn('inline-block animate-spin rounded-full border-2 border-brand-500 border-r-transparent', className)}
      style={{ width: size, height: size }}
    />
  )
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner size={26} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tooltip (CSS-only, appears on hover & focus)                         */
/* ------------------------------------------------------------------ */
export function Tooltip({ content, children, side = 'top', className }) {
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tt:opacity-100 group-focus-within/tt:opacity-100 dark:bg-zinc-100 dark:text-zinc-900',
          side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
        )}
      >
        {content}
      </span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Toaster — renders store toasts (bottom-right)                        */
/* ------------------------------------------------------------------ */
const TOAST_ICON = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: XCircle, neutral: Info }
const TOAST_TONE = {
  success: 'text-healthy',
  info: 'text-accent-500',
  warning: 'text-low',
  error: 'text-expiring',
  neutral: 'text-muted',
}

function Toast({ toast }) {
  const ref = useRef(null)
  const dismiss = useStore((s) => s.dismissToast)
  useLayoutEffect(() => {
    if (!prefersReducedMotion()) gsap.fromTo(ref.current, { opacity: 0, y: 16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'expo.out' })
  }, [])
  const Icon = TOAST_ICON[toast.tone] ?? Info
  return (
    <div ref={ref} className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lift sm:w-96">
      <Icon size={18} className={cn('mt-0.5 shrink-0', TOAST_TONE[toast.tone])} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-[13px] text-muted">{toast.description}</p>}
      </div>
      <button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification" className="-m-1 rounded-lg p-1 text-subtle hover:bg-surface-2 hover:text-fg">
        <X size={15} />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useStore((s) => s.toasts)
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Barcode — renders an EAN-13-like barcode SVG from a digit string     */
/* ------------------------------------------------------------------ */
export function Barcode({ value = '', className, height = 44 }) {
  const bars = []
  let x = 0
  const digits = value.replace(/\D/g, '').split('').map(Number)
  const push = (w, filled) => {
    if (filled) bars.push(<rect key={bars.length} x={x} y={0} width={w} height={height} />)
    x += w
  }
  push(1, true)
  push(1, false)
  push(1, true)
  digits.forEach((d, i) => {
    const pattern = [(d % 3) + 1, ((d + i) % 2) + 1, ((d * 7 + i) % 3) + 1, ((d + 3) % 2) + 1]
    pattern.forEach((w, j) => push(w, j % 2 === 0))
    if (i === 6) {
      push(1, false)
      push(1, true)
      push(1, false)
      push(1, true)
      push(1, false)
    }
  })
  push(1, true)
  push(1, false)
  push(1, true)
  return (
    <svg viewBox={`0 0 ${x} ${height}`} preserveAspectRatio="none" className={cn('h-11 w-full fill-current text-fg', className)} role="img" aria-label={`Barcode ${value}`}>
      {bars}
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Logo                                                                  */
/* ------------------------------------------------------------------ */
export function LogoMark({ size = 30, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-brand-700 dark:fill-brand-500" />
      <rect x="10" y="7" width="12" height="5" rx="1.6" className="fill-brand-200 dark:fill-brand-900" />
      <rect x="8.5" y="11" width="15" height="15" rx="3.5" fill="#fff" />
      <path d="M16 14.5v8M12 18.5h8" stroke="#1c7a6b" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({ className, compact = false }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && <span className="font-display text-[17px] font-bold tracking-tight text-fg">MediStock</span>}
    </span>
  )
}
