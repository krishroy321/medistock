/**
 * Date helpers. All inventory dates are stored as ISO strings (YYYY-MM-DD for
 * calendar dates, full ISO for timestamps). "Today" is evaluated at load so
 * the sample data always stays relative to the current date.
 */

const DAY = 86_400_000

export function startOfDay(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export const TODAY = startOfDay()

/** ISO date (YYYY-MM-DD) for today + n days (local time). */
export function isoInDays(n, from = TODAY) {
  const d = new Date(from.getTime() + n * DAY)
  return toISODate(d)
}

export function toISODate(d) {
  const x = new Date(d)
  const y = x.getFullYear()
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse YYYY-MM-DD as a local date (avoids UTC shift). */
export function parseDate(value) {
  if (value instanceof Date) return value
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

/** Whole days from today until the date (negative when in the past). */
export function daysUntil(value, from = TODAY) {
  return Math.round((startOfDay(parseDate(value)).getTime() - from.getTime()) / DAY)
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' })
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'short' })
const monthYearFmt = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

/** "24 Mar 2027" */
export const formatDate = (v) => dateFmt.format(parseDate(v))
/** "24 Mar" */
export const formatShortDate = (v) => shortFmt.format(parseDate(v))
/** "Mar" */
export const formatMonth = (v) => monthFmt.format(parseDate(v))
/** "Mar 2027" */
export const formatMonthYear = (v) => monthYearFmt.format(parseDate(v))
/** "14:05" */
export const formatTime = (v) => timeFmt.format(parseDate(v))

/** Human relative label: "in 12 days", "3 days ago", "today". */
export function relativeDays(value) {
  const n = daysUntil(value)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  if (n > 0) return n > 60 ? `in ${Math.round(n / 30)} months` : `in ${n} days`
  const a = Math.abs(n)
  return a > 60 ? `${Math.round(a / 30)} months ago` : `${a} days ago`
}

/** "5 min ago", "2 h ago", "3 d ago" for timestamps. */
export function timeAgo(value) {
  const diff = Date.now() - parseDate(value).getTime()
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  const d = Math.round(h / 24)
  return `${d} d ago`
}
