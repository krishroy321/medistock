import { createRng } from '../lib/rng.js'
import { TODAY } from '../lib/date.js'

/**
 * Aggregated monthly analytics (last 12 months, oldest first).
 * In production these would come from a reporting endpoint; here they are
 * generated deterministically with mild seasonality (monsoon & winter peaks).
 */
const MONTHS = 12
const seasonal = [0.92, 0.88, 0.9, 0.95, 1.0, 1.08, 1.16, 1.18, 1.1, 1.02, 1.06, 1.12] // Jan..Dec

function buildMonthly() {
  const rng = createRng(777)
  const rows = []
  for (let i = MONTHS - 1; i >= 0; i--) {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1)
    const s = seasonal[d.getMonth()]
    const growth = 1 + (MONTHS - 1 - i) * 0.012
    const consumption = Math.round(2850 * s * growth * rng.float(0.95, 1.05))
    const purchases = Math.round(consumption * rng.float(0.94, 1.1))
    const valuation = Math.round(212000 * growth * rng.float(0.96, 1.05))
    const expiredLoss = Math.round(rng.float(2400, 9800) * (i < 3 ? 0.8 : 1))
    const restockOrders = Math.round(26 * s * rng.float(0.85, 1.15))
    rows.push({
      month: d.toLocaleString('en-GB', { month: 'short' }),
      label: d.toLocaleString('en-GB', { month: 'short', year: '2-digit' }),
      date: d.toISOString().slice(0, 10),
      consumption,
      purchases,
      valuation,
      expiredLoss,
      damagedLoss: Math.round(expiredLoss * rng.float(0.12, 0.3)),
      restockOrders,
      turnover: Math.round(((consumption * 92) / valuation) * 12 * 10) / 10, // annualised turnover ratio
      revenue: Math.round(consumption * 118 * rng.float(0.96, 1.04)),
      onTimeRate: Math.round(rng.float(89, 98)),
    })
  }
  return rows
}

export const monthlyAnalytics = buildMonthly()

/** Supplier on-time delivery trend (last 6 months) keyed by supplier id. */
export function supplierTrend(supplier) {
  const rng = createRng(supplier.id.length * 97 + supplier.reliabilityScore)
  return monthlyAnalytics.slice(-6).map((m) => ({
    month: m.month,
    onTime: Math.min(100, Math.round(supplier.reliabilityScore + rng.float(-5, 2))),
    leadTime: Math.max(1, Math.round((supplier.avgLeadTimeDays + rng.float(-1, 1.4)) * 10) / 10),
  }))
}
