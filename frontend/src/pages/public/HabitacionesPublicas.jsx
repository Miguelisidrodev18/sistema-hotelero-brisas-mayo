import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, Eye, BedDouble, MapPin, Filter } from 'lucide-react'
import { habitacionesApi } from '../../api/habitaciones'
import { sedesApi } from '../../api/sedes'
import { useAuth } from '../../context/AuthContext'

const TIPO_GRADIENTS = {
  matrimonial:           'linear-gradient(135deg, #7B4019 0%, #3D1A06 100%)',
  matrimonial_king:      'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  matrimonial_queen:     'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
  matrimonial_adicional: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
  doble:                 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
  triple:                'linear-gradient(135deg, #5b21b6 0%, #3b0764 100%)',
}

function HabCard({ hab, onReservar }) {
  const gradient = hab.sede_imagen ? null : (TIPO_GRADIENTS[hab.tipo] ?? TIPO_GRADIENTS.matrimonial)

  return (
    <article style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(61,26,6,0.07)', background: 'white', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(61,26,6,0.14)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(61,26,6,0.07)' }}>

      {/* Imagen / gradiente */}
      <div style={{ position: 'relative', height: 200, background: gradient ?? '#3D1A06', overflow: 'hidden', flexShrink: 0 }}>
        {hab.sede_imagen && (
          <img src={hab.sede_imagen} alt={hab.sede_nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }}/>
        )}
        {!hab.sede_imagen && (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.2, background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,.5) 0%, transparent 60%)' }}/>
        )}

        {/* Badge tipo */}
        <span style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '5px 12px', borderRadius: 9999 }}>
          {hab.tipo_label}
        </span>

        {/* Precio */}
        <div style={{ position: 'absolute', bottom: 14, right: 14, background: '#F5922E', color: 'white', borderRadius: 12, padding: '6px 14px', fontWeight: 800, fontSize: '0.9rem' }}>
          S/ {hab.precio}<span style={{ fontSize: '0.65rem', fontWeight: 400 }}>/noche</span>
        </div>

        {/* Sede */}
        <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 9999 }}>
          <MapPin size={11}/> {hab.sede_nombre}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontWeight: 700, color: '#3D1A06', fontSize: '1rem', marginBottom: '0.2rem' }}>
            Habitación N° {hab.numero}
          </h3>
          {hab.descripcion && (
            <p style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {hab.descripcion}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#6B7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Users size={13}/> {hab.capacidad} pers.
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <BedDouble size={13}/> Piso {hab.piso}
          </span>
          {hab.tiene_vista && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Eye size={13}/> Vista
            </span>
          )}
        </div>

        <button onClick={() => onReservar(hab)}
          style={{ width: '100%', padding: '0.7rem', marginTop: 'auto', background: 'linear-gradient(135deg, #F5922E, #E07820)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          Reservar esta habitación
        </button>
      </div>
    </article>
  )
}

export default function HabitacionesPublicas() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [habitaciones, setHabitaciones] = useState([])
  const [sedes, setSedes]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [filters, setFilters]           = useState({
    sede:       searchParams.get('sede') ?? '',
    capacidad:  '',
    precio_max: '',
  })

  useEffect(() => {
    sedesApi.getPublicas().then(r => setSedes(r.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (filters.sede)       params.sede       = filters.sede
    if (filters.capacidad)  params.capacidad  = filters.capacidad
    if (filters.precio_max) params.precio_max = filters.precio_max
    habitacionesApi.getDisponibles(params)
      .then(r => setHabitaciones(r.data))
      .finally(() => setLoading(false))
  }, [filters])

  function handleReservar(hab) {
    if (isAuthenticated) {
      navigate(`/reservas?hab=${hab.id}`)
    } else {
      navigate(`/login?next=/reservas?hab=${hab.id}`)
    }
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  const inp = { border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.6rem 1rem', fontSize: '0.875rem', outline: 'none', background: 'white' }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6ED', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Hero header con navbar integrada */}
      <div style={{ background: 'linear-gradient(135deg, #3D1A06 0%, #7B4019 60%, #F5922E 100%)', padding: '0 0 3rem' }}>

        {/* Navbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Logo + nombre */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <img src="/images/Logo-hotel.jpeg" alt="Brisas de Mayo"
              style={{ height: 44, width: 'auto', objectFit: 'contain' }}/>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>Brisas de Mayo</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>Huancaya, Yauyos</p>
            </div>
          </a>

          {/* Botón volver */}
          <a href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1.1rem', borderRadius: 9999, transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
            ← Volver al inicio
          </a>
        </div>

        {/* Título */}
        <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem 0' }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Brisas de Mayo · Huancaya, Yauyos
          </p>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '0.75rem', fontFamily: 'Georgia, serif' }}>
            Habitaciones disponibles
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', maxWidth: 480, margin: '0 auto' }}>
            Elige tu habitación perfecta entre cascadas y lagunas turquesa
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Filtros */}
        <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '2rem', border: '1px solid #E5E7EB', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>
            <Filter size={15}/> Filtrar:
          </div>

          <select style={inp} value={filters.sede} onChange={e => setFilter('sede', e.target.value)}>
            <option value="">Todas las sedes</option>
            {sedes.map(s => <option key={s.id} value={s.slug}>{s.nombre}</option>)}
          </select>

          <select style={inp} value={filters.capacidad} onChange={e => setFilter('capacidad', e.target.value)}>
            <option value="">Cualquier capacidad</option>
            <option value="1">1+ persona</option>
            <option value="2">2+ personas</option>
            <option value="3">3+ personas</option>
          </select>

          <select style={inp} value={filters.precio_max} onChange={e => setFilter('precio_max', e.target.value)}>
            <option value="">Cualquier precio</option>
            <option value="150">Hasta S/ 150</option>
            <option value="250">Hasta S/ 250</option>
            <option value="400">Hasta S/ 400</option>
          </select>

          {(filters.sede || filters.capacidad || filters.precio_max) && (
            <button onClick={() => setFilters({ sede: '', capacidad: '', precio_max: '' })}
              style={{ padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
              Limpiar filtros
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#9CA3AF' }}>
            {loading ? 'Buscando...' : `${habitaciones.length} habitación${habitaciones.length !== 1 ? 'es' : ''}`}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏨</p>
            <p>Buscando habitaciones...</p>
          </div>
        ) : habitaciones.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>😔</p>
            <p style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>No hay habitaciones disponibles</p>
            <p style={{ fontSize: '0.875rem' }}>Intenta con otros filtros o fechas</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
            {habitaciones.map(h => (
              <HabCard key={h.id} hab={h} onReservar={handleReservar}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
