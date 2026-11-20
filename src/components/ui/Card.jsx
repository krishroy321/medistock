import { forwardRef } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Card — the base surface.
 * @param interactive adds hover elevation + border highlight
 * @param padding none | sm | md | lg
 */
export const Card = forwardRef(function Card({ as: Tag = 'div', interactive = false, padding = 'md', className, children, ...props }, ref) {
  return (
    <Tag
      ref={ref}
      className={cn(
        'rounded-[var(--radius-card)] border border-line bg-surface shadow-card',
        interactive && 'transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-brand-500/35 hover:shadow-lift',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-5 sm:p-6',
        padding === 'lg' && 'p-6 sm:p-8',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
})

/** Standard card header: title, optional description and right-aligned actions. */
export function CardHeader({ title, description, icon: Icon, actions, className }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
            <Icon size={18} aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

export default Card
