/** Number & currency formatting (Indian locale, INR). */

const CURRENCY = 'INR'
const LOCALE = 'en-IN'

const currencyFmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 })
const currencyFmt2 = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 })
const numberFmt = new Intl.NumberFormat(LOCALE)
const compactFmt = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })

/** ₹1,24,500 */
export const formatCurrency = (n) => currencyFmt.format(Math.round(n || 0))
/** ₹42.50 */
export const formatPrice = (n) => currencyFmt2.format(n || 0)
/** 2,486 */
export const formatNumber = (n) => numberFmt.format(Math.round(n || 0))
/** 1.2L / 3.4K style compact */
export const formatCompact = (n) => compactFmt.format(n || 0)
/** ₹1.2L compact currency */
export const formatCurrencyCompact = (n) => '₹' + compactFmt.format(n || 0)
/** 72% */
export const formatPercent = (n, digits = 0) => `${(n || 0).toFixed(digits)}%`

export const pluralize = (n, one, many = one + 's') => `${formatNumber(n)} ${n === 1 ? one : many}`
