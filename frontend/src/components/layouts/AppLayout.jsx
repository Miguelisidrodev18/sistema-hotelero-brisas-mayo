import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES = {
  '/admin':                   'Dashboard',
  '/admin/reservas':          'Reservas',
  '/admin/habitaciones':      'Habitaciones',
  '/admin/sedes':             'Sedes',
  '/admin/usuarios':          'Usuarios',
  '/admin/configuracion':     'Configuración',
  '/recepcion':               'Dashboard Recepción',
  '/recepcion/habitaciones':  'Habitaciones',
  '/recepcion/reservas':      'Reservas',
  '/recepcion/checkin':       'Check-in',
  '/recepcion/checkout':      'Check-out',
  '/reservas':                'Mis Reservas',
  '/reservas/nueva':          'Nueva Reserva',
  '/reservas/perfil':         'Mi Perfil',
  '/dashboard':               'Dashboard',
  '/dashboard/reportes':      'Reportes',
  '/dashboard/finanzas':      'Finanzas',
}

export default function AppLayout() {
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [isDesktop,   setIsDesktop]   = useState(() => window.innerWidth >= 1024)
  const location  = useLocation()
  const { user }  = useAuth()

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  // Track viewport
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const sidebarW  = collapsed ? 68 : 260
  const contentML = isDesktop ? sidebarW : 0

  function getTitle(pathname) {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
    if (pathname.startsWith('/reservas/pago/')) return 'Confirmar Pago'
    return 'Panel'
  }
  const pageTitle = getTitle(location.pathname)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F9FAFB' }}>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Right side: topbar + content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, overflow: 'hidden',
        marginLeft: contentML,
        transition: 'margin-left 0.28s cubic-bezier(.22,1,.36,1)',
      }}>

        {/* ── Topbar ── */}
        <header style={{
          height: 64, flexShrink: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #E5E7EB',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 14,
        }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex lg:hidden"
            style={{
              width: 36, height: 36, borderRadius: 8, border: 'none',
              backgroundColor: '#F3F4F6', cursor: 'pointer',
              alignItems: 'center', justifyContent: 'center',
              color: '#374151',
            }}
          >
            <Menu size={18} />
          </button>

          {/* Page title */}
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{pageTitle}</h1>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
              Hotel Brisas de Mayo
            </p>
          </div>

          <div style={{ flex: 1 }} />

          {/* Notification bell */}
          <button style={{
            width: 36, height: 36, borderRadius: 8,
            backgroundColor: '#F3F4F6', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#6B7280',
          }}>
            <Bell size={17} />
          </button>

          {/* User pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 20,
            backgroundColor: '#FDF6ED',
            border: '1px solid rgba(245,146,46,0.2)',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg,#F5922E,#E07820)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#3D1A06' }}>
              {user?.name?.split(' ')[0]}
            </span>
          </div>
        </header>

        {/* ── Page content ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
