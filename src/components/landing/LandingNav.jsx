import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button.jsx'
import { cn } from '../../lib/cn.js'

const links = [
  ['intelligence', 'Intelligence'],
  ['expiry', 'Expiry radar'],
  ['flow', 'How it works'],
]

export function LandingNav() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [active, setActive] = useState('intelligence')
  useEffect(() => {
    let previous = window.scrollY
    const onScroll = () => {
      const current = window.scrollY
      setScrolled(current > 80)
      setHidden(current > previous + 8 && current > 160)
      if (current < previous - 8) setHidden(false)
      previous = current
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)), { rootMargin: '-35% 0px -55% 0px' })
    links.forEach(([id]) => document.getElementById(id) && observer.observe(document.getElementById(id)))
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      observer.disconnect()
    }
  }, [])
  const go = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMobileOpen(false)
  }
  return <header className={cn('fixed left-0 right-0 top-0 z-40 px-4 pt-4 transition-transform duration-300 sm:px-6', hidden && '-translate-y-[130%]')}><div className={cn('mx-auto flex max-w-5xl items-center justify-between rounded-full border px-3 py-2 transition-all', scrolled ? 'border-line bg-surface/95 shadow-soft backdrop-blur-md' : 'border-transparent bg-page/70')}><button className="flex items-center gap-2 rounded-full px-2 py-1.5" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-700 text-sm font-bold text-white">M</span><span className="font-display font-bold">Medi<span className="text-brand-600">Stock</span></span></button><nav className="hidden items-center gap-1 md:flex">{links.map(([id, label]) => <button key={id} onClick={() => go(id)} className={cn('relative rounded-full px-4 py-2 text-sm transition', active === id ? 'font-semibold text-fg' : 'text-muted hover:text-fg')}>{label}{active === id && <span className="absolute inset-x-4 -bottom-0.5 h-px bg-brand-600" />}</button>)}</nav><div className="flex items-center gap-2"><Button size="sm" variant="dark" className="hidden sm:inline-flex" onClick={() => navigate('/dashboard')}>Open dashboard</Button><Button size="icon-sm" variant="ghost" icon={mobileOpen ? X : Menu} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} className="md:hidden" onClick={() => setMobileOpen((value) => !value)} /></div></div>{mobileOpen && <div className="mx-auto mt-2 max-w-5xl rounded-3xl border border-line bg-surface p-3 shadow-modal md:hidden">{links.map(([id, label]) => <button key={id} onClick={() => go(id)} className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold hover:bg-surface-2">{label}</button>)}<Button className="mt-2 w-full" onClick={() => navigate('/dashboard')}>Open dashboard</Button></div>}</header>
}
