import { useState, useEffect } from 'react'
import { Car, Plus, X, Calendar, FileText, CheckCircle, Bike, Accessibility } from 'lucide-react'
import { cocherasApi } from '../../api/cocheras'
import { sedesApi } from '../../api/sedes'

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

function ModalReservar({ disponibles, onClose, onSave }) {
  const [sel, setSel]     = useState(null)
  const [form, setForm]   = useState({ fecha_entrada: '', fecha_salida: '', placa: '', notas: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const today = new Date().toISOString().split('T')[0]

  const lista = filtroTipo ? disponibles.filter(c => c.tipo === filtroTipo) : disponibles

  const noches = form.fecha_entrada && form.fecha_salida
    ? Math.ceil((new Date(form.fecha_salida) - new Date(form.fecha_entrada)) / 86400000) : 0
  const total = sel ? sel.precio_noche * noches : 0

  async function handleReservar() {
    if (!sel || noches < 1) return
    setSaving(true); setError('')
    try {
      await cocherasApi.reservar({
        cochera_id:    sel.id,
        fecha_entrada: form.fecha_entrada,
        fecha_salida:  form.fecha_salida,
        placa:         form.placa || undefined,
        notas:         form.notas || undefined,
      })
      onSave()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al reservar. Intenta de nuevo.')
    } finally { setSaving(false) }
  }

  const inp = { border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.65rem 0.9rem', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Reservar cochera</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={20}/></button>
        </div>

        {/* Paso 1: elegir espacio */}
        {!sel ? (
          <>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {['', 'auto', 'moto', 'discapacitado'].map(t => (
                <button key={t} onClick={() => setFiltroTipo(t)}
                  style={{ padding: '5px 14px', borderRadius: 9999, border: '1.5px solid', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', borderColor: filtroTipo === t ? '#F5922E' : '#E5E7EB', background: filtroTipo === t ? '#FFF7ED' : 'white', color: filtroTipo === t ? '#F5922E' : '#6B7280' }}>
                  {t === '' ? 'Todos' : TIPO_META[t]?.label}
                </button>
              ))}
            </div>
            {lista.length === 0 ? (
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '2rem' }}>No hay espacios disponibles</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {lista.map(c => {
                  const m = TIPO_META[c.tipo]; const Icon = m?.icon ?? Car
                  return (
                    <div key={c.id} onClick={() => setSel(c)}
                      style={{ border: '2px solid #E5E7EB', borderRadius: 14, padding: '1rem', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#F5922E'; e.currentTarget.style.background = '#FFF7ED' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.background = 'white' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: m?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem' }}>
                        <Icon size={18} style={{ color: m?.color }}/>
                      </div>
                      <p style={{ fontWeight: 700, color: '#111827', fontSize: '0.9rem' }}>Espacio {c.numero}</p>
                      <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.4rem' }}>{c.sede?.nombre}</p>
                      <p style={{ fontWeight: 700, color: '#F5922E', fontSize: '0.85rem' }}>
                        {c.precio_noche > 0 ? `S/ ${c.precio_noche}/noche` : 'Incluido'}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          /* Paso 2: fechas y confirmación */
          <>
            <div style={{ background: '#FFF7ED', border: '2px solid #F5922E', borderRadius: 14, padding: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: TIPO_META[sel.tipo]?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => { const I = TIPO_META[sel.tipo]?.icon ?? Car; return <I size={18} style={{ color: TIPO_META[sel.tipo]?.color }}/> })()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, color: '#111827' }}>Espacio {sel.numero} — {sel.sede?.nombre}</p>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{TIPO_META[sel.tipo]?.label}</p>
              </div>
              <button onClick={() => setSel(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '0.75rem' }}>Cambiar</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}><Calendar size={12} style={{ marginRight: 4 }}/>Entrada *</label>
                  <input type="date" min={today} style={inp} value={form.fecha_entrada} onChange={e => setForm(f => ({ ...f, fecha_entrada: e.target.value, fecha_salida: '' }))}/>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}><Calendar size={12} style={{ marginRight: 4 }}/>Salida *</label>
                  <input type="date" min={form.fecha_entrada || today} style={{ ...inp, opacity: form.fecha_entrada ? 1 : 0.5 }} disabled={!form.fecha_entrada} value={form.fecha_salida} onChange={e => setForm(f => ({ ...f, fecha_salida: e.target.value }))}/>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }}>Placa del vehículo <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
                <input style={inp} placeholder="Ej: ABC-123" value={form.placa} onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}/>
              </div>

              {noches > 0 && (
                <div style={{ background: '#FFF7ED', border: '1px solid rgba(245,146,46,0.3)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#6B7280', marginBottom: '0.35rem' }}>
                    <span>S/ {sel.precio_noche} × {noches} noche{noches > 1 ? 's' : ''}</span>
                    <span>S/ {total}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#3D1A06', borderTop: '1px solid rgba(245,146,46,0.2)', paddingTop: '0.5rem' }}>
                    <span>Total</span><span style={{ color: '#F5922E' }}>S/ {total}</span>
                  </div>
                </div>
              )}

              {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '0.75rem', fontSize: '0.82rem' }}>{error}</div>}

              <button onClick={handleReservar} disabled={saving || noches < 1}
                style={{ width: '100%', padding: '0.9rem', border: 'none', borderRadius: 12, background: noches < 1 ? '#E5E7EB' : 'linear-gradient(135deg,#F5922E,#E07820)', color: noches < 1 ? '#9CA3AF' : 'white', fontWeight: 700, fontSize: '0.95rem', cursor: noches < 1 ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Reservando...' : noches < 1 ? 'Selecciona las fechas' : `Confirmar cochera — S/ ${total}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function MisCocheras() {
  const [reservas, setReservas]       = useState([])
  const [disponibles, setDisponibles] = useState([])
  const [loading, setLoading]         = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [success, setSuccess]         = useState(false)

  function load() {
    setLoading(true)
    cocherasApi.getReservas()
      .then(r => setReservas(r.data.data ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (modalOpen) cocherasApi.getDisponibles().then(r => setDisponibles(r.data))
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
      {modalOpen && <ModalReservar disponibles={disponibles} onClose={() => setModalOpen(false)} onSave={handleSaved}/>}

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
            const tipoM = TIPO_META[r.cochera?.tipo] ?? TIPO_META.auto
            const TipoIcon = tipoM.icon
            const noches = Math.ceil((new Date(r.fecha_salida) - new Date(r.fecha_entrada)) / 86400000)
            return (
              <div key={r.id} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: 13, background: tipoM.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TipoIcon size={22} style={{ color: tipoM.color }}/>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#111827' }}>Espacio {r.cochera?.numero} — {r.cochera?.sede?.nombre}</p>
                      <p style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{tipoM.label} · Código: <b style={{ fontFamily: 'monospace' }}>{r.codigo}</b></p>
                    </div>
                    <EstadoBadge estado={r.estado}/>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#6B7280', marginBottom: '0.6rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12}/>
                      {new Date(r.fecha_entrada + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      {' → '}
                      {new Date(r.fecha_salida + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      <span style={{ color: '#D1D5DB' }}>·</span> {noches} noche{noches !== 1 ? 's' : ''}
                    </span>
                    {r.placa && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Car size={12}/> {r.placa}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#F5922E' }}>S/ {Number(r.precio_total).toFixed(2)}</span>
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
