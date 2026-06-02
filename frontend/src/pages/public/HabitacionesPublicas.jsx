import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, Eye, BedDouble, MapPin, Filter, LogIn, UserPlus, X, CalendarCheck } from 'lucide-react'
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

const MESES    = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_SEM = ['D','L','M','M','J','V','S']

// ── Mini Calendario ──────────────────────────────────────
function MiniCal({ hab, fechasOcupadas = [], onDateSelect }) {
  const [offset,  setOffset]  = useState(0)
  const [hovered, setHovered] = useState(null)

  const base  = new Date()
  const ref   = new Date(base.getFullYear(), base.getMonth() + offset, 1)
  const year  = ref.getFullYear()
  const month = ref.getMonth()

  const ocupados = useMemo(() => {
    const set = new Set()
    fechasOcupadas.forEach(({ entrada, salida }) => {
      const d   = new Date(entrada + 'T12:00:00')
      const fin = new Date(salida  + 'T12:00:00')
      while (d <= fin) {
        set.add(d.toISOString().split('T')[0])
        d.setDate(d.getDate() + 1)
      }
    })
    return set
  }, [fechasOcupadas])

  const primerDia = new Date(year, month, 1).getDay()
  const diasEnMes = new Date(year, month + 1, 0).getDate()
  const hoyStr    = base.toISOString().split('T')[0]
  const hayOcupados = ocupados.size > 0
  const pad = n => String(n).padStart(2, '0')

  return (
    <div style={{ padding: '0.55rem 0.85rem 0.75rem', borderTop: '1.5px solid #F3F4F6', background: '#FAFAFA' }}>

      {/* Navegación mes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
        <button onClick={e => { e.stopPropagation(); setOffset(o => o - 1) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '1.1rem', lineHeight: 1, padding: '0 3px', borderRadius: 4 }}>
          ‹
        </button>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3D1A06', letterSpacing: '0.03em' }}>
          {MESES[month]} {year}
        </span>
        <button onClick={e => { e.stopPropagation(); setOffset(o => o + 1) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '1.1rem', lineHeight: 1, padding: '0 3px', borderRadius: 4 }}>
          ›
        </button>
      </div>

      {/* Grilla */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: 2 }}>
        {/* Cabecera días */}
        {DIAS_SEM.map((d, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: '0.6rem', fontWeight: 700, paddingBottom: 3,
            color: i === 0 || i === 6 ? '#F5922E' : '#9CA3AF',
          }}>{d}</div>
        ))}

        {/* Celdas vacías */}
        {Array.from({ length: primerDia }, (_, i) => <div key={`v-${i}`}/>)}

        {/* Días */}
        {Array.from({ length: diasEnMes }, (_, i) => {
          const dia       = i + 1
          const dateStr   = `${year}-${pad(month + 1)}-${pad(dia)}`
          const isOcupado = ocupados.has(dateStr)
          const isHoy     = dateStr === hoyStr
          const isPasado  = dateStr < hoyStr
          const isFuturo  = !isPasado && !isHoy
          const isLibre   = isFuturo && !isOcupado
          const isHovered = hovered === dateStr && isLibre

          let bg    = 'transparent'
          let color = '#374151'
          let fw    = 400
          let cursor = 'default'

          if (isOcupado) { bg = '#EF4444'; color = 'white'; fw = 700 }
          else if (isHoy) { bg = '#F5922E'; color = 'white'; fw = 700 }
          else if (isPasado) { color = '#D1D5DB' }
          else if (isHovered) { bg = '#D1FAE5'; color = '#065F46'; fw = 700; cursor = 'pointer' }
          else if (isFuturo)  { cursor = 'pointer' }

          return (
            <div key={dia} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1px 0' }}>
              <div
                onMouseEnter={() => isLibre && setHovered(dateStr)}
                onMouseLeave={() => setHovered(null)}
                onClick={e => { e.stopPropagation(); if (isLibre) onDateSelect(hab, dateStr) }}
                title={isOcupado ? 'Fecha ocupada' : isLibre ? 'Clic para reservar desde esta fecha' : ''}
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: bg, color, fontWeight: fw, cursor,
                  fontSize: '0.62rem',
                  boxShadow: isHoy ? '0 2px 8px rgba(245,146,46,0.4)' : isOcupado ? '0 2px 6px rgba(239,68,68,0.3)' : 'none',
                  transition: 'background 0.12s, transform 0.1s',
                  transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                  border: isHoy ? 'none' : isOcupado ? 'none' : isLibre && !isHovered ? '1px solid transparent' : 'none',
                }}>
                {dia}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {hayOcupados && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', color: '#6B7280' }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}/>
            Ocupado
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', color: '#6B7280' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#F5922E', display: 'inline-block' }}/>
          Hoy
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', color: '#6B7280' }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#D1FAE5', border: '1px solid #6EE7B7', display: 'inline-block' }}/>
          Libre — clic para reservar
        </span>
      </div>
    </div>
  )
}

// ── Modal: requiere cuenta ────────────────────────────────
function ModalAuth({ hab, dest, onClose, navigate }) {
  if (!hab) return null
  const gradient  = TIPO_GRADIENTS[hab.tipo] ?? TIPO_GRADIENTS.matrimonial
  const encoded   = encodeURIComponent(dest)

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.22)', overflow: 'hidden' }}>

        <div style={{ background: gradient, padding: '1.35rem 1.5rem', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <X size={13}/>
          </button>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Reservar habitación</p>
          <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>N° {hab.numero} — {hab.tipo_label}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 5 }}>
            <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem' }}>{hab.sede_nombre}</span>
            <span style={{ background: '#F5922E', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '2px 10px', borderRadius: 9999 }}>S/ {hab.precio}/noche</span>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
            Necesitas una cuenta para continuar
          </p>
          <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.55, marginBottom: '1.4rem' }}>
            Para asegurar tu reserva y gestionar tu estadía necesitamos identificarte. Crear una cuenta es gratis y toma menos de un minuto.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <button onClick={() => navigate(`/register?next=${encoded}`)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #F5922E, #E07820)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              <UserPlus size={16}/> Crear cuenta gratis
            </button>
            <button onClick={() => navigate(`/login?next=${encoded}`)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '0.8rem', borderRadius: 12, border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
              <LogIn size={16}/> Ya tengo cuenta — Iniciar sesión
            </button>
          </div>
          <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: '0.7rem', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.82rem', cursor: 'pointer', padding: '0.3rem' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: fecha libre seleccionada ──────────────────────
function ModalFechaLibre({ hab, fecha, dest, onClose, navigate }) {
  if (!hab || !fecha) return null

  const d          = new Date(fecha + 'T12:00:00')
  const diaLabel   = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const gradient   = TIPO_GRADIENTS[hab.tipo] ?? TIPO_GRADIENTS.matrimonial

  function confirmar() {
    onClose()
    navigate(dest)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 400, boxShadow: '0 24px 60px rgba(0,0,0,0.22)', overflow: 'hidden' }}>

        {/* Cabecera verde */}
        <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', padding: '1.35rem 1.5rem', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <X size={13}/>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CalendarCheck size={20} color="white"/>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>¡Fecha disponible!</p>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '1rem', margin: '2px 0 0', textTransform: 'capitalize' }}>{diaLabel}</p>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '1.4rem 1.5rem' }}>

          {/* Info habitación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.75rem 1rem', background: '#F9FAFB', borderRadius: 12, marginBottom: '1.1rem', border: '1px solid #F3F4F6' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: gradient, flexShrink: 0 }}/>
            <div>
              <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.88rem', margin: 0 }}>Hab. N° {hab.numero} — {hab.tipo_label}</p>
              <p style={{ color: '#6B7280', fontSize: '0.78rem', margin: '2px 0 0' }}>{hab.sede_nombre} · <span style={{ fontWeight: 700, color: '#F5922E' }}>S/ {hab.precio}/noche</span></p>
            </div>
          </div>

          <p style={{ color: '#374151', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Esta habitación está <strong style={{ color: '#10B981' }}>disponible</strong> a partir de esa fecha.
            Continúa para elegir tus fechas de salida y confirmar la reserva.
          </p>

          <button onClick={confirmar}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
            <CalendarCheck size={16}/> Reservar desde esta fecha
          </button>
          <button onClick={onClose}
            style={{ display: 'block', width: '100%', marginTop: '0.6rem', padding: '0.65rem', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            Ver otras fechas
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta habitación ────────────────────────────────────
function HabCard({ hab, onReservar, onDateSelect }) {
  const gradient = hab.sede_imagen ? null : (TIPO_GRADIENTS[hab.tipo] ?? TIPO_GRADIENTS.matrimonial)

  return (
    <article
      style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 24px rgba(61,26,6,0.07)', background: 'white', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(61,26,6,0.14)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(61,26,6,0.07)' }}>

      {/* Imagen */}
      <div style={{ position: 'relative', height: 200, background: gradient ?? '#3D1A06', overflow: 'hidden', flexShrink: 0 }}>
        {hab.sede_imagen && (
          <img src={hab.sede_imagen} alt={hab.sede_nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none' }}/>
        )}
        {!hab.sede_imagen && (
          <div style={{ position: 'absolute', inset: 0, opacity: 0.2, background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,.5) 0%, transparent 60%)' }}/>
        )}
        <span style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '5px 12px', borderRadius: 9999 }}>
          {hab.tipo_label}
        </span>
        <div style={{ position: 'absolute', bottom: 14, right: 14, background: '#F5922E', color: 'white', borderRadius: 12, padding: '6px 14px', fontWeight: 800, fontSize: '0.9rem' }}>
          S/ {hab.precio}<span style={{ fontSize: '0.65rem', fontWeight: 400 }}>/noche</span>
        </div>
        <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.85)', fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 9999 }}>
          <MapPin size={11}/> {hab.sede_nombre}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '1.1rem 1.25rem 0.6rem' }}>
        <h3 style={{ fontWeight: 700, color: '#3D1A06', fontSize: '1rem', marginBottom: '0.2rem' }}>
          Habitación N° {hab.numero}
        </h3>
        {hab.descripcion && (
          <p style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.5rem' }}>
            {hab.descripcion}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#6B7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13}/> {hab.capacidad} pers.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><BedDouble size={13}/> Piso {hab.piso}</span>
          {hab.tiene_vista && <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Eye size={13}/> Vista</span>}
        </div>
      </div>

      {/* Calendario */}
      <MiniCal
        hab={hab}
        fechasOcupadas={hab.fechas_ocupadas ?? []}
        onDateSelect={onDateSelect}
      />

      {/* Botón principal */}
      <div style={{ padding: '0.6rem 1.25rem 1.25rem' }}>
        <button onClick={() => onReservar(hab)}
          style={{ width: '100%', padding: '0.7rem', background: 'linear-gradient(135deg, #F5922E, #E07820)', color: 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
          Reservar esta habitación
        </button>
      </div>
    </article>
  )
}

// ── Página principal ──────────────────────────────────────
export default function HabitacionesPublicas() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [habitaciones, setHabitaciones] = useState([])
  const [sedes, setSedes]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [modal, setModal]               = useState(null) // { type: 'auth'|'fecha', hab, dest, fecha? }
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

  const isCliente = isAuthenticated && user?.role === 'cliente'

  function handleReservar(hab) {
    const dest = `/reservas/nueva?hab=${hab.id}`
    if (isCliente) {
      navigate(dest)
    } else {
      setModal({ type: 'auth', hab, dest })
    }
  }

  function handleDateSelect(hab, fecha) {
    const dest = `/reservas/nueva?hab=${hab.id}&entrada=${fecha}`
    if (isCliente) {
      setModal({ type: 'fecha', hab, dest, fecha })
    } else {
      setModal({ type: 'auth', hab, dest })
    }
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })) }

  const inp = { border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.6rem 1rem', fontSize: '0.875rem', outline: 'none', background: 'white' }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6ED', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Modales globales */}
      {modal?.type === 'auth' && (
        <ModalAuth
          hab={modal.hab}
          dest={modal.dest}
          onClose={() => setModal(null)}
          navigate={navigate}
        />
      )}
      {modal?.type === 'fecha' && (
        <ModalFechaLibre
          hab={modal.hab}
          fecha={modal.fecha}
          dest={modal.dest}
          onClose={() => setModal(null)}
          navigate={navigate}
        />
      )}

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #3D1A06 0%, #7B4019 60%, #F5922E 100%)', padding: '0 0 3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            <img src="/images/Logo-hotel.jpeg" alt="Brisas de Mayo" style={{ height: 44, width: 'auto', objectFit: 'contain' }}/>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>Brisas de Mayo</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem' }}>Huancaya, Yauyos</p>
            </div>
          </a>
          <a href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1.1rem', borderRadius: 9999 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
            ← Volver al inicio
          </a>
        </div>
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
            <p style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>No hay habitaciones activas</p>
            <p style={{ fontSize: '0.875rem' }}>Intenta con otros filtros</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
            {habitaciones.map(h => (
              <HabCard
                key={h.id}
                hab={h}
                onReservar={handleReservar}
                onDateSelect={handleDateSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
