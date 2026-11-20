import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { gsap } from '../../lib/gsap.js'
import { cn } from '../../lib/cn.js'
import { prefersReducedMotion } from '../../hooks/useEnvironment.js'

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])'

let openCount = 0

/**
 * Shared overlay behaviour: mount/unmount with GSAP enter/exit, focus trap,
 * Escape to close, body scroll lock, focus restore.
 */
function useOverlay({ open, onClose, enter, exit }) {
  const [mounted, setMounted] = useState(open)
  const overlayRef = useRef(null)
  const panelRef = useRef(null)
  const restoreRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (open) setMounted(true)
  }, [open])

  useLayoutEffect(() => {
    if (!mounted || !overlayRef.current || !panelRef.current) return
    const reduce = prefersReducedMotion()
    const ctx = gsap.context(() => {
      if (open) {
        enter(overlayRef.current, panelRef.current, reduce)
      } else {
        exit(overlayRef.current, panelRef.current, reduce, () => setMounted(false))
      }
    })
    return () => ctx.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted])

  // Focus management + scroll lock
  useEffect(() => {
    if (!open || !mounted) return
    restoreRef.current = document.activeElement
    openCount++
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      const auto = panel.querySelector('[data-autofocus]')
      const first = auto || panel.querySelector(FOCUSABLE)
      ;(first || panel).focus({ preventScroll: true })
    }, 30)
    return () => {
      clearTimeout(t)
      openCount = Math.max(0, openCount - 1)
      if (!openCount) document.body.style.overflow = ''
      const r = restoreRef.current
      if (r && typeof r.focus === 'function') setTimeout(() => r.focus({ preventScroll: true }), 0)
    }
  }, [open, mounted])

  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onCloseRef.current?.()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const nodes = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null)
    if (!nodes.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  return { mounted, overlayRef, panelRef, onKeyDown }
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  full: 'max-w-[min(1400px,96vw)]',
}

/**
 * Modal dialog (GSAP animated, accessible).
 * @param open, onClose
 * @param title, description  rendered in the header (also used for aria labelling)
 * @param size sm | md | lg | xl | 2xl | full
 * @param footer  node rendered in a sticky footer
 * @param bare  render children only (no header/padding) — for custom layouts
 */
export function Modal({ open, onClose, title, description, size = 'md', footer, bare = false, className, children, labelledBy }) {
  const { mounted, overlayRef, panelRef, onKeyDown } = useOverlay({
    open,
    onClose,
    enter: (o, p, reduce) => {
      gsap.fromTo(o, { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.25, ease: 'power1.out' })
      gsap.fromTo(p, { opacity: 0, y: 28, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: reduce ? 0 : 0.5, ease: 'expo.out' })
    },
    exit: (o, p, reduce, done) => {
      gsap.to(p, { opacity: 0, y: 16, scale: 0.98, duration: reduce ? 0 : 0.2, ease: 'power2.in' })
      gsap.to(o, { opacity: 0, duration: reduce ? 0 : 0.22, delay: reduce ? 0 : 0.05, onComplete: done })
    },
  })
  const titleId = `modal-title-${useId()}`
  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" onKeyDown={onKeyDown}>
      <div ref={overlayRef} className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[6px] dark:bg-black/60" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || (title ? titleId : undefined)}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-surface shadow-modal outline-none sm:rounded-3xl',
          SIZES[size],
          className,
        )}
      >
        {bare ? (
          children
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
              <div className="min-w-0">
                {title && (
                  <h2 id={titleId} className="text-lg font-semibold text-fg">
                    {title}
                  </h2>
                )}
                {description && <p className="mt-1 text-sm text-muted">{description}</p>}
              </div>
              <button onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg">
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-surface-2/60 px-6 py-4">{footer}</div>}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

/**
 * Drawer — slides in from the right (notification center, filters, mobile nav).
 * @param side right | left
 */
export function Drawer({ open, onClose, title, side = 'right', width = 'max-w-md', className, children, header, footer, labelledBy }) {
  const dir = side === 'right' ? 1 : -1
  const { mounted, overlayRef, panelRef, onKeyDown } = useOverlay({
    open,
    onClose,
    enter: (o, p, reduce) => {
      gsap.fromTo(o, { opacity: 0 }, { opacity: 1, duration: reduce ? 0 : 0.25 })
      gsap.fromTo(p, { xPercent: 100 * dir }, { xPercent: 0, duration: reduce ? 0 : 0.5, ease: 'expo.out' })
    },
    exit: (o, p, reduce, done) => {
      gsap.to(p, { xPercent: 100 * dir, duration: reduce ? 0 : 0.3, ease: 'power3.in' })
      gsap.to(o, { opacity: 0, duration: reduce ? 0 : 0.3, onComplete: done })
    },
  })
  const titleId = `drawer-title-${useId()}`
  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]" onKeyDown={onKeyDown}>
      <div ref={overlayRef} className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[3px] dark:bg-black/50" onClick={onClose} aria-hidden />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || (title ? titleId : undefined)}
        tabIndex={-1}
        className={cn('absolute top-0 flex h-full w-full flex-col border-line bg-surface shadow-modal outline-none', side === 'right' ? 'right-0 border-l' : 'left-0 border-r', width, className)}
      >
        {header ?? (
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 id={titleId} className="text-base font-semibold text-fg">
              {title}
            </h2>
            <button onClick={onClose} aria-label="Close panel" className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer}
      </aside>
    </div>,
    document.body,
  )
}

export default Modal
