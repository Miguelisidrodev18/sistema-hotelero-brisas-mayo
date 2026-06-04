import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, BedDouble, MapPin, Eye, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { habitacionesApi } from '../../api/habitaciones'
import { sedesApi } from '../../api/sedes'
import { reservasApi } from '../../api/reservas'
import axiosClient from '../../api/axiosClient'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const TIPO_GRADIENTS = {
  matrimonial:           'linear-gradient(135deg, #7B4019 0%, #3D1A06 100%)',
  matrimonial_king:      'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  matrimonial_queen:     'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
  matrimonial_adicional: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
  doble:                 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
  triple:                'linear-gradient(135deg, #5b21b6 0%, #3b0764 100%)',
}

function HabCard({ hab, selectedList, onToggle }) {
  const idx       = selectedList.findIndex(h => h.id === hab.id)
  const isSelected = idx !== -1
  const imgSrc    = hab.imagen_principal ?? hab.sede_imagen
  const gradient  = imgSrc ? null : (TIPO_GRADIENTS[hab.tipo] ?? TIPO_GRADIENTS.matrimonial)

  return (
    <article
      onClick={() => onToggle(hab)}
      style={{
        borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
        border: `2px solid ${isSelected ? '#F5922E' : 'rgba(0,0,0,0.07)'}`,
        boxShadow: isSelected ? '0 0 0 4px rgba(245,146,46,0.15)' : '0 4px 18px rgba(61,26,6,0.07)',
        background: 'white', transition: 'all 0.2s',
        transform: isSelected ? 'translateY(-3px)' : 'none',
      }}
    >
      {/* Imagen */}
      <div style={{ position: 'relative', height: 160, background: gradient ?? '#3D1A06', overflow: 'hidden' }}>
        {imgSrc && (
          <img src={imgSrc} alt={hab.sede_nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => e.target.style.display = 'none'}/>
        )}
        {!gradient && <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle at 70% 30%, white 0%, transparent 60%)' }}/>}
        <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '4px 10px', borderRadius: 9999 }}>
          {hab.tipo_label}
        </span>
        <div style={{ position: 'absolute', bottom: 12, right: 12, background: '#F5922E', color: 'white', borderRadius: 10, padding: '5px 12px', fontWeight: 800, fontSize: '0.85rem' }}>
          S/ {hab.precio}<span style={{ fontSize: '0.6rem', fontWeight: 400 }}>/noche</span>
        </div>
        {isSelected && (
          <div style={{ position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: '50%', background: '#F5922E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.8rem' }}>
            {idx + 1}
          </div>
        )}
      </div>

      <div style={{ padding: '1rem' }}>
        <p style={{ fontWeight: 700, color: '#3D1A06', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Habitación N° {hab.numero}</p>
        <div style={{ display: 'flex', gap: '0.85rem', fontSize: '0.75rem', color: '#6B7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11}/> {hab.sede_nombre}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11}/> {hab.capacidad} pers.</span>
          {hab.tiene_vista && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={11}/> Vista</span>}
        </div>
      </div>
    </article>
  )
}

const MESES_CAL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DIAS_CAL  = ['D','L','M','M','J','V','S']

function CalendarioReserva({ fechasOcupadas = [], entrada, salida, today, onSelect }) {
  const refBase = entrada ? new Date(entrada + 'T12:00:00') : new Date()
  const [base, setBase] = useState({ y: refBase.getFullYear(), m: refBase.getMonth() })
  const [hovered, setHovered] = useState(null)

  const ocupados = useMemo(() => {
    const s = new Set()
    fechasOcupadas.forEach(({ entrada: e, salida: sa }) => {
      const d = new Date(e + 'T12:00:00'), fin = new Date(sa + 'T12:00:00')
      while (d < fin) { s.add(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1) }
    })
    return s
  }, [fechasOcupadas])

  const pad = n => String(n).padStart(2, '0')
  const { y, m } = base
  const primerDia = new Date(y, m, 1).getDay()
  const diasEnMes = new Date(y, m + 1, 0).getDate()
  const todayStr  = today

  // range preview: when picking salida, show from entrada to hovered
  const rangeEnd = salida || (entrada && hovered && hovered > entrada ? hovered : null)

  function hasOcupadoInRange(start, end) {
    const d = new Date(start + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const fin = new Date(end + 'T12:00:00')
    while (d < fin) {
      if (ocupados.has(d.toISOString().split('T')[0])) return true
      d.setDate(d.getDate() + 1)
    }
    return false
  }

  function handleClick(dateStr) {
    if (ocupados.has(dateStr) || dateStr < todayStr) return
    if (!entrada || (entrada && salida)) {
      // start fresh selection
      onSelect(dateStr, '')
    } else {
      // picking salida
      if (dateStr <= entrada) { onSelect(dateStr, ''); return }
      if (hasOcupadoInRange(entrada, dateStr)) {
        // range blocked — reset and start new entrada from this date
        onSelect(dateStr, ''); return
      }
      onSelect(entrada, dateStr)
    }
  }

  function navMonth(dir) {
    setBase(b => {
      const d = new Date(b.y, b.m + dir, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  const picking = !entrada ? 'entrada' : (!salida ? 'salida' : 'done')

  return (
    <div>
      {/* Instrucción dinámica */}
      <div style={{ marginBottom: '0.85rem', padding: '0.6rem 0.9rem', borderRadius: 10, background: picking === 'done' ? '#F0FDF4' : '#FFF7ED', border: `1px solid ${picking === 'done' ? '#BBF7D0' : '#FED7AA'}` }}>
        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: picking === 'done' ? '#166534' : '#92400E' }}>
          {picking === 'entrada' && '📅 Selecciona la fecha de entrada'}
          {picking === 'salida'  && '📅 Ahora selecciona la fecha de salida'}
          {picking === 'done'    && `✅ ${new Date(entrada + 'T12:00:00').toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'short' })} → ${new Date(salida + 'T12:00:00').toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'short' })}`}
        </p>
      </div>

      {/* Navegación */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <button onClick={() => navMonth(-1)} style={{ background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
          <ChevronLeft size={16}/>
        </button>
        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#111827' }}>
          {MESES_CAL[m]} {y}
        </span>
        <button onClick={() => navMonth(1)} style={{ background: 'none', border: '1.5px solid #E5E7EB', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280' }}>
          <ChevronRight size={16}/>
        </button>
      </div>

      {/* Grilla */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {/* Cabecera días */}
        {DIAS_CAL.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: i === 0 || i === 6 ? '#F5922E' : '#9CA3AF', paddingBottom: 5 }}>{d}</div>
        ))}

        {/* Celdas vacías */}
        {Array.from({ length: primerDia }, (_, i) => <div key={`v-${i}`}/>)}

        {/* Días */}
        {Array.from({ length: diasEnMes }, (_, i) => {
          const dia     = i + 1
          const ds      = `${y}-${pad(m + 1)}-${pad(dia)}`
          const isOcup  = ocupados.has(ds)
          const isPast  = ds < todayStr
          const isHoy   = ds === todayStr
          const isEnt   = ds === entrada
          const isSal   = ds === salida
          const inRange = rangeEnd && entrada && ds > entrada && ds < rangeEnd && !isOcup
          const blockPreview = entrada && !salida && hovered && hovered > entrada
            && ds > entrada && ds < hovered && ocupados.has(ds)
          const isHov   = hovered === ds && !isOcup && !isPast

          let bg = 'transparent', color = '#374151', fw = 400
          let cursor = 'pointer', border = 'none', scale = 'scale(1)'
          let boxShadow = 'none'

          if (isOcup || isPast)    { color = isOcup ? 'white' : '#D1D5DB'; bg = isOcup ? '#EF4444' : 'transparent'; cursor = 'not-allowed' }
          if (isOcup)              { boxShadow = '0 2px 6px rgba(239,68,68,0.3)' }
          if (isEnt || isSal)      { bg = '#F5922E'; color = 'white'; fw = 800; boxShadow = '0 3px 8px rgba(245,146,46,0.4)'; scale = 'scale(1.1)' }
          if (inRange)             { bg = '#FFF0DE'; color = '#92400E' }
          if (blockPreview)        { bg = '#FECACA'; color = '#DC2626'; cursor = 'not-allowed' }
          if (isHov && !isEnt && !isSal) { bg = '#FED7AA'; color = '#92400E'; fw = 600; scale = 'scale(1.08)' }
          if (isHoy && !isEnt && !isSal) { border = '2px solid #F5922E' }

          return (
            <div key={dia} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5px 0' }}>
              <div
                onMouseEnter={() => !isOcup && !isPast && setHovered(ds)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleClick(ds)}
                title={isOcup ? 'Fecha ocupada' : isPast ? '' : picking === 'salida' ? 'Fecha de salida' : 'Fecha de entrada'}
                style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color, fontWeight: fw, cursor, fontSize: '0.78rem', border, boxShadow, transform: scale, transition: 'all 0.12s', userSelect: 'none' }}>
                {dia}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        {[
          { color: '#EF4444', label: 'Ocupado' },
          { color: '#F5922E', label: 'Seleccionado' },
          { color: '#FFF0DE', border: '1px solid #FED7AA', label: 'Rango' },
        ].map(({ color, border: b, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: '#9CA3AF' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, border: b, display: 'inline-block', flexShrink: 0 }}/>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

function StepIndicator({ step }) {
  const steps = [{ n: 1, label: 'Elige habitación' }, { n: 2, label: 'Fechas' }, { n: 3, label: 'Pago' }]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
      {steps.map(({ n, label }, i) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, background: step >= n ? '#F5922E' : '#E5E7EB', color: step >= n ? 'white' : '#9CA3AF' }}>{n}</div>
            <span style={{ fontSize: '0.78rem', fontWeight: step === n ? 700 : 400, color: step === n ? '#F5922E' : step > n ? '#374151' : '#9CA3AF' }}>{label}</span>
          </div>
          {i < steps.length - 1 && <div style={{ width: 32, height: 2, background: step > n ? '#F5922E' : '#E5E7EB', borderRadius: 9999 }}/>}
        </div>
      ))}
    </div>
  )
}

export default function ReservarHabitacion() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preHabId    = searchParams.get('hab')     ? Number(searchParams.get('hab')) : null
  const preEntrada  = searchParams.get('entrada') ?? ''
  const { isMobile } = useBreakpoint()

  const [step, setStep]               = useState(preHabId ? 2 : 1)
  const [habitaciones, setHabitaciones] = useState([])
  const [sedes, setSedes]             = useState([])
  const [selected, setSelected]       = useState([]) // array para multi-selección
  const [filtroSede, setFiltroSede]   = useState('')
  const [filtroPiso, setFiltroPiso]   = useState(null) // null = todos
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ fecha_entrada: preEntrada, fecha_salida: '', num_huespedes: 1 })
  const [huespedes, setHuespedes] = useState([{ nombre: '', dni: '' }])
  const [mostrarHuespedes, setMostrarHuespedes] = useState(false)

  // Cargar habitaciones disponibles
  useEffect(() => {
    setFiltroPiso(null) // resetear piso al cambiar sede
    const params = filtroSede ? { sede: filtroSede } : {}
    habitacionesApi.getDisponibles(params)
      .then(r => {
        // ordenar por piso → numero
        const sorted = [...r.data].sort((a, b) => a.piso - b.piso || a.numero - b.numero)
        setHabitaciones(sorted)
        if (preHabId) {
          const hab = sorted.find(h => h.id === preHabId)
          if (hab) setSelected([hab])
        }
      })
      .finally(() => setLoading(false))
  }, [filtroSede])

  useEffect(() => {
    sedesApi.getPublicas().then(r => setSedes(r.data))
  }, [])

  const noches = form.fecha_entrada && form.fecha_salida
    ? Math.ceil((new Date(form.fecha_salida) - new Date(form.fecha_entrada)) / 86400000)
    : 0
  const total = selected.reduce((acc, h) => acc + h.precio * noches, 0)

  function handleToggleHab(hab) {
    setSelected(prev => {
      const exists = prev.find(h => h.id === hab.id)
      return exists ? prev.filter(h => h.id !== hab.id) : [...prev, hab]
    })
  }

  async function handleConfirmar() {
    if (selected.length === 0 || !form.fecha_entrada || !form.fecha_salida || noches < 1) return
    setSaving(true); setError('')
    try {
      const payload = {
        fecha_entrada: form.fecha_entrada,
        fecha_salida:  form.fecha_salida,
        num_huespedes: form.num_huespedes,
      }
      if (selected.length === 1) {
        payload.habitacion_id = selected[0].id
      } else {
        payload.habitaciones = selected.map(h => h.id)
      }
      const { data } = await reservasApi.create(payload)
      // Respuesta puede ser objeto simple (1 hab) o { reservas: [...] } (múltiples)
      const primeraId = data.reservas ? data.reservas[0].id : data.id
      // Guardar huéspedes si hay al menos uno con nombre (fire-and-forget)
      const huespedesValidos = huespedes.filter(h => h.nombre.trim())
      if (huespedesValidos.length > 0) {
        axiosClient.post(`/reservas/${primeraId}/huespedes`, { huespedes: huespedesValidos }).catch(() => {})
      }
      navigate(`/reservas/pago/${primeraId}`)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al crear la reserva. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-pad" style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <button onClick={() => step === 2 && !preHabId ? setStep(1) : navigate('/reservas')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.875rem', padding: '0.4rem 0' }}>
          <ArrowLeft size={16}/> {step === 2 && !preHabId ? `Cambiar habitación${selected.length > 1 ? 'es' : ''}` : 'Volver a mis reservas'}
        </button>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111', marginBottom: '0.25rem' }}>Nueva reserva</h1>
      <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>Selecciona tu habitación y las fechas de estadía</p>

      <StepIndicator step={step}/>

      {/* ── PASO 1: Elegir habitación ── */}
      {step === 1 && (() => {
        // pisos únicos disponibles (ya ordenados porque habitaciones está sorted)
        const pisos = [...new Set(habitaciones.map(h => h.piso))].sort((a, b) => a - b)
        const habFiltradas = filtroPiso !== null
          ? habitaciones.filter(h => h.piso === filtroPiso)
          : habitaciones

        // agrupar por piso para mostrar separadores
        const grupos = pisos
          .filter(p => filtroPiso === null || p === filtroPiso)
          .map(p => ({ piso: p, habs: habFiltradas.filter(h => h.piso === p) }))
          .filter(g => g.habs.length > 0)

        const chipSede = { padding: '6px 16px', borderRadius: 9999, border: '1.5px solid', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }

        return (
          <div>
            {/* Chips sede */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>Sede</span>
              <button onClick={() => setFiltroSede('')}
                style={{ ...chipSede, borderColor: !filtroSede ? '#F5922E' : '#E5E7EB', background: !filtroSede ? '#FFF7ED' : 'white', color: !filtroSede ? '#F5922E' : '#6B7280' }}>
                Todas
              </button>
              {sedes.map(s => (
                <button key={s.id} onClick={() => setFiltroSede(s.slug)}
                  style={{ ...chipSede, borderColor: filtroSede === s.slug ? '#F5922E' : '#E5E7EB', background: filtroSede === s.slug ? '#FFF7ED' : 'white', color: filtroSede === s.slug ? '#F5922E' : '#6B7280' }}>
                  {s.nombre}
                </button>
              ))}
            </div>

            {/* Chips piso */}
            {!loading && pisos.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: 2 }}>Piso</span>
                <button onClick={() => setFiltroPiso(null)}
                  style={{ ...chipSede, borderColor: filtroPiso === null ? '#3D1A06' : '#E5E7EB', background: filtroPiso === null ? '#3D1A06' : 'white', color: filtroPiso === null ? 'white' : '#6B7280' }}>
                  Todos
                </button>
                {pisos.map(p => (
                  <button key={p} onClick={() => setFiltroPiso(p === filtroPiso ? null : p)}
                    style={{ ...chipSede, borderColor: filtroPiso === p ? '#3D1A06' : '#E5E7EB', background: filtroPiso === p ? '#3D1A06' : 'white', color: filtroPiso === p ? 'white' : '#6B7280', minWidth: 72 }}>
                    🏢 Piso {p}
                  </button>
                ))}
              </div>
            )}
            {!loading && pisos.length === 1 && (
              <div style={{ marginBottom: '1.25rem' }}/>
            )}

            {loading ? (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '3rem' }}>Cargando habitaciones...</p>
            ) : habFiltradas.length === 0 ? (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '3rem' }}>No hay habitaciones disponibles.</p>
            ) : (
              <div>
                {grupos.map(({ piso, habs }) => (
                  <div key={piso} style={{ marginBottom: '2rem' }}>
                    {/* Separador de piso */}
                    {pisos.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ background: '#3D1A06', color: 'white', fontSize: '0.72rem', fontWeight: 800, padding: '4px 14px', borderRadius: 9999, letterSpacing: '0.05em', flexShrink: 0 }}>
                          Piso {piso}
                        </div>
                        <div style={{ flex: 1, height: 1, background: '#F3F4F6' }}/>
                        <span style={{ fontSize: '0.72rem', color: '#9CA3AF', flexShrink: 0 }}>
                          {habs.length} hab{habs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                      {habs.map(h => (
                        <HabCard key={h.id} hab={h} selectedList={selected} onToggle={handleToggleHab}/>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Barra de selección flotante cuando hay habitaciones elegidas */}
            {selected.length > 0 && (
              <div style={{ position: 'sticky', bottom: 16, marginTop: '1.5rem', background: '#3D1A06', borderRadius: 16, padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 8px 30px rgba(61,26,6,0.3)', gap: '1rem' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem', margin: 0 }}>
                    {selected.length} habitación{selected.length > 1 ? 'es' : ''} seleccionada{selected.length > 1 ? 's' : ''}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', margin: '2px 0 0' }}>
                    {selected.map(h => `N° ${h.numero}`).join(' · ')}
                  </p>
                </div>
                <button onClick={() => setStep(2)}
                  style={{ flexShrink: 0, padding: '0.65rem 1.35rem', borderRadius: 12, border: 'none', background: '#F5922E', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Continuar →
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* ── PASO 2: Fechas y confirmación ── */}
      {step === 2 && selected.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1.25rem' : '2rem' }}>

          {/* Lista de habitaciones seleccionadas */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '0.75rem' }}>
              {selected.length > 1 ? `${selected.length} habitaciones seleccionadas` : 'Habitación seleccionada'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selected.map((hab, i) => {
                const imgSrc = hab.imagen_principal ?? hab.sede_imagen
                const grad   = imgSrc ? null : (TIPO_GRADIENTS[hab.tipo] ?? TIPO_GRADIENTS.matrimonial)
                return (
                  <div key={hab.id} style={{ borderRadius: 18, overflow: 'hidden', border: '2px solid #F5922E', boxShadow: '0 0 0 3px rgba(245,146,46,0.1)' }}>
                    <div style={{ height: selected.length > 1 ? 100 : 200, background: imgSrc ? '#3D1A06' : grad, position: 'relative', overflow: 'hidden' }}>
                      {imgSrc && <img src={imgSrc} alt={hab.sede_nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'}/>}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)' }}/>
                      {selected.length > 1 && (
                        <div style={{ position: 'absolute', top: 8, left: 8, background: '#F5922E', color: 'white', fontWeight: 800, fontSize: '0.7rem', borderRadius: 9999, padding: '2px 8px' }}>
                          #{i + 1}
                        </div>
                      )}
                      <div style={{ position: 'absolute', bottom: 10, left: 14 }}>
                        <p style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>Habitación N° {hab.numero}</p>
                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem', margin: 0 }}>{hab.tipo_label} · {hab.sede_nombre}</p>
                      </div>
                      <div style={{ position: 'absolute', bottom: 10, right: 14, background: '#F5922E', color: 'white', borderRadius: 9999, padding: '3px 10px', fontWeight: 800, fontSize: '0.8rem' }}>
                        S/ {hab.precio}/noche
                      </div>
                    </div>
                    {selected.length === 1 && (
                      <div style={{ padding: '1rem', background: 'white' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <Row icon={<MapPin size={14}/>} label="Sede" value={hab.sede_nombre}/>
                          <Row icon={<Users size={14}/>} label="Capacidad" value={`${hab.capacidad} personas`}/>
                          <Row icon={<BedDouble size={14}/>} label="Piso" value={`Piso ${hab.piso}`}/>
                          {hab.tiene_vista && <Row icon={<Eye size={14}/>} label="Vista" value="Incluida"/>}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Formulario de fechas */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '0.75rem' }}>Datos de la estadía</p>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              {/* Calendario — usa fechas_ocupadas de la primera hab seleccionada como referencia */}
              <CalendarioReserva
                fechasOcupadas={selected[0]?.fechas_ocupadas ?? []}
                entrada={form.fecha_entrada}
                salida={form.fecha_salida}
                today={today}
                onSelect={(e, s) => setForm(f => ({ ...f, fecha_entrada: e, fecha_salida: s }))}
              />

              <div>
                <label style={lbl}><Users size={13}/> N° de huéspedes *</label>
                <input type="number" min={1} max={selected.reduce((a, h) => a + h.capacidad, 0)} value={form.num_huespedes}
                  onChange={e => setForm(f => ({ ...f, num_huespedes: +e.target.value }))}
                  style={inp}/>
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                  Capacidad total: {selected.reduce((a, h) => a + h.capacidad, 0)} personas
                </p>
              </div>

              {/* Huéspedes (opcional) */}
              <div>
                <button
                  type="button"
                  onClick={() => setMostrarHuespedes(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px dashed #D1D5DB', borderRadius: 9, padding: '0.5rem 0.85rem', fontSize: '0.78rem', fontWeight: 600, color: '#6B7280', cursor: 'pointer', width: '100%' }}>
                  <Users size={13}/>
                  {mostrarHuespedes ? '▲ Ocultar datos de huéspedes' : '+ Agregar datos de huéspedes (opcional)'}
                </button>
                {mostrarHuespedes && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: 0 }}>Se usarán para registrar en recepción. Puedes completarlos después.</p>
                    {Array.from({ length: form.num_huespedes }, (_, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                          <input
                            placeholder={`Huésped ${i + 1} — Nombre`}
                            value={huespedes[i]?.nombre ?? ''}
                            onChange={e => setHuespedes(prev => {
                              const next = [...prev]
                              next[i] = { ...next[i] ?? {}, nombre: e.target.value }
                              return next
                            })}
                            style={{ ...inp, fontSize: '0.78rem', padding: '0.55rem 0.7rem' }}
                          />
                          <input
                            placeholder="DNI (opcional)"
                            value={huespedes[i]?.dni ?? ''}
                            onChange={e => setHuespedes(prev => {
                              const next = [...prev]
                              next[i] = { ...next[i] ?? {}, dni: e.target.value }
                              return next
                            })}
                            style={{ ...inp, fontSize: '0.78rem', padding: '0.55rem 0.7rem' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumen de precio */}
              {noches > 0 && (
                <div style={{ background: '#FFF7ED', border: '1px solid rgba(245,146,46,0.3)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400E', marginBottom: '0.6rem' }}>Resumen</p>
                  {selected.map(h => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.3rem' }}>
                      <span>Hab. {h.numero} × {noches} noche{noches > 1 ? 's' : ''}</span>
                      <span>S/ {h.precio * noches}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#3D1A06', paddingTop: '0.5rem', borderTop: '1px solid rgba(245,146,46,0.2)' }}>
                    <span>Total</span>
                    <span style={{ color: '#F5922E' }}>S/ {total}</span>
                  </div>
                </div>
              )}

              {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleConfirmar}
                disabled={saving || noches < 1}
                style={{ width: '100%', padding: '0.9rem', background: noches < 1 ? '#E5E7EB' : 'linear-gradient(135deg, #F5922E, #E07820)', color: noches < 1 ? '#9CA3AF' : 'white', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: noches < 1 ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Procesando...' : noches < 1 ? 'Selecciona las fechas' : `Continuar al pago — S/ ${total}`}
              </button>

              <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center' }}>
                El siguiente paso es confirmar el método de pago.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl = { display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.35rem' }
const inp = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.7rem 0.9rem', fontSize: '0.875rem', outline: 'none', background: 'white' }

function Row({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6B7280' }}>{icon} {label}</span>
      <span style={{ fontWeight: 600, color: '#111' }}>{value}</span>
    </div>
  )
}
