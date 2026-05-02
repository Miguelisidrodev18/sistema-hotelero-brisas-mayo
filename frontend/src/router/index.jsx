import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '../context/AuthContext'
import PrivateRoute from './PrivateRoute'
import Landing  from '../pages/public/Landing'
import Login    from '../pages/auth/Login'
import Register from '../pages/auth/Register'

function Placeholder({ title }) {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 flex flex-col items-center gap-3 w-full max-w-sm">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500">Hola, <strong>{user?.name}</strong> ({user?.role})</p>
        <button onClick={logout} className="mt-2 text-sm text-red-500 hover:underline">
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()
  if (loading) return null
  if (isAuthenticated) {
    const home = { administrador: '/admin', recepcionista: '/recepcion', contador: '/dashboard', gerente: '/dashboard' }
    return <Navigate to={home[user.role] ?? '/reservas'} replace />
  }
  return children
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Landing pública */}
          <Route path="/" element={<Landing />} />

          {/* Auth */}
          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          {/* Cliente */}
          <Route path="/reservas" element={
            <PrivateRoute roles={['cliente']}>
              <Placeholder title="Mis Reservas" />
            </PrivateRoute>
          } />

          {/* Recepcionista */}
          <Route path="/recepcion" element={
            <PrivateRoute roles={['recepcionista', 'administrador']}>
              <Placeholder title="Dashboard Recepción" />
            </PrivateRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={
            <PrivateRoute roles={['administrador']}>
              <Placeholder title="Panel Administrador" />
            </PrivateRoute>
          } />

          {/* Gerente / Contador */}
          <Route path="/dashboard" element={
            <PrivateRoute roles={['gerente', 'contador', 'administrador']}>
              <Placeholder title="Dashboard Gerencial" />
            </PrivateRoute>
          } />

          <Route path="/no-autorizado" element={
            <div className="min-h-screen flex items-center justify-center">
              <p className="text-gray-600">No tienes permiso para acceder a esta sección.</p>
            </div>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
