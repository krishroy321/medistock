import { useEffect, useLayoutEffect, useRef, useState, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from '../../lib/gsap.js'
import { cn } from '../../lib/cn.js'
import { prefersReducedMotion } from '../../hooks/useEnvironment.js'

/**
 * Accessible dropdown menu (menu button pattern).
 *
 * <Dropdown
 *   trigger={({ open, ...props }) => <button {...props}>Menu</button>}
 *   items={[{ label, icon, onClick, to, danger }, { divider: true }, { header: 'Signed in as …' }]}
 *   align="end"
 * />
 */
export function Dropdown({ trigger, items = [], align = 'end', width = 'w-56', className, label = 'Open menu' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const menuRef = useRef(null)
  const btnRef = useRef(null)
  const id = useId()
  const navigate = useNavigate()
  const actionable = items.filter((i) => !i.divider && !i.header)

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])

  useLayoutEffect(() => {
    if (!open || !menuRef.current) return
    if (!prefersReducedMotion()) gsap.fromTo(menuRef.current, { opacity: 0, y: -6, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' })
    menuRef.current.querySelector('[role="menuitem"]')?.focus()
  }, [open])

  const focusItem = (dir) => {
    const nodes = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])]
    const i = nodes.indexOf(document.activeElement)
    const next = nodes[(i + dir + nodes.length) % nodes.length]
    next?.focus()
  }

  const onMenuKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusItem(1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      focusItem(-1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      btnRef.current?.focus()
    } else if (e.key === 'Tab') setOpen(false)
  }

  const select = (item) => {
    setOpen(false)
    if (item.to) navigate(item.to)
    item.onClick?.()
  }

  const triggerProps = {
    ref: btnRef,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? id : undefined,
    'aria-label': label,
    onClick: (e) => {
      e.stopPropagation()
      setOpen((v) => !v)
    },
    onKeyDown: (e) => {
      if (e.key === 'ArrowDown' && !open) {
        e.preventDefault()
        setOpen(true)
      }
    },
  }

  return (
    <div ref={rootRef} className={cn('relative inline-flex', className)}>
      {trigger({ open, ...triggerProps })}
      {open && actionable.length > 0 && (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          onKeyDown={onMenuKey}
          className={cn(
            'absolute top-full z-[60] mt-2 origin-top overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift',
            align === 'end' ? 'right-0' : 'left-0',
            width,
          )}
        >
          {items.map((item, i) => {
            if (item.divider) return <div key={i} className="my-1.5 h-px bg-line" role="separator" />
            if (item.header)
              return (
                <div key={i} className="px-3 pb-2 pt-1.5">
                  {item.header}
                </div>
              )
            const Icon = item.icon
            return (
              <button
                key={i}
                role="menuitem"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation()
                  select(item)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium outline-none transition-colors',
                  item.danger ? 'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10 dark:focus:bg-red-400/10' : 'text-fg hover:bg-surface-2 focus:bg-surface-2',
                )}
              >
                {Icon && <Icon size={15} className={item.danger ? '' : 'text-muted'} aria-hidden />}
                <span className="flex-1">{item.label}</span>
                {item.hint && <span className="text-[11px] text-subtle">{item.hint}</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Dropdown
