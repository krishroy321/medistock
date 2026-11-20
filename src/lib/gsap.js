import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

gsap.defaults({ ease: 'power3.out', duration: 0.6 })

/** Motion tokens — keep durations consistent across the app (seconds). */
export const MOTION = {
  fast: 0.25,
  base: 0.45,
  slow: 0.7,
  stagger: 0.06,
  ease: 'power3.out',
  easeInOut: 'power2.inOut',
}

export { gsap, ScrollTrigger, useGSAP }
