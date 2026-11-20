import { useEffect, useState, useRef } from 'react'
import { useStore } from '../store/useStore.js'

/** Reactive media query. */
export function useMediaQuery(query) {
  const get = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false)
  const [matches, setMatches] = useState(get)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** True when the OS asks for reduced motion OR the user enabled it in MediStock. */
export function useReducedMotion() {
  const system = useMediaQuery('(prefers-reduced-motion: reduce)')
  const pref = useStore((s) => s.reduceMotion)
  return system || pref
}

/** Non-hook check (for use inside GSAP callbacks). */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches || useStore.getState().reduceMotion
}

/**
 * Device tier for 3D complexity:
 *  'low'  — phones / coarse pointer / small screens → simplified scenes
 *  'mid'  — tablets & small laptops → reduced complexity
 *  'high' — desktop → full experience
 */
export function useDeviceTier() {
  const small = useMediaQuery('(max-width: 767px)')
  const medium = useMediaQuery('(max-width: 1199px)')
  const coarse = useMediaQuery('(pointer: coarse)')
  if (small) return 'low'
  if (medium || coarse) return 'mid'
  const cores = navigator.hardwareConcurrency || 8
  return cores <= 4 ? 'mid' : 'high'
}

let webglSupport
/** Whether WebGL is available at all. */
export function hasWebGL() {
  if (webglSupport !== undefined) return webglSupport
  try {
    const c = document.createElement('canvas')
    webglSupport = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    webglSupport = false
  }
  return webglSupport
}

/** Should 3D render? (user toggle + WebGL support) */
export function use3DEnabled() {
  const enabled = useStore((s) => s.enable3D)
  return enabled && hasWebGL()
}

/**
 * IntersectionObserver hook. Returns [ref, inView].
 * Use `rootMargin` to mount heavy content slightly before it scrolls in.
 */
export function useInView({ rootMargin = '200px', once = false, threshold = 0 } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) io.disconnect()
      },
      { rootMargin, threshold },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [rootMargin, once, threshold])
  return [ref, inView]
}
