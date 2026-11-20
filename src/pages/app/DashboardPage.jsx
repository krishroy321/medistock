import { ArrowUpRight, Package, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/useStore.js'
import { computeKPIs, deriveAttentionItems, fastMovingMedicines } from '../../lib/inventory.js'
import { formatCurrencyCompact, formatNumber } from '../../lib/format.js'
import { PageHeader } from '../../components/layout/PageContainer.jsx'
import { InventoryHealth } from '../../components/visualizations/InventoryHealth.jsx'
import { ExpiryRadar } from '../../components/visualizations/ExpiryRadar.jsx'
import { StockFlow } from '../../components/visualizations/StockFlow.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { DashboardAttention } from '../../components/dashboard/DashboardAttention.jsx'

export function DashboardPage() {
  const medicines = useStore((state) => state.medicines)
  const transactions = useStore((state) => state.transactions)
  const navigate = useNavigate()
  const kpis = computeKPIs(medicines)
  const attentionItems = deriveAttentionItems(medicines)
  const fastMoving = fastMovingMedicines(medicines, transactions)
  const selectMedicine = (medicine) => navigate(`/inventory?medicine=${encodeURIComponent(medicine.id)}`)

  return (
    <>
      <PageHeader
        eyebrow="Live command center"
        title="Good morning, Krish."
        description="Here’s what’s happening across CityCare Pharmacy today."
        actions={<Button to="/inventory" iconRight={ArrowUpRight}>Manage inventory</Button>}
      />

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
        <div className="order-2 min-w-0 xl:order-1">
          <InventoryHealth medicines={medicines} onSelect={selectMedicine} />
        </div>
        <DashboardAttention className="order-1 xl:order-2" items={attentionItems} stockValue={kpis.stockValue} />
      </section>

      <section aria-label="Inventory key metrics" className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl bg-fg p-5 text-page">
          <p className="eyebrow text-brand-300">Inventory value</p>
          <p className="mt-2 font-display text-3xl font-bold">{formatCurrencyCompact(kpis.stockValue)}</p>
          <p className="mt-1 text-xs text-page/60">{formatNumber(kpis.totalUnits)} units · {kpis.totalSkus} batches</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Low stock</p>
          <p className="mt-2 text-3xl font-bold text-low">{kpis.lowStock}</p>
          <p className="mt-1 text-xs text-muted">batches below minimum</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Expiring soon</p>
          <p className="mt-2 text-3xl font-bold text-expiring">{kpis.expiringSoon}</p>
          <p className="mt-1 text-xs text-muted">within next 30 days</p>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <ExpiryRadar medicines={medicines} onSelect={selectMedicine} />
        <div className="rounded-[2rem] border border-line bg-surface p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="eyebrow">Fast moving</p>
              <h2 className="mt-2 text-xl font-bold">What is leaving fastest?</h2>
            </div>
            <TrendingUp className="text-brand-600" />
          </div>
          <div className="mt-5 divide-y divide-line">
            {fastMoving.map((medicine) => (
              <button
                key={medicine.id}
                onClick={() => selectMedicine(medicine)}
                className="flex w-full items-center gap-3 py-3 text-left hover:text-brand-700"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300">
                  <Package size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{medicine.name}</span>
                  <span className="text-xs text-muted">{medicine.quantity} in stock</span>
                </span>
                <span className="text-sm font-bold">{formatNumber(medicine.sold)} sold</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <StockFlow />
      </section>
    </>
  )
}
