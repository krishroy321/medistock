import { useState } from 'react'
import { isoInDays } from '../../lib/date.js'
import { useStore, useSupplier } from '../../store/useStore.js'
import { recommendedReorder } from '../../lib/inventory.js'
import { Button } from '../ui/Button.jsx'
import { Input } from '../ui/Input.jsx'
import { Modal } from '../ui/Modal.jsx'

export function RestockModal({ medicine, onClose }) {
  const createPurchaseOrder = useStore((s) => s.createPurchaseOrder)
  const supplier = useSupplier(medicine?.supplierId)
  const [quantity, setQuantity] = useState(medicine ? recommendedReorder(medicine) : 10)
  const [error, setError] = useState('')
  if (!medicine) return null

  const submit = (event) => {
    event.preventDefault()
    const orderQuantity = Number(quantity)
    if (!Number.isInteger(orderQuantity) || orderQuantity < 1) {
      setError('Enter a whole number greater than zero.')
      return
    }
    createPurchaseOrder({
      medicineId: medicine.id,
      quantity: orderQuantity,
      supplierId: medicine.supplierId,
      expectedDelivery: isoInDays(3),
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Restock ${medicine.name}`}
      description={`${supplier?.name || 'Supplier'} · ${medicine.quantity} units currently on hand`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="restock-form">Create purchase order</Button>
        </>
      }
    >
      <form id="restock-form" onSubmit={submit}>
        <p className="eyebrow mb-4">Replenishment</p>
        <Input
          label="Quantity to order"
          type="number"
          min="1"
          step="1"
          required
          value={quantity}
          error={error}
          onChange={(event) => {
            setQuantity(event.target.value)
            setError('')
          }}
        />
        <p className="mt-2 text-xs text-muted">Recommended order: {recommendedReorder(medicine)} units</p>
      </form>
    </Modal>
  )
}
