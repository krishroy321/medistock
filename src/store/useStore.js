import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { medicines as seedMedicines } from '../data/medicines.js'
import { suppliers as seedSuppliers, supplierById } from '../data/suppliers.js'
import { generateTransactions } from '../data/transactions.js'
import { isoInDays, TODAY } from '../lib/date.js'
import { computeKPIs, isLowStock } from '../lib/inventory.js'
import { formatDate } from '../lib/date.js'

/**
 * Global application store (Zustand).
 * Data slices mirror the backend entities so they can later be hydrated from
 * an API (replace the seed data + wire actions to fetch/mutations).
 * Only user preferences are persisted to localStorage.
 */

const seedTransactions = generateTransactions(seedMedicines)
const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString()

function seedNotifications(meds) {
  const k = computeKPIs(meds)
  const amox = meds.find((m) => m.batchNumber === 'BAT-18291')
  const insulin = meds.find((m) => m.batchNumber === 'BAT-73182')
  return [
    { id: 'n-1', tone: 'critical', title: `${k.expired} medicines expired`, description: 'Move these batches to quarantine and file a supplier return.', createdAt: hoursAgo(0.4), read: false, to: '/expiry-alerts' },
    { id: 'n-2', tone: 'warning', title: `${k.expiringSoon} medicines are expiring within 30 days`, description: 'Prioritise these batches at the counter or arrange returns.', createdAt: hoursAgo(1.5), read: false, to: '/expiry-alerts' },
    amox && { id: 'n-3', tone: 'warning', title: 'Amoxicillin is below minimum stock', description: `Only ${amox.quantity} units left · minimum required ${amox.minimumStock}.`, createdAt: hoursAgo(3), read: false, medicineId: amox.id, action: 'restock' },
    insulin && { id: 'n-4', tone: 'warning', title: 'Insulin Glargine expires soon', description: `Batch ${insulin.batchNumber} expires on ${formatDate(insulin.expiryDate)}.`, createdAt: hoursAgo(5), read: false, medicineId: insulin.id },
    { id: 'n-5', tone: 'success', title: 'Stock update completed', description: 'PO-5871 from MedSupply Ltd received · 6 line items added to inventory.', createdAt: hoursAgo(9), read: true, to: '/inventory' },
    { id: 'n-6', tone: 'info', title: 'PharmaCare dispatched PO-5874', description: 'Expected delivery in 2 days.', createdAt: hoursAgo(26), read: true, to: '/suppliers' },
  ].filter(Boolean)
}

function seedPurchaseOrders(meds) {
  const pick = (name) => meds.find((m) => m.name === name)
  const rows = [
    ['PO-5874', 'Telmisartan 40mg', 60, 'In transit', 2, -1],
    ['PO-5873', 'Human Insulin 30/70', 30, 'Pending', 3, 0],
    ['PO-5871', 'Atorvastatin 10mg', 80, 'Delivered', -1, -3],
    ['PO-5868', 'Ceftriaxone 1g Injection', 50, 'Delivered', -4, -7],
    ['PO-5866', 'Glucometer Test Strips', 20, 'Delivered', -8, -11],
  ]
  return rows
    .map(([id, name, quantity, status, deliveryIn, createdIn]) => {
      const m = pick(name)
      if (!m) return null
      return {
        id,
        medicineId: m.id,
        medicineName: m.name,
        supplierId: m.supplierId,
        quantity,
        unitCost: m.purchasePrice,
        total: Math.round(quantity * m.purchasePrice),
        status,
        expectedDelivery: isoInDays(deliveryIn),
        createdAt: new Date(TODAY.getTime() + createdIn * 86_400_000 + 11 * 3_600_000).toISOString(),
      }
    })
    .filter(Boolean)
}

let idSeq = 1
const uid = (p) => `${p}-${Date.now().toString(36)}-${(idSeq++).toString(36)}`
let poSeq = 5875
let txSeq = 90000

export const useStore = create(
  persist(
    (set, get) => ({
      // ---------------- data ----------------
      medicines: seedMedicines,
      suppliers: seedSuppliers,
      transactions: seedTransactions,
      purchaseOrders: seedPurchaseOrders(seedMedicines),
      notifications: seedNotifications(seedMedicines),
      toasts: [],

      // ---------------- preferences (persisted) ----------------
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
      enable3D: true,
      reduceMotion: false, // user override in addition to OS preference

      // ---------------- ui ----------------
      selectedMedicineId: null,
      restockMedicineId: null,
      notificationsOpen: false,
      addMedicineOpen: false,

      // ---------------- ui actions ----------------
      openMedicine: (id) => set({ selectedMedicineId: id }),
      closeMedicine: () => set({ selectedMedicineId: null }),
      openRestock: (id) => set({ restockMedicineId: id }),
      closeRestock: () => set({ restockMedicineId: null }),
      setNotificationsOpen: (v) => set({ notificationsOpen: v }),
      toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
      setAddMedicineOpen: (v) => set({ addMedicineOpen: v }),

      // ---------------- preference actions ----------------
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setEnable3D: (v) => set({ enable3D: v }),
      setReduceMotion: (v) => set({ reduceMotion: v }),

      // ---------------- toasts ----------------
      pushToast: (toast) => {
        const id = uid('t')
        set((s) => ({ toasts: [...s.toasts, { id, tone: 'success', ...toast }] }))
        setTimeout(() => get().dismissToast(id), toast.duration ?? 4200)
        return id
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // ---------------- notifications ----------------
      pushNotification: (n) =>
        set((s) => ({ notifications: [{ id: uid('n'), createdAt: new Date().toISOString(), read: false, tone: 'info', ...n }, ...s.notifications] })),
      markNotificationRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      dismissNotification: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

      // ---------------- inventory mutations ----------------
      /** Record a stock movement and update on-hand quantity. delta is signed. */
      recordTransaction: ({ medicineId, type, quantity, delta, reference }) => {
        const signed = delta ?? (['SALE', 'EXPIRED', 'DAMAGED'].includes(type) ? -quantity : quantity)
        const tx = { id: `TX-${txSeq++}`, medicineId, type, quantity: Math.abs(quantity), delta: type === 'ADJUSTMENT' ? signed : undefined, reference: reference || '—', createdAt: new Date().toISOString() }
        set((s) => ({
          transactions: [tx, ...s.transactions],
          medicines: s.medicines.map((m) => (m.id === medicineId ? { ...m, quantity: Math.max(0, m.quantity + signed), updatedAt: tx.createdAt } : m)),
        }))
        const m = get().medicines.find((x) => x.id === medicineId)
        if (m && isLowStock(m) && signed < 0) {
          get().pushNotification({ tone: 'warning', title: `${m.name} is below minimum stock`, description: `${m.quantity} units left · minimum ${m.minimumStock}.`, medicineId, action: 'restock' })
        }
        return tx
      },

      createPurchaseOrder: ({ medicineId, quantity, supplierId, expectedDelivery, note }) => {
        const m = get().medicines.find((x) => x.id === medicineId)
        if (!m || !Number.isInteger(quantity) || quantity < 1) return null
        const po = {
          id: `PO-${poSeq++}`,
          medicineId,
          medicineName: m.name,
          supplierId: supplierId || m.supplierId,
          quantity,
          unitCost: m.purchasePrice,
          total: Math.round(quantity * m.purchasePrice),
          status: 'Pending',
          expectedDelivery,
          note,
          createdAt: new Date().toISOString(),
        }
        const supplier = supplierById[po.supplierId]
        set((s) => ({ purchaseOrders: [po, ...s.purchaseOrders] }))
        get().pushNotification({ tone: 'info', title: `Purchase order ${po.id} created`, description: `${quantity} × ${m.name} from ${supplier?.name ?? 'supplier'} · ETA ${formatDate(expectedDelivery)}.`, to: '/suppliers' })
        get().pushToast({ title: `Purchase order ${po.id} created`, description: `${quantity} units of ${m.name} ordered from ${supplier?.name}.` })
        return po
      },

      receivePurchaseOrder: (poId) => {
        const po = get().purchaseOrders.find((p) => p.id === poId)
        if (!po || ['Delivered', 'Cancelled'].includes(po.status)) return
        set((s) => ({ purchaseOrders: s.purchaseOrders.map((p) => (p.id === poId ? { ...p, status: 'Delivered', expectedDelivery: isoInDays(0) } : p)) }))
        get().recordTransaction({ medicineId: po.medicineId, type: 'PURCHASE', quantity: po.quantity, reference: po.id })
        get().pushNotification({ tone: 'success', title: 'Stock update completed', description: `${po.id}: ${po.quantity} × ${po.medicineName} received into inventory.`, medicineId: po.medicineId })
        get().pushToast({ title: 'Stock update completed', description: `${po.quantity} units of ${po.medicineName} added to inventory.` })
      },

      cancelPurchaseOrder: (poId) => {
        const po = get().purchaseOrders.find((p) => p.id === poId)
        if (!po || ['Delivered', 'Cancelled'].includes(po.status)) return
        set((s) => ({ purchaseOrders: s.purchaseOrders.map((p) => (p.id === poId ? { ...p, status: 'Cancelled' } : p)) }))
        get().pushToast({ tone: 'neutral', title: `${poId} cancelled` })
      },

      /** Move an expired batch to quarantine (writes off remaining units). */
      quarantineMedicine: (id) => {
        const m = get().medicines.find((x) => x.id === id)
        if (!m || m.quarantined) return
        const qty = m.quantity
        if (qty > 0) get().recordTransaction({ medicineId: id, type: 'EXPIRED', quantity: qty, reference: 'Moved to quarantine' })
        set((s) => ({ medicines: s.medicines.map((x) => (x.id === id ? { ...x, quarantined: true, quarantinedQuantity: qty, updatedAt: new Date().toISOString() } : x)) }))
        get().pushToast({ tone: 'neutral', title: `${m.name} moved to quarantine`, description: `Batch ${m.batchNumber} · ${qty} units written off.` })
      },

      addMedicine: (data) => {
        const now = new Date().toISOString()
        const med = {
          ...data,
          id: uid('med'),
          quantity: Number(data.quantity) || 0,
          minimumStock: Number(data.minimumStock) || 0,
          purchasePrice: Number(data.purchasePrice) || 0,
          sellingPrice: Number(data.sellingPrice) || 0,
          barcode: data.barcode || `890${Math.floor(Math.random() * 1e10).toString().padStart(10, '0')}`,
          location: data.location || 'A1-01',
          quarantined: false,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ medicines: [med, ...s.medicines] }))
        if (med.quantity > 0) {
          set((s) => ({ transactions: [{ id: `TX-${txSeq++}`, medicineId: med.id, type: 'PURCHASE', quantity: med.quantity, reference: 'Opening stock', createdAt: now }, ...s.transactions] }))
        }
        get().pushToast({ title: 'Medicine added', description: `${med.name} · batch ${med.batchNumber}` })
        return med
      },

      updateMedicine: (id, patch) => {
        const current = get().medicines.find((medicine) => medicine.id === id)
        if (!current) return
        const { quantity, ...details } = patch
        if (Object.hasOwn(patch, 'quantity')) {
          const nextQuantity = Number(quantity)
          if (!Number.isFinite(nextQuantity) || nextQuantity < 0) {
            throw new RangeError('Medicine quantity must be a non-negative number.')
          }
          const delta = nextQuantity - current.quantity
          if (delta !== 0) {
            get().recordTransaction({
              medicineId: id,
              type: 'ADJUSTMENT',
              quantity: Math.abs(delta),
              delta,
              reference: 'Manual inventory update',
            })
          }
        }
        set((s) => ({
          medicines: s.medicines.map((medicine) => (
            medicine.id === id
              ? { ...medicine, ...details, updatedAt: new Date().toISOString() }
              : medicine
          )),
        }))
      },

      deleteMedicine: (id) => {
        const m = get().medicines.find((x) => x.id === id)
        set((s) => ({ medicines: s.medicines.filter((x) => x.id !== id), selectedMedicineId: s.selectedMedicineId === id ? null : s.selectedMedicineId }))
        if (m) get().pushToast({ tone: 'neutral', title: `${m.name} removed`, description: `Batch ${m.batchNumber} deleted from inventory.` })
      },
    }),
    {
      name: 'medistock-prefs',
      partialize: (s) => ({ theme: s.theme, enable3D: s.enable3D, reduceMotion: s.reduceMotion }),
    },
  ),
)

// -------- convenience selectors --------
export const useMedicine = (id) => useStore((s) => (id ? s.medicines.find((m) => m.id === id) : null))
export const useSupplier = (id) => useStore((s) => (id ? s.suppliers.find((x) => x.id === id) : null))
export const useUnreadCount = () => useStore((s) => s.notifications.filter((n) => !n.read).length)
