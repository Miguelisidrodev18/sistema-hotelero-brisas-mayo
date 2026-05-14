import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users, BedDouble, MapPin, Eye, ArrowLeft, Calendar } from 'lucide-react'
import { habitacionesApi } from '../../api/habitaciones'
import { sedesApi } from '../../api/sedes'
import { reservasApi } from '../../api/reservas'

const TIPO_GRADIENTS = {
  matrimonial:           'linear-gradient(135deg, #7B4019 0%, #3D1A06 100%)',
  matrimonial_king:      'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  matrimonial_queen:     'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
  matrimonial_adicional: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
  doble:                 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
  triple:                'linear-gradient(135deg, #5b21b6 0%, #3b0764 100%)',
}

function HabCard({ hab, selected, onSelect }) {
  const gradient = hab.sede_imagen ? null : (TIPO_GRADIENTS[hab.tipo] ?? TIPO_GRADIENTS.matrimonial)
  const isSelected = selected?.id === hab.id

  return (
    <article
      onClick={() => onSelect(hab)}
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
        {hab.sede_imagen && (
          <img src={hab.sede_imagen} alt={hab.sede_nombre}
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
          <div style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: '#F5922E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '1rem' }}>
            ✓
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
  const preHabId = searchParams.get('hab') ? Number(searchParams.get('hab')) : null

  const [step, setStep]               = useState(preHabId ? 2 : 1)
  const [habitaciones, setHabitaciones] = useState([])
  const [sedes, setSedes]             = useState([])
  const [selected, setSelected]       = useState(null)
  const [filtroSede, setFiltroSede]   = useState('')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ fecha_entrada: '', fecha_salida: '', num_huespedes: 1 })

  // Cargar habitaciones disponibles
  useEffect(() => {
    const params = filtroSede ? { sede: filtroSede } : {}
    habitacionesApi.getDisponibles(params)
      .then(r => {
        setHabitaciones(r.data)
        if (preHabId) {
          const hab = r.data.find(h => h.id === preHabId)
          if (hab) setSelected(hab)
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
  const total = selected ? selected.precio * noches : 0

  async function handleConfirmar() {
    if (!selected || !form.fecha_entrada || !form.fecha_salida || noches < 1) return
    setSaving(true); setError('')
    try {
      const { data } = await reservasApi.create({
        habitacion_id:  selected.id,
        fecha_entrada:  form.fecha_entrada,
        fecha_salida:   form.fecha_salida,
        num_huespedes:  form.num_huespedes,
      })
      navigate(`/reservas/pago/${data.id}`)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al crear la reserva. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
        <button onClick={() => step === 2 && !preHabId ? setStep(1) : navigate('/reservas')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.875rem', padding: '0.4rem 0' }}>
          <ArrowLeft size={16}/> {step === 2 && !preHabId ? 'Cambiar habitación' : 'Volver a mis reservas'}
        </button>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111', marginBottom: '0.25rem' }}>Nueva reserva</h1>
      <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>Selecciona tu habitación y las fechas de estadía</p>

      <StepIndicator step={step}/>

      {/* ── PASO 1: Elegir habitación ── */}
      {step === 1 && (
        <div>
          {/* Filtro sede */}
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setFiltroSede('')}
              style={{ padding: '6px 16px', borderRadius: 9999, border: '1.5px solid', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', borderColor: !filtroSede ? '#F5922E' : '#E5E7EB', background: !filtroSede ? '#FFF7ED' : 'white', color: !filtroSede ? '#F5922E' : '#6B7280' }}>
              Todas
            </button>
            {sedes.map(s => (
              <button key={s.id} onClick={() => setFiltroSede(s.slug)}
                style={{ padding: '6px 16px', borderRadius: 9999, border: '1.5px solid', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', borderColor: filtroSede === s.slug ? '#F5922E' : '#E5E7EB', background: filtroSede === s.slug ? '#FFF7ED' : 'white', color: filtroSede === s.slug ? '#F5922E' : '#6B7280' }}>
                {s.nombre}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '3rem' }}>Cargando habitaciones...</p>
          ) : habitaciones.length === 0 ? (
            <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '3rem' }}>No hay habitaciones disponibles.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {habitaciones.map(h => (
                <HabCard key={h.id} hab={h} selected={selected} onSelect={hab => { setSelected(hab); setStep(2) }}/>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PASO 2: Fechas y confirmación ── */}
      {step === 2 && selected && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

          {/* Card habitación seleccionada */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '0.75rem' }}>Habitación seleccionada</p>
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '2px solid #F5922E', boxShadow: '0 0 0 4px rgba(245,146,46,0.12)' }}>
              <div style={{ height: 200, background: selected.sede_imagen ? '#3D1A06' : (TIPO_GRADIENTS[selected.tipo] ?? TIPO_GRADIENTS.matrimonial), position: 'relative', overflow: 'hidden' }}>
                {selected.sede_imagen && <img src={selected.sede_imagen} alt={selected.sede_nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'}/>}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }}/>
                <div style={{ position: 'absolute', bottom: 16, left: 16 }}>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.2rem' }}>Habitación N° {selected.numero}</p>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>{selected.tipo_label}</p>
                </div>
              </div>
              <div style={{ padding: '1.25rem', background: 'white' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <Row icon={<MapPin size={14}/>} label="Sede" value={selected.sede_nombre}/>
                  <Row icon={<Users size={14}/>} label="Capacidad" value={`${selected.capacidad} personas`}/>
                  <Row icon={<BedDouble size={14}/>} label="Piso" value={`Piso ${selected.piso}`}/>
                  {selected.tiene_vista && <Row icon={<Eye size={14}/>} label="Vista" value="Incluida"/>}
                </div>
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Precio por noche</span>
                  <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#F5922E' }}>S/ {selected.precio}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario de fechas */}
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '0.75rem' }}>Datos de la estadía</p>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}><Calendar size={13}/> Fecha de entrada *</label>
                  <input type="date" min={today} value={form.fecha_entrada}
                    onChange={e => setForm(f => ({ ...f, fecha_entrada: e.target.value, fecha_salida: '' }))}
                    style={inp}/>
                </div>
                <div>
                  <label style={lbl}><Calendar size={13}/> Fecha de salida *</label>
                  <input type="date" min={form.fecha_entrada || today} value={form.fecha_salida}
                    onChange={e => setForm(f => ({ ...f, fecha_salida: e.target.value }))}
                    style={inp} disabled={!form.fecha_entrada}/>
                </div>
              </div>

              <div>
                <label style={lbl}><Users size={13}/> N° de huéspedes *</label>
                <input type="number" min={1} max={selected.capacidad} value={form.num_huespedes}
                  onChange={e => setForm(f => ({ ...f, num_huespedes: +e.target.value }))}
                  style={inp}/>
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.25rem' }}>Máximo {selected.capacidad} personas</p>
              </div>

              {/* Resumen de precio */}
              {noches > 0 && (
                <div style={{ background: '#FFF7ED', border: '1px solid rgba(245,146,46,0.3)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400E', marginBottom: '0.6rem' }}>Resumen</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6B7280', marginBottom: '0.35rem' }}>
                    <span>S/ {selected.precio} × {noches} noche{noches > 1 ? 's' : ''}</span>
                    <span>S/ {selected.precio * noches}</span>
                  </div>
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
