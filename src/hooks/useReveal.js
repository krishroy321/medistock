import { gsap, ScrollTrigger, useGSAP, MOTION } from '../lib/gsap.js'
import { prefersReducedMotion } from './useEnvironment.js'

/**
 * Scroll-reveal: children matching `selector` inside `scope` fade upward
 * once when they enter the viewport. Respects reduced motion.
 *
 *   const ref = useRef(null)
 *   useReveal(ref, { selector: '[data-reveal]' })
 */
export function useReveal(scope, { selector = '[data-reveal]', y = 24, stagger = MOTION.stagger, start = 'top 85%', deps = [] } = {}) {
  useGSAP(
    () => {
      const items = gsap.utils.toArray(selector, scope.current)
      if (!items.length) return
      if (prefersReducedMotion()) {
        gsap.set(items, { opacity: 1, y: 0 })
        return
      }
      gsap.set(items, { opacity: 0, y })
      ScrollTrigger.batch(items, {
        start,
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: MOTION.slow, stagger, ease: MOTION.ease, overwrite: true }),
      })
    },
    { scope, dependencies: deps },
  )
}

/**
 * Entrance animation on mount (no scroll trigger) — for dashboard pages.
 */
export function useEntrance(scope, { selector = '[data-animate]', y = 16, stagger = MOTION.stagger, delay = 0.05, deps = [] } = {}) {
  useGSAP(
    () => {
      const items = gsap.utils.toArray(selector, scope.current)
      if (!items.length || prefersReducedMotion()) return
      gsap.from(items, { opacity: 0, y, duration: MOTION.base, stagger, delay, ease: MOTION.ease, clearProps: 'opacity,transform' })
    },
    { scope, dependencies: deps },
  )
}
