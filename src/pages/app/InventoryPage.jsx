import { Filter, MoreHorizontal, PackagePlus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore, useSupplier } from '../../store/useStore.js'
import { filterMedicines, getStatus } from '../../lib/inventory.js'
import { formatDate } from '../../lib/date.js'
import { PageHeader } from '../../components/layout/PageContainer.jsx'
import { InventoryHealth } from '../../components/visualizations/InventoryHealth.jsx'
import { StatusBadge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input, Select } from '../../components/ui/Input.jsx'
import { MedicineDetailModal } from '../../components/inventory/MedicineDetailModal.jsx'
import { RestockModal } from '../../components/inventory/RestockModal.jsx'
import { MedicineFormModal } from '../../components/inventory/MedicineFormModal.jsx'

function SupplierName({ id }) { const s = useSupplier(id); return <span>{s?.name || '—'}</span> }
export function InventoryPage() {
  const medicines = useStore((s) => s.medicines)
  const openRestock = useStore((s) => s.openRestock)
  const restockId = useStore((s) => s.restockMedicineId)
  const closeRestock = useStore((s) => s.closeRestock)
  const [params, setParams] = useSearchParams()
  const [filters, setFilters] = useState({ category: 'all', stock: 'all', expiry: 'all', sort: 'name', direction: 'asc' })
  const [editing, setEditing] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 12
  const detail = medicines.find((m) => m.id === params.get('medicine'))
  const restockTarget = medicines.find((m) => m.id === params.get('restock'))
  const activeRestock = restockTarget || medicines.find((m) => m.id === restockId)
  const query = params.get('search') || ''
  const rows = useMemo(() => filterMedicines(medicines, { ...filters, query }), [medicines, filters, query])
  const categories = [...new Set(medicines.map((m) => m.category))].sort()
  const update = (key, value) => {
    if (key === 'query') {
      setParams((current) => {
        const next = new URLSearchParams(current)
        if (value) next.set('search', value)
        else next.delete('search')
        return next
      })
      return
    }
    setFilters((current) => ({ ...current, [key]: value }))
  }
  const setFilterAndReset = (key, value) => { update(key, value); setPage(1) }
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const toggleSort = (key) => {
    setFilters((f) => ({ ...f, sort: key, direction: f.sort === key && f.direction === 'asc' ? 'desc' : 'asc' }))
  }
  const sortIndicator = (key) => filters.sort === key ? (filters.direction === 'asc' ? ' ↑' : ' ↓') : ''
  const select = (m) => setParams((current) => {
    const next = new URLSearchParams(current)
    next.set('medicine', m.id)
    return next
  })
  return <><PageHeader eyebrow="Inventory intelligence" title="Every batch, accounted for." description={`${rows.length} of ${medicines.length} active batches visible.`} actions={<><Button variant="secondary" icon={PackagePlus} onClick={() => rows[0] && openRestock(rows[0].id)}>Quick restock</Button><Button icon={PackagePlus} onClick={() => setEditing({})}>Add medicine</Button></>} /><section className="mb-5"><InventoryHealth medicines={medicines} sceneMedicines={rows} onSelect={select} targetMedicineId={detail?.id || restockTarget?.id} compact /></section><section className="rounded-[2rem] border border-line bg-surface p-4 sm:p-6"><div className="flex flex-wrap items-end gap-3 border-b border-line pb-5"><Input className="min-w-[220px] flex-1" icon={Search} placeholder="Search medicines, batches, barcodes..." value={query} onChange={(e) => setFilterAndReset('query', e.target.value)} /><Select className="w-44" label="Category" size="sm" value={filters.category} onChange={(e) => setFilterAndReset('category', e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]} /><Select className="w-36" label="Stock" size="sm" value={filters.stock} onChange={(e) => setFilterAndReset('stock', e.target.value)} options={[{ value: 'all', label: 'All stock' }, { value: 'healthy', label: 'Healthy' }, { value: 'low', label: 'Low stock' }, { value: 'out', label: 'Out of stock' }]} /><Select className="w-36" label="Expiry" size="sm" value={filters.expiry} onChange={(e) => setFilterAndReset('expiry', e.target.value)} options={[{ value: 'all', label: 'All expiry' }, { value: 'expired', label: 'Expired' }, { value: '30', label: 'Within 30d' }, { value: '90', label: '31–90d' }, { value: 'safe', label: 'Safe' }]} /><Button size="icon" variant="secondary" icon={SlidersHorizontal} aria-label="Clear all filters" onClick={() => { setFilters({ category: 'all', stock: 'all', expiry: 'all', sort: 'name', direction: 'asc' }); setPage(1); setParams((current) => { const next = new URLSearchParams(current); next.delete('search'); return next }) }} /></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[880px] text-left text-sm"><thead><tr className="border-b border-line text-[11px] uppercase tracking-wider text-subtle"><th className="pb-3 pl-2"><button onClick={() => toggleSort('name')}>Medicine{sortIndicator('name')}</button></th><th className="pb-3">Category</th><th className="pb-3">Batch</th><th className="pb-3"><button onClick={() => toggleSort('stock')}>Stock{sortIndicator('stock')}</button></th><th className="pb-3"><button onClick={() => toggleSort('expiry')}>Expiry{sortIndicator('expiry')}</button></th><th className="pb-3">Supplier</th><th className="pb-3">Status</th><th className="pb-3 pr-2 text-right">Actions</th></tr></thead><tbody className="divide-y divide-line">{visibleRows.map((m) => <tr key={m.id} className="group transition hover:bg-surface-2"><td className="py-4 pl-2"><button className="text-left font-semibold hover:text-brand-700" onClick={() => select(m)}>{m.name}<span className="mt-0.5 block text-xs font-normal text-muted">{m.genericName}</span></button></td><td className="py-4 text-muted">{m.category}</td><td className="py-4 font-mono text-xs text-muted">{m.batchNumber}</td><td className="py-4 font-semibold">{m.quantity}<span className="font-normal text-muted"> / {m.minimumStock}</span></td><td className="py-4 text-muted">{formatDate(m.expiryDate)}</td><td className="py-4 text-muted"><SupplierName id={m.supplierId} /></td><td className="py-4"><StatusBadge status={getStatus(m)} size="sm" /></td><td className="py-4 pr-2 text-right"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" icon={PackagePlus} aria-label={`Restock ${m.name}`} onClick={() => openRestock(m.id)} /><Button variant="ghost" size="icon-sm" icon={MoreHorizontal} aria-label={`More actions for ${m.name}`} onClick={() => select(m)} /></div></td></tr>)}</tbody></table>{!rows.length && <div className="py-16 text-center"><Filter className="mx-auto text-subtle" /><p className="mt-3 font-semibold">No batches match these filters.</p><p className="mt-1 text-sm text-muted">Try widening your search or clearing a filter.</p></div>}</div>{rows.length > 0 && <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs text-muted"><span>Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, rows.length)} of {rows.length}</span><div className="flex gap-2"><Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button><Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button></div></div>}</section>{detail && <MedicineDetailModal medicine={detail} onClose={() => setParams((current) => { const next = new URLSearchParams(current); next.delete('medicine'); return next })} onEdit={(m) => { setParams((current) => { const next = new URLSearchParams(current); next.delete('medicine'); return next }); setEditing(m) }} />}{activeRestock && <RestockModal medicine={activeRestock} onClose={() => { closeRestock(); setParams((current) => { const next = new URLSearchParams(current); next.delete('restock'); return next }) }} />}{editing && <MedicineFormModal medicine={editing.id ? editing : null} onClose={() => setEditing(null)} />}</>
}
