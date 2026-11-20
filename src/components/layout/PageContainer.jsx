import { cn } from '../../lib/cn.js'

/** Constrains page width and applies consistent page padding. */
export function PageContainer({ className, children, as: Tag = 'div', ...props }) {
  return (
    <Tag className={cn('mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8', className)} {...props}>
      {children}
    </Tag>
  )
}

/**
 * Page header used at the top of every app page.
 * Elements carry data-animate so useEntrance() can stagger them in.
 */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col gap-4 pb-6 pt-8 sm:pt-10 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0" data-animate>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-bold text-fg sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-[15px]">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2" data-animate>
          {actions}
        </div>
      )}
    </div>
  )
}

export default PageContainer
