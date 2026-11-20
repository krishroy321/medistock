import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn.js'

const VARIANTS = {
  primary:
    'bg-brand-700 text-white shadow-[0_1px_0_rgb(255_255_255/0.12)_inset,0_6px_16px_-6px_rgb(24_98_87/0.55)] hover:bg-brand-800 hover:shadow-[0_1px_0_rgb(255_255_255/0.12)_inset,0_10px_22px_-8px_rgb(24_98_87/0.6)] dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400',
  secondary: 'bg-surface text-fg border border-line shadow-soft hover:border-line-strong hover:bg-surface-2',
  outline: 'border border-brand-600/30 text-brand-700 hover:bg-brand-50 hover:border-brand-600/50 dark:text-brand-300 dark:border-brand-400/30 dark:hover:bg-brand-400/10',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
  soft: 'bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-400/10 dark:text-brand-200 dark:hover:bg-brand-400/15',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-[0_6px_16px_-6px_rgb(220_38_38/0.5)]',
  dark: 'bg-fg text-page hover:opacity-90',
}

const SIZES = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2.5 rounded-xl',
  icon: 'h-9 w-9 rounded-xl justify-center',
  'icon-sm': 'h-8 w-8 rounded-lg justify-center',
}

/**
 * Button
 * @param variant primary | secondary | outline | ghost | soft | danger | dark
 * @param size xs | sm | md | lg | icon | icon-sm
 * @param icon / iconRight  Lucide icon component
 * @param to  render as a react-router <Link>
 * @param href render as <a>
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, to, href, className, children, loading, disabled, type = 'button', ...props },
  ref,
) {
  const iconSize = size === 'xs' || size === 'sm' || size === 'icon-sm' ? 15 : size === 'lg' ? 18 : 16
  const classes = cn(
    'group/btn relative inline-flex shrink-0 select-none items-center font-medium whitespace-nowrap transition-all duration-200 ease-out',
    'hover:-translate-y-px active:translate-y-0 disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
  const content = (
    <>
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />
      ) : (
        Icon && <Icon size={iconSize} strokeWidth={2} aria-hidden className="transition-transform duration-200 group-hover/btn:scale-105" />
      )}
      {children}
      {IconRight && <IconRight size={iconSize} strokeWidth={2} aria-hidden className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />}
    </>
  )
  if (to)
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    )
  if (href)
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {content}
      </a>
    )
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
})

export default Button
