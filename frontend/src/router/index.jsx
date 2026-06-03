import { BrowserRouter, Navigate, Route, Routes, useSearchParams } from 'react-router-dom'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { ToastProvider } from '../context/ToastContext'
import PrivateRoute from './PrivateRoute'
import AppLayout    from '../components/layouts/AppLayout'

// Public pages
import Landing              from '../pages/public/Landing'
import HabitacionesPublicas from '../pages/public/HabitacionesPublicas'
import Restaurante          from '../pages/public/Restaurante'
import ReciboPago           from '../pages/public/ReciboPago'
import TicketCheckin        from '../pages/public/TicketCheckin'
import FolioSalida          from '../pages/public/FolioSalida'
import Login    from '../pages/auth/Login'
import Register from '../pages/auth/Register'

// Admin pages
import AdminDashboard    from '../pages/admin/Dashboard'
import Habitaciones      from '../pages/admin/Habitaciones'
import Configuracion     from '../pages/admin/Configuracion'
import Usuarios          from '../pages/admin/Usuarios'
import Sedes             from '../pages/admin/Sedes'
import Servicios         from '../pages/admin/Servicios'
import TarifasTemporada  from '../pages/admin/TarifasTemporada'

// Recepcion pages
import ReservasRecepcion from '../pages/recepcion/Reservas'
import Hoy               from '../pages/recepcion/Hoy'
import CajaDiaria        from '../pages/recepcion/CajaDiaria'

// Cliente pages
import MisReservas         from '../pages/cliente/MisReservas'
import ReservarHabitacion  from '../pages/cliente/ReservarHabitacion'
import PagoReserva         from '../pages/cliente/PagoReserva'
import MiPerfil            from '../pages/cliente/MiPerfil'

// Admin / Recepcion shared pages
import Pagos               from '../pages/admin/Pagos'
import Platos              from '../pages/admin/Platos'
import DashboardGerencial  from '../pages/gerente/DashboardGerencial'
import Cocheras            from '../pages/admin/Cocheras'
import MisCocheras         from '../pages/cliente/MisCocheras'
import Cocina              from '../pages/cocina/Cocina'

// Placeholder for unbuilt pages
function Placeholder({ title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh',
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: 16, padding: '40px 48px',
        border: '1px solid #E5E7EB', textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <p style={{ fontSize: 28 }}>🚧</p>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginTop: 12 }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 6 }}>Próximamente disponible</p>
      </div>
    </div>
  )
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next')

  if (loading) return null
  if (isAuthenticated) {
    // Si hay un destino pendiente (venía de reservar una habitación), respetarlo
    if (next && user.role === 'cliente') {
      return <Navigate to={next} replace />
    }
    const home = {
      administrador: '/admin',
      recepcionista: '/recepcion',
      contador:      '/dashboard',
      gerente:       '/dashboard',
    }
    return <Navigate to={home[user.role] ?? '/reservas'} replace />
  }
  return children
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
        <Routes>

          {/* ── Public ── */}
          <Route path="/"              element={<Landing />} />
          <Route path="/habitaciones"  element={<HabitacionesPublicas />} />
          <Route path="/restaurant"    element={<Restaurante />} />
          <Route path="/recibo/:codigo" element={<ReciboPago />} />
          <Route path="/ticket/:codigo" element={<TicketCheckin />} />
          <Route path="/folio/:codigo"  element={<FolioSalida />} />
          <Route path="/login"         element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register"      element={<GuestRoute><Register /></GuestRoute>} />

          {/* ── Administrador ── */}
          <Route path="/admin" element={
            <PrivateRoute roles={['administrador']}>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route index                  element={<AdminDashboard />} />
            <Route path="habitaciones"    element={<Habitaciones />} />
            <Route path="configuracion"   element={<Configuracion />} />
            <Route path="reservas"        element={<ReservasRecepcion />} />
            <Route path="pagos"           element={<Pagos />} />
            <Route path="cocheras"        element={<Cocheras />} />
            <Route path="sedes"           element={<Sedes />} />
            <Route path="usuarios"        element={<Usuarios />} />
            <Route path="servicios"       element={<Servicios />} />
            <Route path="tarifas"         element={<TarifasTemporada />} />
            <Route path="platos"          element={<Platos />} />
          </Route>

          {/* ── Recepcionista ── */}
          <Route path="/recepcion" element={
            <PrivateRoute roles={['recepcionista', 'administrador']}>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route index                  element={<Hoy />} />
            <Route path="habitaciones"    element={<Habitaciones />} />
            <Route path="reservas"        element={<ReservasRecepcion />} />
            <Route path="pagos"           element={<Pagos />} />
            <Route path="caja"            element={<CajaDiaria />} />
          </Route>

          {/* ── Cliente ── */}
          <Route path="/reservas" element={
            <PrivateRoute roles={['cliente']}>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route index              element={<MisReservas />} />
            <Route path="nueva"       element={<ReservarHabitacion />} />
            <Route path="pago/:reservaId" element={<PagoReserva />} />
            <Route path="cochera"     element={<MisCocheras />} />
            <Route path="perfil"      element={<MiPerfil />} />
          </Route>

          {/* ── Cocina ── */}
          <Route path="/cocina" element={
            <PrivateRoute roles={['administrador', 'recepcionista', 'cocinero']}>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route index element={<Cocina />} />
          </Route>

          {/* ── Gerente / Contador ── */}
          <Route path="/dashboard" element={
            <PrivateRoute roles={['gerente', 'contador', 'administrador']}>
              <AppLayout />
            </PrivateRoute>
          }>
            <Route index             element={<DashboardGerencial />} />
            <Route path="reportes"   element={<Placeholder title="Reportes" />} />
            <Route path="finanzas"   element={<Placeholder title="Finanzas" />} />
          </Route>

          {/* ── Errors ── */}
          <Route path="/no-autorizado" element={
            <div style={{
              minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#F9FAFB',
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>🚫</p>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Acceso no autorizado</h2>
                <p style={{ color: '#6B7280', marginTop: 6 }}>No tienes permiso para acceder a esta sección.</p>
              </div>
            </div>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
