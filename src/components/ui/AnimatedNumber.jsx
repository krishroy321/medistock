import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../../lib/gsap.js'
import { prefersReducedMotion } from '../../hooks/useEnvironment.js'
import { formatNumber } from '../../lib/format.js'

/**
 * Number that counts up with GSAP when it scrolls into view (once), and
 * tweens smoothly when `value` changes afterwards.
 * @param format (n) => string  defaults to Indian-locale integer formatting
 * @param startOnView  false → animate immediately on mount
 */
export function AnimatedNumber({ value, format = formatNumber, duration = 1.4, startOnView = true, className, ...props }) {
  const ref = useRef(null)
  const state = useRef({ n: 0, played: false })

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      const render = () => (el.textContent = format(state.current.n))
      if (prefersReducedMotion()) {
        state.current.n = value
        state.current.played = true
        render()
        return
      }
      const play = () => {
        gsap.to(state.current, { n: value, duration: state.current.played ? 0.6 : duration, ease: 'power2.out', onUpdate: render, overwrite: true })
        state.current.played = true
      }
      if (state.current.played || !startOnView) return play()
      render()
      const st = ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: play })
      return () => st.kill()
    },
    { dependencies: [value] },
  )

  return (
    <span ref={ref} className={className} {...props}>
      {format(prefersReducedMotion() ? value : 0)}
    </span>
  )
}

export default AnimatedNumber
