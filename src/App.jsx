import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useStore } from './store/useStore.js'
import { AppShell } from './components/layout/AppShell.jsx'
import { LandingPage } from './pages/LandingPage.jsx'
import { DashboardPage } from './pages/app/DashboardPage.jsx'
import { InventoryPage } from './pages/app/InventoryPage.jsx'
import { ExpiryAlertsPage } from './pages/app/ExpiryAlertsPage.jsx'
import { SuppliersPage } from './pages/app/SuppliersPage.jsx'
import { ReportsPage } from './pages/app/ReportsPage.jsx'

function ThemeSync() {
  const theme = useStore((s) => s.theme)
  const reduceMotion = useStore((s) => s.reduceMotion)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [theme, reduceMotion])
  return null
}

function App() {
  return <BrowserRouter><ThemeSync /><Routes><Route path="/" element={<LandingPage />} /><Route element={<AppShell />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/inventory" element={<InventoryPage />} /><Route path="/expiry-alerts" element={<ExpiryAlertsPage />} /><Route path="/suppliers" element={<SuppliersPage />} /><Route path="/reports" element={<ReportsPage />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter>
}

export default App
