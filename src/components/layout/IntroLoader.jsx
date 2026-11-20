import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'
import { useReducedMotion } from '../../hooks/useMotion.js'

function LoaderProgress({ onProgress }) {
  const { progress } = useProgress()
  useEffect(() => onProgress(progress), [onProgress, progress])
  return null
}

export function LoaderProgressBridge({ onProgress }) {
  return <LoaderProgress onProgress={onProgress} />
}

export function IntroLoader({ progress = 0, onComplete }) {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(() => sessionStorage.getItem('medistock-intro-seen') !== '1')
  useEffect(() => {
    if (!visible) return undefined
    if (reduced || progress >= 98) {
      const timer = window.setTimeout(() => {
        sessionStorage.setItem('medistock-intro-seen', '1')
        setVisible(false)
        onComplete?.()
      }, reduced ? 0 : 180)
      return () => window.clearTimeout(timer)
    }
    const timer = window.setTimeout(() => {
      sessionStorage.setItem('medistock-intro-seen', '1')
      setVisible(false)
      onComplete?.()
    }, 4000)
    return () => window.clearTimeout(timer)
  }, [onComplete, progress, reduced, visible])
  if (!visible) return null
  return <div className="intro-loader fixed inset-0 z-[100] grid place-items-center bg-page" aria-live="polite"><div className="w-56 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-700 text-lg font-bold text-white">M</div><p className="mt-5 font-display text-xl font-bold">MediStock</p><p className="mt-2 text-xs uppercase tracking-[.2em] text-muted">Preparing inventory intelligence</p><div className="mt-8 h-px overflow-hidden bg-line"><div className="h-full bg-brand-600 transition-[width] duration-300" style={{ width: `${Math.min(100, Math.max(4, progress))}%` }} /></div><p className="mt-3 font-mono text-xs text-muted">{Math.round(progress)}%</p></div></div>
}
