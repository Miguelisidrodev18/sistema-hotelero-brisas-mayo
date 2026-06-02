import { useState, useEffect } from 'react'
import { Car, Plus, X, Calendar, CheckCircle, Bike, Accessibility, ChevronRight, ChevronLeft, BedDouble } from 'lucide-react'
import { cocherasApi } from '../../api/cocheras'
import { reservasApi } from '../../api/reservas'

const TIPO_META = {
  auto:          { label: 'Auto',          icon: Car,           color: '#1D4ED8', bg: '#EFF6FF' },
  moto:          { label: 'Moto',          icon: Bike,          color: '#7C3AED', bg: '#F5F3FF' },
  discapacitado: { label: 'Discapacitado', icon: Accessibility, color: '#0F766E', bg: '#F0FDFA' },
}

const ESTADO_META = {
  pendiente:  { label: 'Pendiente',  color: '#D97706', bg: '#FEF3C7' },
  confirmada: { label: 'Confirmada', color: '#2563EB', bg: '#DBEAFE' },
  activa:     { label: 'En uso',     color: '#16A34A', bg: '#DCFCE7' },
  finalizada: { label: 'Finalizada', color: '#374151', bg: '#F3F4F6' },
  cancelada:  { label: 'Cancelada',  color: '#DC2626', bg: '#FEE2E2' },
}

function EstadoBadge({ estado }) {
  const m = ESTADO_META[estado] ?? { label: estado, color: '#6B7280', bg: '#F3F4F6' }
  return <span style={{ background: m.bg, color: m.color, fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>{m.label}</span>
}

function fDateShort(d) {
  if (!d) return '—'
  const s = typeof d === 'string' ? d.split('T')[0] : d
  return new Date(s + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function ModalReservar({ disponibles, reservasHotel, onClose, onSave }) {
  // paso inicial calculado directamente desde los datos ya cargados
  const [paso, setPaso]             = useState(() =>
    reservasHotel.length > 1 ? 'reserva' : 'espacio'
  )
  const [reservaLink, setReservaLink] = useState(() =>
    reservasHotel.length === 1 ? reservasHotel[0] : null
  )
  const [sel, setSel]               = useState(null)
  const [placa, setPlaca]           = useState('')
  const [fechaM, setFechaM]         = useState({ entrada: '', salida: '' }) // manual si no hay reserva
  const [filtroTipo, setFiltroTipo] = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const today = new Date().toISOString().split('T')[0]


  // Fechas: desde reserva vinculada o manual
  const fechaEntrada = reservaLink
    ? (reservaLink.fecha_entrada?.split?.('T')[0] ?? reservaLink.fecha_entrada)
    : fechaM.entrada
  const fechaSalida  = reservaLink
    ? (reservaLink.fecha_salida?.split?.('T')[0]  ?? reservaLink.fecha_salida)
    : fechaM.salida

  const noches = fechaEntrada && fechaSalida
    ? Math.ceil((new Date(fechaSalida) - new Date(fechaEntrada)) / 86400000) : 0
  const total = sel ? Number(sel.precio_noche) * noches : 0

  // Filtrar cocheras por sede si hay reserva vinculada
  const dispBase = reservaLink
    ? disponibles.filter(c => c.sede_id === reservaLink.sede_id)
    : disponibles
  const dispLista = filtroTipo ? dispBase.filter(c => c.tipo === filtroTipo) : dispBase

  async function confirmar() {
    if (!sel || noches < 1) return
    setSaving(true); setError('')
    try {
      await cocherasApi.reservar({
        cochera_id:    sel.id,
        fecha_entrada: fechaEntrada,
        fecha_salida:  fechaSalida,
        placa:         placa.trim() || undefined,
        reserva_id:    reservaLink?.id || undefined,
      })
      onSave()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al reservar. Intenta de nuevo.')
    } finally { setSaving(false) }
  }

  const inp = { border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.65rem 0.9rem', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>

        {/* Header sticky */}
        <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1, borderBottom: '1px solid #F3F4F6', padding: '1.1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {paso !== 'reserva' && reservasHotel.length > 1 && (
              <button onClick={() => { setPaso(paso === 'confirmar' ? 'espacio' : 'reserva'); if (paso === 'espacio') { setSel(null); setReservaLink(null) } }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={18}/>
              </button>
            )}
            {paso === 'espacio' && sel && (
              <button onClick={() => setSel(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={18}/>
              </button>
            )}
            <h2 style={{ fontWeight: 800, fontSize: '0.98rem', color: '#111827', margin: 0 }}>
              {paso === 'reserva' ? '¿Tienes reserva de habitación?' :
               paso === 'espacio' ? 'Elige tu espacio' : 'Confirmar cochera'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18}/></button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>

          {/* ── PASO RESERVA ── */}
          {paso === 'reserva' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: '1rem', lineHeight: 1.55 }}>
                Selecciona tu reserva de habitación y las fechas se llenarán automáticamente.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                {reservasHotel.map(r => {
                  const sel = reservaLink?.id === r.id
                  const noches = Math.ceil((new Date(r.fecha_salida) - new Date(r.fecha_entrada)) / 86400000)
                  return (
                    <button key={r.id}
                      onClick={() => { setReservaLink(r); setPaso('espacio') }}
                      style={{ textAlign: 'left', padding: '0.9rem 1rem', borderRadius: 14, border: `2px solid ${sel ? '#F5922E' : '#E5E7EB'}`, background: sel ? '#FFF7ED' : 'white', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BedDouble size={18} style={{ color: '#F5922E' }}/>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: '#3D1A06' }}>{r.codigo}</span>
                          <span style={{ fontSize: '0.68rem', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
                            {r.estado === 'confirmada' ? 'Confirmada' : r.estado === 'checkin' ? 'En hotel' : 'Pendiente'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: '#374151', margin: '2px 0 0', fontWeight: 600 }}>
                          Hab. {r.habitacion?.numero} — {r.sede?.nombre}
                        </p>
                        <p style={{ fontSize: '0.73rem', color: '#9CA3AF', margin: '1px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={10}/> {fDateShort(r.fecha_entrada)} → {fDateShort(r.fecha_salida)} · {noches} noche{noches !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ChevronRight size={16} style={{ color: '#9CA3AF', flexShrink: 0 }}/>
                    </button>
                  )
                })}
              </div>
              <button onClick={() => { setReservaLink(null); setPaso('espacio') }}
                style={{ width: '100%', padding: '0.7rem', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', color: '#9CA3AF', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                Continuar sin vincular reserva →
              </button>
            </div>
          )}

          {/* ── PASO ESPACIO ── */}
          {paso === 'espacio' && !sel && (
            <div>
              {/* Badge reserva vinculada */}
              {reservaLink && (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '0.65rem 0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BedDouble size={14} style={{ color: '#2563EB', flexShrink: 0 }}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1E40AF' }}>{reservaLink.codigo}</span>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', marginLeft: 6 }}>
                      {fDateShort(reservaLink.fecha_entrada)} → {fDateShort(reservaLink.fecha_salida)}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>Fechas auto-llenadas ✓</span>
                </div>
              )}

              {/* Filtros tipo */}
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                {['', 'auto', 'moto', 'discapacitado'].map(t => (
                  <button key={t} onClick={() => setFiltroTipo(t)}
                    style={{ padding: '4px 12px', borderRadius: 9999, border: '1.5px solid', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', borderColor: filtroTipo === t ? '#F5922E' : '#E5E7EB', background: filtroTipo === t ? '#FFF7ED' : 'white', color: filtroTipo === t ? '#F5922E' : '#6B7280' }}>
                    {t === '' ? 'Todos' : TIPO_META[t]?.label}
                  </button>
                ))}
              </div>

              {dispLista.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#FEF2F2', borderRadius: 12, border: '1px solid #FCA5A5' }}>
                  <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>🚫</p>
                  <p style={{ fontWeight: 700, color: '#DC2626', fontSize: '0.9rem', margin: 0 }}>
                    {reservaLink ? 'Sin espacios disponibles en esa sede' : 'No hay espacios disponibles'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.6rem' }}>
                  {dispLista.map(c => {
                    const m = TIPO_META[c.tipo] ?? TIPO_META.auto
                    const Icon = m.icon
                    return (
                      <div key={c.id} onClick={() => { setSel(c); setPaso('confirmar') }}
                        style={{ border: '2px solid #E5E7EB', borderRadius: 14, padding: '0.85rem 0.6rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#F5922E'; e.currentTarget.style.background = '#FFF7ED' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                          <Icon size={16} style={{ color: m.color }}/>
                        </div>
                        <p style={{ fontWeight: 800, color: '#111827', fontSize: '0.82rem', margin: '0 0 2px' }}>N° {c.numero}</p>
                        <p style={{ fontSize: '0.65rem', color: '#9CA3AF', margin: '0 0 4px' }}>{m.label}</p>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: c.precio_noche > 0 ? '#F5922E' : '#10B981', margin: 0 }}>
                          {c.precio_noche > 0 ? `S/ ${c.precio_noche}/n.` : 'Incluido'}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PASO CONFIRMAR ── */}
          {paso === 'confirmar' && sel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

              {/* Espacio seleccionado */}
              <div style={{ background: '#FFF7ED', border: '2px solid #F5922E', borderRadius: 14, padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {(() => { const I = TIPO_META[sel.tipo]?.icon ?? Car; const m = TIPO_META[sel.tipo] ?? {}; return (
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <I size={17} style={{ color: m.color }}/>
                  </div>
                )})()}
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: '#111827', margin: 0 }}>Espacio N° {sel.numero} — {sel.sede?.nombre}</p>
                  <p style={{ fontSize: '0.73rem', color: '#9CA3AF', margin: '1px 0 0' }}>{TIPO_META[sel.tipo]?.label}</p>
                </div>
                <button onClick={() => { setSel(null); setPaso('espacio') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '0.73rem', flexShrink: 0 }}>Cambiar</button>
              </div>

              {/* Fechas desde reserva O manual */}
              {reservaLink ? (
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '0.85rem 1rem' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>
                    Fechas vinculadas a tu reserva
                  </p>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Entrada</p>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#1E40AF' }}>{fDateShort(fechaEntrada)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Salida</p>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#1E40AF' }}>{fDateShort(fechaSalida)}</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' }}>Noches</p>
                      <p style={{ margin: '2px 0 0', fontWeight: 700, color: '#1E40AF' }}>{noches}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.68rem', color: '#2563EB', marginTop: '0.4rem', margin: '0.4rem 0 0' }}>
                    ✓ Código de reserva: <b style={{ fontFamily: 'monospace' }}>{reservaLink.codigo}</b>
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Entrada *</label>
                    <input type="date" min={today} style={inp} value={fechaM.entrada}
                      onChange={e => setFechaM(f => ({ ...f, entrada: e.target.value, salida: '' }))}/>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Salida *</label>
                    <input type="date" min={fechaM.entrada || today} style={{ ...inp, opacity: fechaM.entrada ? 1 : 0.5 }}
                      disabled={!fechaM.entrada} value={fechaM.salida}
                      onChange={e => setFechaM(f => ({ ...f, salida: e.target.value }))}/>
                  </div>
                </div>
              )}

              {/* Placa — dato clave */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem' }}>
                  🚗 Placa del vehículo <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input style={{ ...inp, fontFamily: 'monospace', letterSpacing: '0.1em', fontSize: '1rem', fontWeight: 700 }}
                  placeholder="Ej: ABC-123" value={placa}
                  onChange={e => setPlaca(e.target.value.toUpperCase())}/>
              </div>

              {/* Resumen precio */}
              {noches > 0 && (
                <div style={{ background: '#FFF7ED', border: '1px solid rgba(245,146,46,0.3)', borderRadius: 12, padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6B7280', marginBottom: '0.3rem' }}>
                    <span>S/ {sel.precio_noche} × {noches} noche{noches > 1 ? 's' : ''}</span>
                    <span>S/ {total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#3D1A06', borderTop: '1px solid rgba(245,146,46,0.2)', paddingTop: '0.45rem' }}>
                    <span>Total</span><span style={{ color: '#F5922E' }}>S/ {total.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '0.75rem', fontSize: '0.82rem' }}>{error}</div>}

              <button onClick={confirmar} disabled={saving || noches < 1}
                style={{ width: '100%', padding: '0.9rem', border: 'none', borderRadius: 12, background: noches < 1 ? '#E5E7EB' : 'linear-gradient(135deg,#F5922E,#E07820)', color: noches < 1 ? '#9CA3AF' : 'white', fontWeight: 700, fontSize: '0.95rem', cursor: noches < 1 ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Reservando...' : noches < 1 ? 'Selecciona las fechas' : `Confirmar cochera — S/ ${total.toFixed(2)}`}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function MisCocheras() {
  const [reservas, setReservas]           = useState([])
  const [disponibles, setDisponibles]     = useState([])
  const [reservasHotel, setReservasHotel] = useState([])
  const [loading, setLoading]             = useState(true)
  const [modalOpen, setModalOpen]         = useState(false)
  const [modalReady, setModalReady]       = useState(false) // true cuando los datos del modal están cargados
  const [success, setSuccess]             = useState(false)

  function load() {
    setLoading(true)
    cocherasApi.getReservas()
      .then(r => setReservas(r.data.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!modalOpen) { setModalReady(false); return }
    setModalReady(false)
    Promise.all([
      cocherasApi.getDisponibles().then(r => setDisponibles(r.data)),
      reservasApi.getAll()
        .then(r => {
          const items = r.data.data ?? r.data
          setReservasHotel(items.filter(x => ['pendiente', 'confirmada', 'checkin'].includes(x.estado)))
        })
        .catch(() => setReservasHotel([]))
    ]).finally(() => setModalReady(true))
  }, [modalOpen])

  function handleSaved() {
    setModalOpen(false); setSuccess(true)
    load()
    setTimeout(() => setSuccess(false), 3500)
  }

  async function cancelar(id) {
    if (!confirm('¿Cancelar esta reserva de cochera?')) return
    await cocherasApi.cancelar(id)
    load()
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>
      {modalOpen && !modalReady && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '2rem 2.5rem', textAlign: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ width: 36, height: 36, border: '3px solid #F5922E', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 0.85rem', animation: 'spin 0.7s linear infinite' }}/>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', fontWeight: 600 }}>Preparando disponibilidad...</p>
          </div>
        </div>
      )}
      {modalOpen && modalReady && (
        <ModalReservar
          disponibles={disponibles}
          reservasHotel={reservasHotel}
          onClose={() => setModalOpen(false)}
          onSave={handleSaved}
        />
      )}

      {/* Banner éxito */}
      {success && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', borderRadius: 12, padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
          <CheckCircle size={18}/> ¡Cochera reservada exitosamente!
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>Mis Cocheras</h1>
          <p style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>Reservas de estacionamiento</p>
        </div>
        <button onClick={() => setModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.1rem', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg,#F5922E,#E07820)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
          <Plus size={16}/> Reservar espacio
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '3rem' }}>Cargando...</p>
      ) : reservas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: 16, border: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🅿️</p>
          <p style={{ fontWeight: 700, color: '#374151', marginBottom: '0.4rem' }}>No tienes cocheras reservadas</p>
          <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginBottom: '1.25rem' }}>Reserva un espacio de estacionamiento para tu vehículo</p>
          <button onClick={() => setModalOpen(true)}
            style={{ padding: '0.7rem 1.5rem', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#F5922E,#E07820)', color: 'white', fontWeight: 700, cursor: 'pointer' }}>
            Reservar ahora
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {reservas.map(r => {
            const tipoM    = TIPO_META[r.cochera?.tipo] ?? TIPO_META.auto
            const TipoIcon = tipoM.icon
            const entStr   = typeof r.fecha_entrada === 'string' ? r.fecha_entrada.split('T')[0] : r.fecha_entrada
            const salStr   = typeof r.fecha_salida  === 'string' ? r.fecha_salida.split('T')[0]  : r.fecha_salida
            const noches   = entStr && salStr
              ? Math.ceil((new Date(salStr + 'T12:00:00') - new Date(entStr + 'T12:00:00')) / 86400000)
              : 0
            const esHoy    = entStr === new Date().toISOString().split('T')[0]

            return (
              <div key={r.id} style={{ background: 'white', border: `1px solid ${esHoy && r.estado === 'confirmada' ? '#FED7AA' : '#E5E7EB'}`, borderRadius: 16, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', boxShadow: esHoy ? '0 0 0 2px rgba(245,146,46,0.12)' : 'none' }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: tipoM.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TipoIcon size={22} style={{ color: tipoM.color }}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#111827', margin: 0 }}>Espacio {r.cochera?.numero} — {r.cochera?.sede?.nombre}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0' }}>
                        {tipoM.label} · <b style={{ fontFamily: 'monospace' }}>{r.codigo}</b>
                        {r.reserva_habitacion?.codigo && (
                          <span style={{ marginLeft: 6, color: '#2563EB', fontWeight: 600 }}>· Hab. {r.reserva_habitacion.codigo}</span>
                        )}
                      </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <EstadoBadge estado={r.estado}/>
                      {esHoy && r.estado === 'confirmada' && (
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#F5922E', background: '#FFF7ED', padding: '2px 8px', borderRadius: 9999 }}>🚗 Hoy</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: '#6B7280', margin: '0.4rem 0 0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12}/>
                      {fDateShort(entStr)} → {fDateShort(salStr)}
                      <span style={{ color: '#D1D5DB' }}>·</span>
                      {noches} noche{noches !== 1 ? 's' : ''}
                    </span>
                    {r.placa && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontWeight: 600, color: '#374151' }}>
                        <Car size={12}/> {r.placa}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: r.precio_total > 0 ? '#F5922E' : '#10B981', fontSize: '0.9rem' }}>
                      {r.precio_total > 0 ? `S/ ${Number(r.precio_total).toFixed(2)}` : 'Incluido'}
                    </span>
                    {['pendiente', 'confirmada'].includes(r.estado) && (
                      <button onClick={() => cancelar(r.id)}
                        style={{ padding: '4px 12px', border: '1px solid #FEE2E2', borderRadius: 8, background: '#FEF2F2', color: '#DC2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
