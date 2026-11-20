import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { gsap } from '../../lib/gsap.js'
import { ScrollTrigger } from '../../lib/gsap.js'
import { prefersReducedMotion } from '../../hooks/useEnvironment.js'

/**
 * Animated <Outlet/>: the current page fades/slides out (≈180ms), the next
 * page fades/slides in (≈420ms). The outgoing element is frozen via useOutlet
 * so it keeps rendering the old route during the exit animation.
 *
 * @param getKey  (location) => string — what counts as a "page change"
 */
export function TransitionOutlet({ getKey = (l) => l.pathname, className }) {
  const location = useLocation()
  const outlet = useOutlet()
  const key = getKey(location)
  const [display, setDisplay] = useState({ key, outlet })
  const ref = useRef(null)
  const first = useRef(true)

  useLayoutEffect(() => {
    if (key === display.key) return
    const el = ref.current
    const swap = () => {
      setDisplay({ key, outlet })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    if (!el || prefersReducedMotion()) return swap()
    const tween = gsap.to(el, { opacity: 0, y: -8, duration: 0.18, ease: 'power1.in', onComplete: swap })
    return () => tween.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useLayoutEffect(() => {
    const el = ref.current
    if (first.current) {
      first.current = false
      return
    }
    if (!el) return
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0 })
    } else {
      gsap.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out', clearProps: 'transform' })
    }
    // new page → layout changed, recompute scroll trigger positions
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [display.key])

  return (
    <div ref={ref} className={className}>
      {/* same page → render the live outlet; during a transition → the frozen one */}
      {display.key === key ? outlet : display.outlet}
    </div>
  )
}

export default TransitionOutlet
