import { LayoutDashboard, Boxes, CalendarClock, Truck, BarChart3 } from 'lucide-react'

/** Primary application navigation. */
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/expiry-alerts', label: 'Expiry Alerts', icon: CalendarClock },
  { to: '/suppliers', label: 'Suppliers', icon: Truck },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
]

export const CURRENT_USER = {
  name: 'Dr. Krish Mahato',
  role: 'Pharmacist-in-charge',
  email: 'krish.mahato@citycarepharmacy.in',
  initials: 'KM',
  pharmacy: 'CityCare Pharmacy',
  branch: 'Andheri West, Mumbai',
}
