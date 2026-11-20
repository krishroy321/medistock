import { lazy, Suspense } from 'react'
import { getStatus, inventoryHealth, STATUS_META } from '../../lib/inventory.js'
import { cn } from '../../lib/cn.js'

const PharmacyScene = lazy(() => import('../3d/PharmacyScene.jsx').then((module) => ({ default: module.PharmacyScene })))

export function InventoryHealth({ medicines, sceneMedicines = medicines, onSelect, targetMedicineId = null, compact = false, showShelf = true }) {
  const active = medicines.filter((medicine) => !medicine.quarantined)
  const health = inventoryHealth(active)
  const counts = active.reduce((result, medicine) => {
    const status = getStatus(medicine)
    result[status] = (result[status] || 0) + 1
    return result
  }, {})
  const healthColor = health >= 80 ? '#1c9a6f' : health >= 60 ? '#d4910f' : '#d64545'

  return (
    <section className={cn('overflow-hidden rounded-[2rem] border border-line bg-surface-2/70 p-4 sm:p-6', compact ? 'min-h-[510px]' : 'min-h-[470px]')}>
      <div className="relative mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Inventory health</p>
          <p className="mt-1 text-sm text-muted">Live status across active medicine batches</p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="flex min-w-0 flex-1 flex-wrap justify-start gap-x-3 gap-y-1.5 text-[11px] text-muted sm:flex-none sm:justify-end sm:gap-x-4 sm:text-xs">
            {['healthy', 'low', 'expiring', 'expired', 'out'].map((key) => (
              <span key={key} className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_META[key].color }} />
                {counts[key] || 0} {STATUS_META[key].label}
              </span>
            ))}
          </div>
          <div className="relative grid h-14 w-14 shrink-0 place-items-center">
            <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden="true">
              <circle cx="28" cy="28" r="23" fill="none" stroke="currentColor" strokeWidth="5" className="text-line" />
              <circle
                cx="28"
                cy="28"
                r="23"
                fill="none"
                stroke={healthColor}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${(health / 100) * 144.5} 144.5`}
              />
            </svg>
            <span className="text-[11px] font-bold tabular">{health}%</span>
          </div>
        </div>
      </div>
      {showShelf ? (
        <Suspense fallback={<div className="h-[390px] animate-pulse rounded-[2rem] bg-surface" />}>
          <PharmacyScene
            medicines={sceneMedicines}
            onSelect={onSelect}
            targetMedicineId={targetMedicineId}
            mode={compact ? 'inventory' : 'dashboard'}
            emptyTitle={active.length ? 'No batches match this view' : undefined}
            emptyDescription={active.length ? 'Clear the search or filters to see matching stock.' : undefined}
          />
        </Suspense>
      ) : (
        <div className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex h-3 overflow-hidden rounded-full bg-surface-2" role="img" aria-label="Active batch status distribution">
            {['healthy', 'low', 'expiring', 'expired', 'out'].map((key) => (
              counts[key] > 0 && <span key={key} style={{ width: `${(counts[key] / Math.max(active.length, 1)) * 100}%`, backgroundColor: STATUS_META[key].color }} />
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {['healthy', 'low', 'expiring', 'expired', 'out'].map((key) => (
              <div key={key} className="rounded-2xl bg-surface-2 p-3">
                <p className="font-display text-2xl font-bold tabular">{counts[key] || 0}</p>
                <p className="mt-1 text-xs text-muted">{STATUS_META[key].label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
