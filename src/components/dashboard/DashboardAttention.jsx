import { AlertTriangle, ArrowUpRight, CalendarClock, PackagePlus, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore.js'
import { formatCurrencyCompact } from '../../lib/format.js'
import { Button } from '../ui/Button.jsx'

const severityStyles = {
  critical: 'border-red-200 bg-red-50 text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300',
  info: 'border-line bg-surface-2 text-muted',
}

const itemIcons = {
  expired: ShieldAlert,
  out: PackagePlus,
  'critical-stock': PackagePlus,
  'critical-expiry': CalendarClock,
  low: PackagePlus,
  expiring: CalendarClock,
  approaching: AlertTriangle,
}

export function DashboardAttention({ items, stockValue, className = '' }) {
  const navigate = useNavigate()
  const quarantineMedicine = useStore((state) => state.quarantineMedicine)
  const criticalCount = items.filter((item) => item.severity === 'critical').length
  const warningCount = items.filter((item) => item.severity === 'warning').length
  const infoCount = items.filter((item) => item.severity === 'info').length
  const previewItems = [
    ...items.filter((item) => item.severity === 'critical').slice(0, 3),
    ...items.filter((item) => item.severity === 'warning').slice(0, 2),
    ...items.filter((item) => item.severity === 'info').slice(0, 1),
  ].sort((a, b) => a.priority - b.priority)

  const openMedicine = (medicine) => navigate(`/inventory?medicine=${encodeURIComponent(medicine.id)}`)
  const restockMedicine = (medicine) => navigate(`/inventory?restock=${encodeURIComponent(medicine.id)}`)

  return (
    <section aria-labelledby="dashboard-attention-title" className={`flex min-h-[470px] flex-col rounded-[2rem] border border-line bg-surface p-5 sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Operational priorities</p>
          <h2 id="dashboard-attention-title" className="mt-2 text-xl font-bold">What needs attention?</h2>
          <p className="mt-1 text-sm text-muted">Highest-priority actions from current stock.</p>
        </div>
        <Button variant="ghost" size="sm" to="/inventory" aria-label="Review all inventory">
          All stock <ArrowUpRight size={14} />
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700 dark:bg-red-400/10 dark:text-red-300">{criticalCount} critical</span>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300">{warningCount} warnings</span>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 font-semibold text-muted">{infoCount} to watch</span>
        <span className="ml-auto text-muted">Stock value {formatCurrencyCompact(stockValue)}</span>
      </div>

      {items.length ? (
        <ul className="mt-3 flex-1 divide-y divide-line overflow-y-auto">
          {previewItems.map((item) => {
            const Icon = itemIcons[item.kind] || AlertTriangle
            return (
              <li key={item.medicine.id} className="flex items-center gap-3 py-3">
                <button
                  type="button"
                  onClick={() => openMedicine(item.medicine)}
                  aria-label={`View ${item.medicine.name}: ${item.title}. ${item.detail}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border ${severityStyles[item.severity]}`}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.medicine.name}</span>
                    <span className="block truncate text-xs text-muted">{item.title} · {item.detail}</span>
                  </span>
                </button>
                {item.action === 'restock' ? (
                  <Button size="sm" variant="secondary" onClick={() => restockMedicine(item.medicine)}>Restock</Button>
                ) : item.action === 'quarantine' ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (window.confirm(`Move ${item.medicine.name} (${item.medicine.quantity} units) to quarantine?`)) {
                        quarantineMedicine(item.medicine.id)
                      }
                    }}
                  >
                    Quarantine
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => openMedicine(item.medicine)}>Review</Button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="my-auto rounded-2xl bg-surface-2 p-5 text-center">
          <p className="font-semibold">No urgent inventory actions</p>
          <p className="mt-1 text-sm text-muted">No expired, low-stock, or near-expiry batches need attention.</p>
        </div>
      )}

      {items.length > previewItems.length && (
        <Button variant="ghost" className="mt-2 self-start" size="sm" to="/inventory">
          Showing {previewItems.length} of {items.length} actions · review inventory <ArrowUpRight size={14} />
        </Button>
      )}
    </section>
  )
}
