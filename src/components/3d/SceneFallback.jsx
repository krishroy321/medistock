import { Activity, Box, ShieldCheck } from 'lucide-react'
import { getStatus, STATUS_META } from '../../lib/inventory.js'

export function SceneFallback({ medicines = [], onSelect }) {
  const forms = new Map()
  medicines.forEach((medicine) => {
    if (!forms.has(medicine.form)) forms.set(medicine.form, medicine)
  })
  const featured = [...forms.values()].slice(0, 3)

  return (
    <div className="relative flex h-full min-h-[420px] flex-col justify-center overflow-hidden rounded-[2rem] border border-line bg-surface-2 p-6">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="relative flex flex-wrap items-end justify-center gap-5">
        {featured.map((medicine, index) => {
          const color = STATUS_META[getStatus(medicine)].color
          const box = ['tablet', 'capsule', 'supply'].includes(medicine.form?.toLowerCase())
          return (
            <button
              key={medicine.id}
              type="button"
              onClick={() => onSelect?.(medicine)}
              aria-label={`Select ${medicine.name}, ${medicine.quantity} units`}
              className="group flex w-28 flex-col items-center text-center transition hover:-translate-y-1 sm:w-32"
            >
              <span className={`relative mb-3 flex h-36 w-20 flex-col items-center justify-center border border-line-strong bg-surface shadow-lift ${box ? 'rounded-md' : 'rounded-t-[1.4rem] rounded-b-lg'}`}>
                {!box && <span className="absolute -top-3 h-5 w-12 rounded-md bg-brand-800" />}
                <span className="mt-2 w-full px-1 py-2 text-[10px] font-bold text-white" style={{ backgroundColor: color }}>{medicine.name.split(' ')[0]}</span>
                <span className="mt-2 text-[10px] text-muted">{medicine.quantity} units</span>
                <span className="absolute bottom-0 h-1 w-full rounded-b-lg" style={{ backgroundColor: color }} />
              </span>
              <span className="w-full whitespace-normal break-words text-xs font-semibold leading-tight">{medicine.name}</span>
              <span className="mt-1 text-[10px] text-muted">{STATUS_META[getStatus(medicine)].label}</span>
              <span className="text-[10px] text-muted">Shelf {index + 1}</span>
            </button>
          )
        })}
      </div>
      <div className="relative mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-muted">
        <span><Activity className="mr-1 inline text-brand-600" size={14} />Live stock map</span>
        <span><ShieldCheck className="mr-1 inline text-brand-600" size={14} />WebGL unavailable · 2D visual fallback</span>
        <span><Box className="mr-1 inline text-brand-600" size={14} />{medicines.length} batches</span>
      </div>
    </div>
  )
}
