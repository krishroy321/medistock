import { Check, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/Button.jsx'
import { useStore } from '../../store/useStore.js'
import { timeAgo } from '../../lib/date.js'

export function NotificationDrawer({ open, onClose }) {
  const navigate = useNavigate()
  const notifications = useStore((s) => s.notifications)
  const markAll = useStore((s) => s.markAllNotificationsRead)
  const mark = useStore((s) => s.markNotificationRead)
  if (!open) return null
  return <div className="fixed inset-0 z-50 bg-fg/20" onClick={onClose}><aside className="absolute right-0 top-0 h-full w-full max-w-md bg-surface p-5 shadow-modal" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b border-line pb-4"><div><p className="eyebrow">Live signals</p><h2 className="mt-1 text-xl font-bold">Notifications</h2></div><Button size="icon-sm" variant="ghost" icon={X} onClick={onClose} aria-label="Close notifications" /></div><div className="flex justify-end py-3"><button className="text-xs font-semibold text-brand-700 hover:text-brand-800" onClick={markAll}><Check size={14} className="mr-1 inline" />Mark all read</button></div><div className="space-y-2 overflow-y-auto">{notifications.map((n) => <button key={n.id} className={`w-full rounded-xl border p-3 text-left transition hover:border-brand-300 ${n.read ? 'border-line bg-surface' : 'border-brand-200 bg-brand-50/60 dark:bg-brand-400/5'}`} onClick={() => { mark(n.id); if (n.to) navigate(n.to); else if (n.medicineId) navigate(`/inventory?medicine=${n.medicineId}`); onClose() }}><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{n.title}</p><span className="shrink-0 text-[11px] text-subtle">{timeAgo(n.createdAt)}</span></div><p className="mt-1 text-xs leading-5 text-muted">{n.description}</p></button>)}</div></aside></div>
}
