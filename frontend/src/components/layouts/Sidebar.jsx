import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BedDouble, Building2, Users, Settings,
  CalendarDays, ArrowRightToLine, ArrowLeftFromLine,
  BarChart3, DollarSign, UserCircle, ChevronLeft, ChevronRight,
  Hotel, X, LogOut, Menu,
} from 'lucide-react'

const NAV = {
  administrador: [
    { icon: LayoutDashboard, label: 'Dashboard',     to: '/admin',                end: true },
    { icon: BedDouble,       label: 'Habitaciones',  to: '/admin/habitaciones' },
    { icon: Building2,       label: 'Sedes',         to: '/admin/sedes' },
    { icon: Users,           label: 'Usuarios',      to: '/admin/usuarios' },
    { icon: Settings,        label: 'Configuración', to: '/admin/configuracion' },
  ],
  recepcionista: [
    { icon: LayoutDashboard,   label: 'Dashboard',    to: '/recepcion',               end: true },
    { icon: BedDouble,         label: 'Habitaciones', to: '/recepcion/habitaciones' },
    { icon: CalendarDays,      label: 'Reservas',     to: '/recepcion/reservas' },
    { icon: ArrowRightToLine,  label: 'Check-in',     to: '/recepcion/checkin' },
    { icon: ArrowLeftFromLine, label: 'Check-out',    to: '/recepcion/checkout' },
  ],
  cliente: [
    { icon: CalendarDays, label: 'Mis Reservas', to: '/reservas',       end: true },
    { icon: UserCircle,   label: 'Mi Perfil',    to: '/reservas/perfil' },
  ],
  gerente: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard', end: true },
    { icon: BarChart3,       label: 'Reportes',  to: '/dashboard/reportes' },
  ],
  contador: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard', end: true },
    { icon: DollarSign,      label: 'Finanzas',  to: '/dashboard/finanzas' },
  ],
}

const ROLE_LABEL = {
  administrador: 'Administrador',
  recepcionista: 'Recepcionista',
  cliente:       'Cliente',
  gerente:       'Gerente',
  contador:      'Contador',
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)

  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const items   = NAV[user?.role] || []
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U'
  const sideW   = collapsed ? 68 : 260
  const translateX = (!isDesktop && !mobileOpen) ? '-100%' : '0'

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 30,
      width: sideW,
      display: 'flex', flexDirection: 'column',
      backgroundColor: '#3D1A06',
      transform: `translateX(${translateX})`,
      transition: 'width 0.28s cubic-bezier(.22,1,.36,1), transform 0.28s cubic-bezier(.22,1,.36,1)',
      overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        height: 64, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 14px' : '0 14px 0 16px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', flex: 1 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,#F5922E,#D4A843)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Hotel size={18} color="white" />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap' }}>Brisas</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, whiteSpace: 'nowrap' }}>de Mayo</p>
            </div>
          )}
        </div>

        {/* Desktop collapse toggle */}
        {isDesktop && (
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.65)',
            }}
          >
            {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
          </button>
        )}

        {/* Mobile close */}
        {!isDesktop && (
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              backgroundColor: 'rgba(255,255,255,0.08)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'rgba(255,255,255,0.65)',
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <p style={{
            color: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '4px 8px 10px',
          }}>
            Menú principal
          </p>
        )}

        {items.map(({ icon: Icon, label, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 11,
              padding: collapsed ? '11px 0' : '10px 12px',
              marginBottom: 2, borderRadius: 10,
              justifyContent: collapsed ? 'center' : 'flex-start',
              textDecoration: 'none',
              color: isActive ? 'white' : 'rgba(255,255,255,0.55)',
              backgroundColor: isActive ? 'rgba(245,146,46,0.18)' : 'transparent',
              borderLeft: isActive ? '3px solid #F5922E' : '3px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={19} style={{ flexShrink: 0, color: isActive ? '#F5922E' : 'rgba(255,255,255,0.55)' }} />
                {!collapsed && (
                  <span style={{
                    fontSize: 13.5, fontWeight: isActive ? 600 : 400,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: collapsed ? '12px 8px' : '12px 14px',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#F5922E,#E07820)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>{initial}</span>
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <p style={{
                color: 'white', fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.name}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                {ROLE_LABEL[user?.role] || user?.role}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: collapsed ? '8px 0' : '8px 10px',
            borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
            fontSize: 13, transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.15)'
            e.currentTarget.style.color = '#fca5a5'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
          }}
        >
          <LogOut size={15} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
