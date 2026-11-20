import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/motion.js'
import { useReducedMotion as useEnvironmentReducedMotion } from './useEnvironment.js'

function currentElement(ref) {
  return ref?.current
}

export function useReducedMotion() {
  const environmentReduced = useEnvironmentReducedMotion()
  const [mediaReduced, setMediaReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setMediaReduced(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  return environmentReduced || mediaReduced
}

export function useReveal({ selector = '[data-reveal]', start = 'top 82%' } = {}) {
  const root = useRef(null)
  const reduced = useReducedMotion()
  useEffect(() => {
    if (!root.current) return undefined
    const context = gsap.context(() => {
      const elements = root.current.querySelectorAll(selector)
      gsap.set(elements, { opacity: reduced ? 1 : 0, y: reduced ? 0 : 24 })
      if (reduced) return
      elements.forEach((element) => {
        gsap.to(element, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'expo.out',
          scrollTrigger: { trigger: element, start, once: true },
        })
      })
    }, root)
    return () => context.revert()
  }, [reduced, selector, start])
  return root
}

export function useScrollProgress({ trigger, onUpdate }) {
  const reduced = useReducedMotion()
  useEffect(() => {
    const element = currentElement(trigger)
    if (!element || reduced) return undefined
    const context = gsap.context(() => {
      gsap.to({}, {
        scrollTrigger: {
          trigger: element,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.8,
          onUpdate: (self) => onUpdate?.(self.progress),
        },
      })
    }, element)
    return () => context.revert()
  }, [onUpdate, reduced, trigger])
}
