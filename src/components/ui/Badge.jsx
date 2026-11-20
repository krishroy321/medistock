import { cn } from '../../lib/cn.js'
import { STATUS_META } from '../../lib/inventory.js'

const TONES = {
  brand: 'bg-brand-50 text-brand-800 ring-brand-600/15 dark:bg-brand-400/10 dark:text-brand-200 dark:ring-brand-400/20',
  blue: 'bg-accent-50 text-accent-800 ring-accent-600/15 dark:bg-accent-400/10 dark:text-accent-200 dark:ring-accent-400/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20',
  red: 'bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-400/10 dark:text-red-300 dark:ring-red-400/20',
  neutral: 'bg-surface-2 text-muted ring-line',
  dark: 'bg-zinc-800 text-zinc-100 ring-zinc-900/10 dark:bg-zinc-200 dark:text-zinc-900 dark:ring-white/10',
}

const DOTS = {
  brand: 'bg-healthy',
  blue: 'bg-accent-500',
  amber: 'bg-low',
  red: 'bg-expiring',
  neutral: 'bg-subtle',
  dark: 'bg-zinc-300 dark:bg-zinc-700',
}

/**
 * Badge
 * @param tone brand | blue | amber | red | neutral | dark
 * @param dot  show a leading status dot
 * @param pulse pulse the dot (use only for urgent states)
 */
export function Badge({ tone = 'neutral', dot = false, pulse = false, size = 'md', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && <span className={cn('absolute inline-flex h-full w-full rounded-full animate-pulse-soft', DOTS[tone])} />}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', DOTS[tone])} />
        </span>
      )}
      {children}
    </span>
  )
}

/** Status badge driven by inventory status keys: healthy | low | expiring | expired | out */
export function StatusBadge({ status, size, pulse, className }) {
  const meta = STATUS_META[status] ?? STATUS_META.healthy
  return (
    <Badge tone={meta.tone} dot size={size} pulse={pulse ?? (status === 'expired')} className={className}>
      {meta.label}
    </Badge>
  )
}

export default Badge
