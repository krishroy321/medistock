import { Bell, ChevronDown, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { NAV_ITEMS, CURRENT_USER } from './nav.js'
import { useStore, useUnreadCount } from '../../store/useStore.js'
import { Button } from '../ui/Button.jsx'
import { NotificationDrawer } from './NotificationDrawer.jsx'
import { cn } from '../../lib/cn.js'

function Brand({ compact = false }) {
  return <NavLink to="/dashboard" className={cn('flex items-center gap-3', compact && 'px-2')}><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-sm font-bold text-white shadow-lift">M</span><span className="font-display text-lg font-bold tracking-tight">Medi<span className="text-brand-600">Stock</span></span></NavLink>
}

export function AppShell() {
  const navigate = useNavigate()
  const [inventoryQuery, setInventoryQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const unread = useUnreadCount()
  const location = useLocation()
  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to))
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return
      setMobileOpen(false)
      setProfileOpen(false)
      setNotificationsOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])
  const nav = <nav className="space-y-1">{NAV_ITEMS.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all', isActive ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-400/10 dark:text-brand-200' : 'text-muted hover:bg-surface-2 hover:text-fg')}><Icon size={17} className="transition-transform group-hover:scale-105" /><span>{label}</span></NavLink>)}</nav>
  return <div className="min-h-screen bg-page text-fg">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface/95 px-5 py-6 lg:block">
      <Brand /><p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-subtle">Workspace</p>{nav}
      <div className="absolute bottom-6 left-5 right-5 border-t border-line pt-5"><div className="flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{CURRENT_USER.initials}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{CURRENT_USER.name}</p><p className="truncate text-xs text-muted">{CURRENT_USER.role}</p></div></div></div>
    </aside>
    {mobileOpen && <div className="fixed inset-0 z-50 bg-fg/25 lg:hidden" onClick={() => setMobileOpen(false)}><aside className="h-full w-72 bg-surface px-5 py-6 shadow-modal" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between"><Brand compact /><Button size="icon-sm" variant="ghost" icon={X} aria-label="Close navigation" onClick={() => setMobileOpen(false)} /></div><p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-subtle">Workspace</p>{nav}</aside></div>}
    <div className="lg:pl-64">
      <header className="sticky top-0 z-20 border-b border-line bg-page/85 backdrop-blur-xl"><div className="flex h-[72px] items-center gap-3 px-4 sm:px-6 lg:px-10"><Button size="icon-sm" variant="ghost" icon={Menu} className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)} /><div className="lg:hidden"><Brand compact /></div><div className="hidden items-center gap-2 text-sm text-muted lg:flex"><span>Workspace</span><span>/</span><span className="font-medium text-fg">{current?.label || 'Dashboard'}</span></div><div className="ml-auto flex items-center gap-2"><form className="hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted md:flex" onSubmit={(event) => { event.preventDefault(); if (inventoryQuery.trim()) navigate(`/inventory?search=${encodeURIComponent(inventoryQuery.trim())}`); }}><Search size={16} /><input className="w-36 bg-transparent outline-none placeholder:text-subtle" placeholder="Search inventory" aria-label="Search inventory" value={inventoryQuery} onChange={(event) => setInventoryQuery(event.target.value)} /></form><Button size="icon-sm" variant="ghost" icon={theme === 'dark' ? Sun : Moon} aria-label="Toggle theme" onClick={toggleTheme} /><button className="relative grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-fg" onClick={() => setNotificationsOpen(true)} aria-label="Notifications"><Bell size={18} />{unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-expiring ring-2 ring-page" />}</button><div className="relative"><button className="hidden items-center gap-2 rounded-xl p-1.5 text-left hover:bg-surface-2 sm:flex" onClick={() => setProfileOpen(!profileOpen)}><span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{CURRENT_USER.initials}</span><ChevronDown size={14} className="text-muted" /></button>{profileOpen && <div className="absolute right-0 top-12 w-56 rounded-2xl border border-line bg-surface p-3 shadow-modal"><p className="text-sm font-semibold">{CURRENT_USER.name}</p><p className="mb-3 text-xs text-muted">{CURRENT_USER.pharmacy}</p><button className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-surface-2 hover:text-fg" onClick={() => { toggleTheme(); setProfileOpen(false) }}>Switch appearance</button></div>}</div></div></div></header>
      <main className="min-h-[calc(100vh-72px)] px-4 pb-12 sm:px-6 lg:px-10"><Outlet /></main>
    </div>
    <NotificationDrawer open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
  </div>
}
