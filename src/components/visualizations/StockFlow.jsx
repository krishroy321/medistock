import { ArrowDown, ArrowRight, Package, ShoppingCart, Store, Warehouse } from 'lucide-react'

const steps = [['Purchase', ShoppingCart], ['Warehouse', Warehouse], ['Pharmacy', Store], ['Sale', Package]]
export function StockFlow() {
  return <div className="rounded-[2rem] border border-line bg-surface p-6 sm:p-8"><div className="mb-8"><p className="eyebrow">Stock movement</p><h2 className="mt-2 text-xl font-bold">From stockroom to counter</h2><p className="mt-1 text-sm text-muted">A live view of how units move through your pharmacy.</p></div><div className="flex flex-col items-center justify-between gap-3 sm:flex-row">{steps.map(([label, Icon], i) => <div key={label} className="flex w-full items-center gap-3 sm:w-auto"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300"><Icon size={20} /></span><span className="text-sm font-semibold">{label}</span></div>{i < steps.length - 1 && <ArrowRight className="hidden text-brand-300 sm:block" size={18} />}{i < steps.length - 1 && <ArrowDown className="ml-auto text-brand-300 sm:hidden" size={18} />}</div>)}</div></div>
}
