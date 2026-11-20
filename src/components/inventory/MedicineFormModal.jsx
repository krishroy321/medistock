import { useState } from 'react'
import { useStore } from '../../store/useStore.js'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { Modal } from '../ui/Modal.jsx'

export function MedicineFormModal({ medicine, onClose }) {
  const updateMedicine = useStore((s) => s.updateMedicine)
  const addMedicine = useStore((s) => s.addMedicine)
  const suppliers = useStore((s) => s.suppliers)
  const pushToast = useStore((s) => s.pushToast)
  const creating = !medicine
  const [form, setForm] = useState({
    name: medicine?.name || '',
    genericName: medicine?.genericName || '',
    category: medicine?.category || 'General',
    form: medicine?.form || 'Tablet',
    manufacturer: medicine?.manufacturer || '',
    batchNumber: medicine?.batchNumber || '',
    quantity: medicine?.quantity ?? 0,
    minimumStock: medicine?.minimumStock ?? 10,
    expiryDate: medicine?.expiryDate || '',
    supplierId: medicine?.supplierId || suppliers[0]?.id || '',
    purchasePrice: medicine?.purchasePrice ?? 0,
    sellingPrice: medicine?.sellingPrice ?? 0,
  })
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (event) => {
    event.preventDefault()
    const payload = {
      ...form,
      quantity: Number(form.quantity),
      minimumStock: Number(form.minimumStock),
      purchasePrice: Number(form.purchasePrice),
      sellingPrice: Number(form.sellingPrice),
    }
    if (creating) {
      addMedicine(payload)
    } else {
      updateMedicine(medicine.id, payload)
      pushToast({ title: 'Medicine updated', description: `${medicine.name} inventory details saved.` })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={creating ? 'Add medicine batch' : `Edit ${medicine.name}`}
      description="Keep batch, stock, expiry, and supplier details accurate."
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="medicine-form">{creating ? 'Add medicine' : 'Save changes'}</Button>
        </>
      }
    >
      <form id="medicine-form" onSubmit={submit}>
        <p className="eyebrow mb-4">Inventory control</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Medicine name" required value={form.name} onChange={(event) => update('name', event.target.value)} />
          <Input label="Generic name" required value={form.genericName} onChange={(event) => update('genericName', event.target.value)} />
          <Input label="Category" value={form.category} onChange={(event) => update('category', event.target.value)} />
          <Input label="Dosage form" value={form.form} onChange={(event) => update('form', event.target.value)} />
          <Input label="Manufacturer" value={form.manufacturer} onChange={(event) => update('manufacturer', event.target.value)} />
          <Input label="Batch number" required value={form.batchNumber} onChange={(event) => update('batchNumber', event.target.value)} />
          <Input label="Current stock" type="number" min="0" required value={form.quantity} onChange={(event) => update('quantity', event.target.value)} />
          <Input label="Minimum stock" type="number" min="0" required value={form.minimumStock} onChange={(event) => update('minimumStock', event.target.value)} />
          <Input label="Expiry date" type="date" required value={form.expiryDate} onChange={(event) => update('expiryDate', event.target.value)} />
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-fg">
            Supplier
            <select className="h-10 rounded-xl border border-line bg-surface px-3 text-sm" required value={form.supplierId} onChange={(event) => update('supplierId', event.target.value)}>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
          </label>
          <Input label="Purchase price" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(event) => update('purchasePrice', event.target.value)} />
          <Input label="Selling price" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(event) => update('sellingPrice', event.target.value)} />
        </div>
      </form>
    </Modal>
  )
}
