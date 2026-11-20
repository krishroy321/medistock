import { daysUntil, formatDate } from './date.js'

/**
 * Inventory domain logic — status computation, KPIs, expiry buckets.
 * Pure functions so they can be reused unchanged once a backend exists.
 */

export const EXPIRING_SOON_DAYS = 30

/** Ordered status keys (priority high → low). */
export const STATUS = {
  OUT: 'out',
  EXPIRED: 'expired',
  EXPIRING: 'expiring',
  LOW: 'low',
  HEALTHY: 'healthy',
}

/** Display metadata per status — the single source for labels and colors. */
export const STATUS_META = {
  healthy: { label: 'Healthy', tone: 'brand', color: '#1c9a6f', emoji: '🟢', description: 'Stock above minimum and expiry is not imminent.' },
  low: { label: 'Low Stock', tone: 'amber', color: '#d4910f', emoji: '🟡', description: 'Quantity is below the minimum stock level.' },
  expiring: { label: 'Expiring Soon', tone: 'red', color: '#d64545', emoji: '🔴', description: `Expires within ${EXPIRING_SOON_DAYS} days.` },
  expired: { label: 'Expired', tone: 'red', color: '#b42318', emoji: '🔴', description: 'Past expiry date — must be quarantined.' },
  out: { label: 'Out of Stock', tone: 'dark', color: '#3f4644', emoji: '⚫', description: 'No units remaining.' },
}

export const isOutOfStock = (m) => m.quantity <= 0
export const isLowStock = (m) => m.quantity > 0 && m.quantity < m.minimumStock
export const isExpired = (m) => daysUntil(m.expiryDate) < 0
export const isExpiringSoon = (m, within = EXPIRING_SOON_DAYS) => {
  const d = daysUntil(m.expiryDate)
  return d >= 0 && d <= within
}

/** Primary status for a medicine batch. */
export function getStatus(m) {
  if (isOutOfStock(m)) return STATUS.OUT
  if (isExpired(m)) return STATUS.EXPIRED
  if (isExpiringSoon(m)) return STATUS.EXPIRING
  if (isLowStock(m)) return STATUS.LOW
  return STATUS.HEALTHY
}

/** All applicable flags (a batch can be both low stock and expiring). */
export function getFlags(m) {
  const flags = []
  if (isOutOfStock(m)) flags.push(STATUS.OUT)
  if (isExpired(m)) flags.push(STATUS.EXPIRED)
  else if (isExpiringSoon(m)) flags.push(STATUS.EXPIRING)
  if (isLowStock(m)) flags.push(STATUS.LOW)
  if (!flags.length) flags.push(STATUS.HEALTHY)
  return flags
}

export const stockValue = (m) => m.quantity * m.purchasePrice
export const retailValue = (m) => m.quantity * m.sellingPrice
/** Estimated loss if the batch expires unsold (purchase cost of remaining units). */
export const estimatedLoss = (m) => m.quantity * m.purchasePrice

/** Stock level as % of a healthy target (2× minimum), clamped 0–100. */
export function stockLevelPercent(m) {
  const target = Math.max(1, m.minimumStock * 2)
  return Math.max(0, Math.min(100, Math.round((m.quantity / target) * 100)))
}

/** Headline KPIs for the dashboard. */
export function computeKPIs(medicines) {
  const active = medicines.filter((m) => !m.quarantined)
  return {
    totalUnits: active.reduce((s, m) => s + m.quantity, 0),
    totalSkus: active.length,
    lowStock: active.filter(isLowStock).length,
    expiringSoon: active.filter((m) => isExpiringSoon(m)).length,
    expired: active.filter(isExpired).length,
    outOfStock: active.filter(isOutOfStock).length,
    stockValue: active.reduce((s, m) => s + stockValue(m), 0),
    retailValue: active.reduce((s, m) => s + retailValue(m), 0),
  }
}

/**
 * Expiry buckets (mutually exclusive):
 *  expired (<0), d7 (0–7), d30 (8–30), d90 (31–90), d180 (91–180), later (>180)
 */
export const EXPIRY_BUCKETS = [
  { key: 'expired', label: 'Expired', short: 'Expired', min: -Infinity, max: -1 },
  { key: 'd7', label: 'Expiring within 7 days', short: '≤ 7 days', min: 0, max: 7 },
  { key: 'd30', label: 'Expiring within 30 days', short: '8–30 days', min: 8, max: 30 },
  { key: 'd90', label: 'Expiring within 90 days', short: '31–90 days', min: 31, max: 90 },
  { key: 'd180', label: 'Expiring within 180 days', short: '91–180 days', min: 91, max: 180 },
  { key: 'later', label: 'Beyond 180 days', short: '> 180 days', min: 181, max: Infinity },
]

export function getExpiryBucket(m) {
  const d = daysUntil(m.expiryDate)
  return EXPIRY_BUCKETS.find((b) => d >= b.min && d <= b.max).key
}

/** Group medicines (with stock) into expiry buckets, sorted by soonest expiry. */
export function groupByExpiry(medicines) {
  const groups = Object.fromEntries(EXPIRY_BUCKETS.map((b) => [b.key, []]))
  medicines
    .filter((m) => !m.quarantined && m.quantity > 0)
    .forEach((m) => groups[getExpiryBucket(m)].push(m))
  Object.values(groups).forEach((list) => list.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)))
  return groups
}

/** Recommended reorder quantity: bring stock to 2.5× minimum, rounded to 10. */
export function recommendedReorder(m) {
  const target = Math.ceil(m.minimumStock * 2.5)
  return Math.max(10, Math.ceil((target - m.quantity) / 10) * 10)
}

export function expiryRisk(m) {
  const d = daysUntil(m.expiryDate)
  if (d < 0) return { level: 'Expired', tone: 'red' }
  if (d <= 30) return { level: 'High', tone: 'red' }
  if (d <= 90) return { level: 'Medium', tone: 'amber' }
  return { level: 'Low', tone: 'brand' }
}

export function inventoryHealth(medicines) {
  const active = medicines.filter((m) => !m.quarantined)
  if (!active.length) return 0
  const healthy = active.filter((m) => getStatus(m) === STATUS.HEALTHY).length
  return Math.round((healthy / active.length) * 1000) / 10
}

export function filterMedicines(medicines, { query = '', category = 'all', stock = 'all', expiry = 'all', sort = 'name', direction = 'asc' } = {}) {
  const q = query.trim().toLowerCase()
  const result = medicines.filter((m) => {
    if (m.quarantined) return false
    const status = getStatus(m)
    const matchesQuery = !q || [m.name, m.genericName, m.batchNumber, m.barcode, m.manufacturer].some((v) => String(v).toLowerCase().includes(q))
    const matchesCategory = category === 'all' || m.category === category
    const matchesStock = stock === 'all' || (stock === 'out' ? isOutOfStock(m) : stock === 'low' ? isLowStock(m) : stock === 'healthy' ? status === STATUS.HEALTHY : true)
    const days = daysUntil(m.expiryDate)
    const matchesExpiry = expiry === 'all' || (expiry === 'expired' ? days < 0 : expiry === '30' ? days >= 0 && days <= 30 : expiry === '90' ? days > 30 && days <= 90 : days > 90)
    return matchesQuery && matchesCategory && matchesStock && matchesExpiry
  })
  const multiplier = direction === 'desc' ? -1 : 1
  return result.sort((a, b) => {
    const av = sort === 'expiry' ? a.expiryDate : sort === 'stock' ? a.quantity : sort === 'value' ? stockValue(a) : a.name
    const bv = sort === 'expiry' ? b.expiryDate : sort === 'stock' ? b.quantity : sort === 'value' ? stockValue(b) : b.name
    return (av > bv ? 1 : av < bv ? -1 : 0) * multiplier
  })
}

export function fastMovingMedicines(medicines, transactions, limit = 5) {
  const totals = transactions.filter((t) => t.type === 'SALE').reduce((acc, t) => {
    acc[t.medicineId] = (acc[t.medicineId] || 0) + t.quantity
    return acc
  }, {})
  return medicines.map((m) => ({ ...m, sold: totals[m.id] || 0 })).sort((a, b) => b.sold - a.sold).slice(0, limit)
}

export function expiryGroups(medicines) {
  const groups = { expired: [], critical: [], warning: [], watch: [], safe: [] }
  medicines.filter((m) => !m.quarantined).forEach((m) => {
    const days = daysUntil(m.expiryDate)
    const key = days < 0 ? 'expired' : days <= 30 ? 'critical' : days <= 90 ? 'warning' : days <= 180 ? 'watch' : 'safe'
    groups[key].push(m)
  })
  Object.values(groups).forEach((rows) => rows.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)))
  return groups
}

export function deriveAttentionItems(medicines) {
  const items = []

  medicines.forEach((medicine) => {
    if (medicine.quarantined) return
    const days = daysUntil(medicine.expiryDate)
    const minimum = Number(medicine.minimumStock) || 0
    const quantity = Number(medicine.quantity) || 0
    let item = null

    if (days < 0 && quantity > 0) {
      item = {
        kind: 'expired',
        severity: 'critical',
        priority: 0,
        title: 'Expired stock',
        detail: `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago · ${quantity} units to quarantine`,
        action: 'quarantine',
      }
    } else if (quantity <= 0) {
      item = {
        kind: 'out',
        severity: 'critical',
        priority: 1,
        title: 'Out of stock',
        detail: `No units remaining · minimum ${minimum}`,
        action: 'restock',
      }
    } else if (minimum > 1 && quantity <= Math.floor(minimum * 0.25)) {
      item = {
        kind: 'critical-stock',
        severity: 'critical',
        priority: 2,
        title: 'Critically low stock',
        detail: `Only ${quantity} units · minimum ${minimum}`,
        action: 'restock',
      }
    } else if (days >= 0 && days <= 7) {
      item = {
        kind: 'critical-expiry',
        severity: 'critical',
        priority: 3,
        title: 'Expires this week',
        detail: `${days === 0 ? 'Expires today' : `Expires in ${days} ${days === 1 ? 'day' : 'days'}`} · ${formatDate(medicine.expiryDate)}`,
        action: 'review',
      }
    } else if (isLowStock(medicine)) {
      item = {
        kind: 'low',
        severity: 'warning',
        priority: 4,
        title: 'Below minimum stock',
        detail: `${quantity} units remaining · minimum ${minimum}`,
        action: 'restock',
      }
    } else if (days <= EXPIRING_SOON_DAYS) {
      item = {
        kind: 'expiring',
        severity: 'warning',
        priority: 5,
        title: 'Expiring soon',
        detail: `Expires in ${days} days · ${formatDate(medicine.expiryDate)}`,
        action: 'review',
      }
    } else if (minimum > 0 && quantity < minimum * 1.5) {
      item = {
        kind: 'approaching',
        severity: 'info',
        priority: 6,
        title: 'Approaching reorder level',
        detail: `${quantity} units remaining · reorder point ${minimum}`,
        action: 'review',
      }
    }

    if (item) items.push({ ...item, medicine })
  })

  return items.sort((a, b) => a.priority - b.priority
    || daysUntil(a.medicine.expiryDate) - daysUntil(b.medicine.expiryDate)
    || a.medicine.quantity - b.medicine.quantity)
}
