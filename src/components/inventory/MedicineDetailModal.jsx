import { PackagePlus, Pencil, Trash2 } from 'lucide-react'
import { useStore, useSupplier } from '../../store/useStore.js'
import { StatusBadge } from '../ui/Badge.jsx'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'
import { daysUntil, formatDate } from '../../lib/date.js'
import { getStatus, recommendedReorder, stockValue } from '../../lib/inventory.js'
import { formatCurrency } from '../../lib/format.js'

export function MedicineDetailModal({ medicine, onClose, onEdit }) {
  const supplier = useSupplier(medicine?.supplierId)
  const openRestock = useStore((s) => s.openRestock)
  const deleteMedicine = useStore((s) => s.deleteMedicine)
  if (!medicine) return null
  const status = getStatus(medicine)
  const health = Math.min(100, Math.round((medicine.quantity / Math.max(medicine.minimumStock, 1)) * 50))

  return (
    <Modal
      open
      onClose={onClose}
      title={medicine.name}
      description={`${medicine.genericName} · ${medicine.manufacturer}`}
      size="xl"
    >
      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <div className="flex min-h-[220px] items-center justify-center rounded-3xl bg-surface-2">
          <div className="relative flex h-40 w-24 flex-col items-center justify-end rounded-t-3xl border border-line-strong bg-surface pb-4 shadow-lift">
            <span className="absolute -top-4 h-6 w-16 rounded-full bg-brand-800" />
            <span className="rounded bg-brand-600 px-2 py-1 text-[10px] font-bold text-white">{medicine.name.split(' ')[0]}</span>
            <span className="mt-3 text-xs text-muted">{medicine.quantity} units</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">{medicine.category} · {medicine.form}</p>
              <p className="mt-1 text-sm text-muted">{medicine.manufacturer}</p>
            </div>
            <StatusBadge status={status} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted">Current stock</p><p className="mt-1 text-xl font-bold">{medicine.quantity}</p></div>
            <div><p className="text-muted">Minimum stock</p><p className="mt-1 text-xl font-bold">{medicine.minimumStock}</p></div>
            <div><p className="text-muted">Expiry</p><p className="mt-1 font-semibold">{formatDate(medicine.expiryDate)} <span className="text-xs text-muted">({daysUntil(medicine.expiryDate)}d)</span></p></div>
            <div><p className="text-muted">Batch</p><p className="mt-1 font-mono text-xs font-semibold">{medicine.batchNumber}</p></div>
            <div><p className="text-muted">Supplier</p><p className="mt-1 font-semibold">{supplier?.name || '—'}</p></div>
            <div><p className="text-muted">Stock value</p><p className="mt-1 font-semibold">{formatCurrency(stockValue(medicine))}</p></div>
          </div>
          <div className="mt-6 rounded-2xl bg-brand-50 p-4 dark:bg-brand-400/10">
            <div className="flex justify-between text-xs font-semibold"><span>Inventory health</span><span>{health}%</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100 dark:bg-brand-900">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${health}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">Recommended restock: {recommendedReorder(medicine)} units</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button icon={PackagePlus} onClick={() => { openRestock(medicine.id); onClose() }}>Restock</Button>
            <Button variant="secondary" icon={Pencil} onClick={() => onEdit?.(medicine)}>Edit</Button>
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={() => {
                if (window.confirm(`Delete ${medicine.name} from inventory?`)) {
                  deleteMedicine(medicine.id)
                  onClose()
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
