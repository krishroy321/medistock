import { gsap, ScrollTrigger } from './gsap.js'

export const MOTION = {
  duration: { micro: 0.2, ui: 0.45, reveal: 0.9, scene: 1.4 },
  ease: { out: 'power3.out', inOut: 'power2.inOut', soft: 'expo.out' },
  stagger: { tight: 0.05, base: 0.09, loose: 0.16 },
}

export function killMotionContext(context) {
  context?.revert()
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
}

export { gsap, ScrollTrigger }
