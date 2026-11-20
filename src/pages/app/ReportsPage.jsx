import { Download, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { useStore } from '../../store/useStore.js'
import { computeKPIs, estimatedLoss, expiryGroups } from '../../lib/inventory.js'
import { daysUntil, formatShortDate, TODAY } from '../../lib/date.js'
import { formatCurrency, formatCurrencyCompact, formatNumber } from '../../lib/format.js'
import { PageHeader } from '../../components/layout/PageContainer.jsx'
import { Button } from '../../components/ui/Button.jsx'

const WEEK_MS = 7 * 86_400_000
const REPORT_WEEKS = 12

function exportCsv(rows) {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `medistock-report-${TODAY.toISOString().slice(0, 10)}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ReportsPage() {
  const medicines = useStore((state) => state.medicines)
  const suppliers = useStore((state) => state.suppliers)
  const transactions = useStore((state) => state.transactions)
  const kpis = computeKPIs(medicines)
  const expiry = expiryGroups(medicines)

  const weeklySales = useMemo(() => {
    const weeks = Array.from({ length: REPORT_WEEKS }, (_, index) => {
      const start = new Date(TODAY.getTime() - (REPORT_WEEKS - index - 1) * WEEK_MS)
      return { label: formatShortDate(start), units: 0 }
    })
    transactions.forEach((transaction) => {
      if (transaction.type !== 'SALE') return
      const transactionDay = new Date(transaction.createdAt)
      transactionDay.setHours(0, 0, 0, 0)
      const daysAgo = Math.floor((TODAY.getTime() - transactionDay.getTime()) / 86_400_000)
      const weeksAgo = Math.floor(daysAgo / 7)
      if (weeksAgo >= 0 && weeksAgo < REPORT_WEEKS) {
        weeks[REPORT_WEEKS - weeksAgo - 1].units += transaction.quantity
      }
    })
    return weeks
  }, [transactions])

  const turnover = useMemo(() => {
    if (!kpis.stockValue) return 0
    const medicineById = new Map(medicines.map((medicine) => [medicine.id, medicine]))
    const soldCost = transactions.reduce((sum, transaction) => {
      if (transaction.type !== 'SALE') return sum
      const daysAgo = Math.floor((TODAY.getTime() - new Date(transaction.createdAt).setHours(0, 0, 0, 0)) / 86_400_000)
      if (daysAgo < 0 || daysAgo >= REPORT_WEEKS * 7) return sum
      const medicine = medicineById.get(transaction.medicineId)
      return sum + transaction.quantity * (medicine?.purchasePrice || 0)
    }, 0)
    return (soldCost / kpis.stockValue) * (365 / (REPORT_WEEKS * 7))
  }, [kpis.stockValue, medicines, transactions])

  const expiredLoss = medicines
    .filter((medicine) => !medicine.quarantined && daysUntil(medicine.expiryDate) < 0)
    .reduce((sum, medicine) => sum + estimatedLoss(medicine), 0)
  const categoryValues = useMemo(() => Object.entries(medicines.reduce((totals, medicine) => {
    totals[medicine.category] = (totals[medicine.category] || 0) + medicine.quantity * medicine.purchasePrice
    return totals
  }, {})).sort((a, b) => b[1] - a[1]), [medicines])
  const maxWeeklySales = Math.max(1, ...weeklySales.map((week) => week.units))
  const firstHalfSales = weeklySales.slice(0, 6).reduce((sum, week) => sum + week.units, 0)
  const secondHalfSales = weeklySales.slice(6).reduce((sum, week) => sum + week.units, 0)
  const consumptionTrend = firstHalfSales
    ? Math.round(((secondHalfSales / firstHalfSales) - 1) * 100)
    : secondHalfSales ? 100 : 0
  const exportReport = () => exportCsv([
    ['Metric', 'Value'],
    ['Inventory value', kpis.stockValue],
    ['Expired stock on hand', expiredLoss],
    ['Annualised stock turnover', turnover.toFixed(2)],
    ['Units sold in last 12 weeks', weeklySales.reduce((sum, week) => sum + week.units, 0)],
    ['Low stock batches', kpis.lowStock],
    ['Expired batches', expiry.expired.length],
    ['Expiring within 30 days', expiry.critical.length],
    ['Expiring in 31–90 days', expiry.warning.length],
    ...suppliers.map((supplier) => [supplier.name, `${supplier.reliabilityScore}% reliability`]),
  ])

  const expiryBands = [
    { label: 'Expired', count: expiry.expired.length, color: 'bg-expiring' },
    { label: '0–30 days', count: expiry.critical.length, color: 'bg-low' },
    { label: '31–90 days', count: expiry.warning.length, color: 'bg-brand-500' },
    { label: '91–180 days', count: expiry.watch.length, color: 'bg-accent-500' },
  ]
  const maxExpiryCount = Math.max(1, ...expiryBands.map((band) => band.count))

  return (
    <>
      <PageHeader
        eyebrow="Pharmacy intelligence"
        title="Reports that lead to action."
        description="A clear read on value, movement, loss, and the next operational decision."
        actions={<Button icon={Download} onClick={exportReport}>Export report</Button>}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-fg p-6 text-page">
          <p className="text-sm text-page/60">Inventory value</p>
          <p className="mt-3 font-display text-4xl font-bold">{formatCurrencyCompact(kpis.stockValue)}</p>
          <p className="mt-2 text-xs text-page/60">current purchase value</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm text-muted">Expired stock on hand</p>
          <p className="mt-3 text-3xl font-bold text-expiring">{formatCurrency(expiredLoss)}</p>
          <p className="mt-2 text-xs text-muted">{expiry.expired.length} batches past expiry</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm text-muted">Stock turnover</p>
          <p className="mt-3 text-3xl font-bold">{turnover.toFixed(1)}x</p>
          <p className="mt-2 text-xs text-muted">annualised from last 12 weeks' sales</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm text-muted">Low stock batches</p>
          <p className="mt-3 text-3xl font-bold text-low">{kpis.lowStock + kpis.outOfStock}</p>
          <p className="mt-2 text-xs text-muted">below their minimum quantity</p>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <div className="rounded-[2rem] border border-line bg-surface p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Stock movement</p>
              <h2 className="mt-2 text-xl font-bold">Units sold · trailing 12 weeks</h2>
            </div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              {consumptionTrend >= 0
                ? <TrendingUp className="text-brand-600" size={17} />
                : <TrendingDown className="text-expiring" size={17} />}
              {Math.abs(consumptionTrend)}% vs. prior 6 weeks
            </p>
          </div>
          <div className="mt-8 flex h-56 items-end gap-1.5 sm:gap-2.5">
            {weeklySales.map((week) => (
              <div key={week.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${week.units} units sold`}>
                <div
                  className="w-full max-w-8 rounded-t-lg bg-brand-500 transition-colors hover:bg-brand-700"
                  style={{ height: `${Math.max(week.units ? 4 : 0, week.units / maxWeeklySales * 100)}%` }}
                />
                {weeklySales.indexOf(week) % 2 === 0 && <span className="text-[10px] text-muted">{week.label}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-line bg-surface p-6">
          <p className="eyebrow">Expiry exposure</p>
          <h2 className="mt-2 text-xl font-bold">Which batches need a decision?</h2>
          <div className="mt-7 space-y-5">
            {expiryBands.map((band) => (
              <div key={band.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{band.label}</span>
                  <span className="font-semibold tabular">{band.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${band.color}`} style={{ width: `${band.count / maxExpiryCount * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-[2rem] border border-line bg-surface p-6">
          <p className="eyebrow">Supplier performance</p>
          <h2 className="mt-2 text-xl font-bold">Reliability overview</h2>
          <div className="mt-6 space-y-4">
            {suppliers.slice(0, 6).map((supplier) => (
              <div key={supplier.id}>
                <div className="mb-1 flex justify-between gap-3 text-xs">
                  <span className="truncate">{supplier.name}</span>
                  <b>{supplier.reliabilityScore}%</b>
                </div>
                <div className="h-2 rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-brand-600" style={{ width: `${supplier.reliabilityScore}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] border border-line bg-surface p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="eyebrow">Report data</p><h2 className="mt-2 text-xl font-bold">Inventory value by category</h2></div>
            <span className="shrink-0 text-sm text-muted">{formatNumber(medicines.length)} batches</span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categoryValues.slice(0, 8).map(([category, value]) => (
              <div key={category} className="rounded-2xl bg-surface-2 p-4">
                <p className="truncate text-sm font-semibold">{category}</p>
                <p className="mt-2 text-xl font-bold">{formatCurrencyCompact(value)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
