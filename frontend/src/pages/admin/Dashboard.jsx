import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { habitacionesApi } from '../../api/habitaciones'
import { sedesApi } from '../../api/sedes'
import { useAuth } from '../../context/AuthContext'
import { BedDouble, CheckCircle2, Users, Wrench, Sparkles, ArrowRight, Building2 } from 'lucide-react'

const STATUS_META = {
  disponible:   { label: 'Disponibles',   color: '#16A34A', bg: '#DCFCE7', icon: CheckCircle2 },
  ocupada:      { label: 'Ocupadas',      color: '#DC2626', bg: '#FEE2E2', icon: Users },
  reservada:    { label: 'Reservadas',    color: '#2563EB', bg: '#DBEAFE', icon: BedDouble },
  limpieza:     { label: 'En Limpieza',   color: '#D97706', bg: '#FEF3C7', icon: Sparkles },
  mantenimiento:{ label: 'Mantenimiento', color: '#6B7280', bg: '#F3F4F6', icon: Wrench },
}

function StatCard({ label, value, color, bg, Icon, loading }) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: 14, padding: '20px 22px',
      border: '1px solid #E5E7EB',
      display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        backgroundColor: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        {loading ? (
          <div style={{ width: 40, height: 28, backgroundColor: '#F3F4F6', borderRadius: 6 }} />
        ) : (
          <p style={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</p>
        )}
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 3 }}>{label}</p>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [habitaciones, setHabitaciones] = useState([])
  const [sedes,        setSedes]        = useState([])
  const [loading,      setLoading]      = useState(true)

  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    Promise.all([habitacionesApi.getAll(), sedesApi.getAll()])
      .then(([hRes, sRes]) => {
        setHabitaciones(hRes.data)
        setSedes(sRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const counts = habitaciones.reduce((acc, h) => {
    acc[h.estado] = (acc[h.estado] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Welcome header */}
      <div style={{
        backgroundColor: '#3D1A06',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        backgroundImage: 'linear-gradient(135deg, #3D1A06 0%, #7B4019 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 180, height: 180, borderRadius: '50%',
          backgroundColor: 'rgba(245,146,46,0.1)',
        }} />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4, textTransform: 'capitalize' }}>
          {today}
        </p>
        <h2 style={{ color: 'white', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Bienvenido, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>
          Panel de administración — Hotel Brisas de Mayo
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        <StatCard
          label="Total habitaciones"
          value={habitaciones.length}
          color="#3D1A06" bg="#FDF6ED"
          Icon={BedDouble}
          loading={loading}
        />
        {Object.entries(STATUS_META).map(([key, meta]) => (
          <StatCard
            key={key}
            label={meta.label}
            value={counts[key] || 0}
            color={meta.color}
            bg={meta.bg}
            Icon={meta.icon}
            loading={loading}
          />
        ))}
      </div>

      {/* Sedes overview */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Sedes</h3>
          <Link to="/admin/sedes" style={{
            fontSize: 13, color: '#F5922E', fontWeight: 600,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
          }}>
            Ver todo <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {loading
            ? [1, 2].map(i => (
                <div key={i} style={{
                  backgroundColor: 'white', borderRadius: 14, padding: 20,
                  border: '1px solid #E5E7EB', height: 120,
                  backgroundColor: '#F9FAFB',
                }} />
              ))
            : sedes.map(sede => {
                const sedeHabs = habitaciones.filter(h => h.sede_id === sede.id)
                const disponibles = sedeHabs.filter(h => h.estado === 'disponible').length
                const ocupadas    = sedeHabs.filter(h => h.estado === 'ocupada').length
                const ocupancyPct = sedeHabs.length ? Math.round((ocupadas / sedeHabs.length) * 100) : 0

                return (
                  <div key={sede.id} style={{
                    backgroundColor: 'white', borderRadius: 14, padding: 20,
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: 'linear-gradient(135deg,#F5922E,#D4A843)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Building2 size={18} color="white" />
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{sede.nombre}</p>
                        <p style={{ fontSize: 12, color: '#9CA3AF' }}>{sede.habitaciones_count} habitaciones</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#16A34A' }}>{disponibles}</p>
                        <p style={{ fontSize: 11, color: '#6B7280' }}>disponibles</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 20, fontWeight: 800, color: '#DC2626' }}>{ocupadas}</p>
                        <p style={{ fontSize: 11, color: '#6B7280' }}>ocupadas</p>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div style={{ height: 6, backgroundColor: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${ocupancyPct}%`,
                        background: 'linear-gradient(90deg,#F5922E,#DC2626)',
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                    <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 5 }}>{ocupancyPct}% ocupación</p>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Acciones rápidas</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Gestionar Habitaciones', to: '/admin/habitaciones', bg: '#3D1A06' },
            { label: 'Configuración',          to: '/admin/configuracion', bg: '#F5922E' },
            { label: 'Ver Sedes',              to: '/admin/sedes',         bg: '#7B4019' },
          ].map(({ label, to, bg }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10,
                backgroundColor: bg, color: 'white',
                textDecoration: 'none', fontSize: 14, fontWeight: 600,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {label} <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
