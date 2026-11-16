import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'
import './index.css'

// Route-level code splitting (bundle-dynamic-imports)
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminStations = lazy(() => import('./pages/AdminStations'))
const InsightsView = lazy(() => import('./pages/InsightsView'))

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#F7F6F9] dark:bg-[#0C0910] flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 border-2 border-[#6D288A] dark:border-[#B975DB] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">กำลังโหลดหน้าต่าง...</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/dashboard" element={<OwnerDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/stations" element={<AdminStations />} />
            <Route path="/insights" element={<InsightsView />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
)
