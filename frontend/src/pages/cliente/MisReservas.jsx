import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { reservasApi } from '../../api/reservas'
import { habitacionesApi } from '../../api/habitaciones'
import { sedesApi } from '../../api/sedes'
import QRCode from 'react-qr-code'

const ESTADO_STYLE = {
  pendiente:  { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente' },
  confirmada: { bg: '#DBEAFE', color: '#1E40AF', label: 'Confirmada' },
  checkin:    { bg: '#D1FAE5', color: '#065F46', label: 'En hotel'   },
  finalizada: { bg: '#F3F4F6', color: '#374151', label: 'Finalizada' },
  cancelada:  { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelada'  },
  expirada:   { bg: '#F3F4F6', color: '#6B7280', label: 'Expirada'   },
}

function EstadoBadge({ estado }) {
  const s = ESTADO_STYLE[estado] ?? ESTADO_STYLE.pendiente
  return <span style={{ ...s, padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>{s.label}</span>
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  )
}

function NuevaReservaForm({ onSave, onCancel, saving, preHabId }) {
  const [sedes, setSedes]           = useState([])
  const [habitaciones, setHabitaciones] = useState([])
  const [form, setForm]             = useState({ sede_id: '', habitacion_id: '', fecha_entrada: '', fecha_salida: '', num_huespedes: 1, notas: '' })
  const [errors, setErrors]         = useState({})
  const [precio, setPrecio]         = useState(null)

  useEffect(() => { sedesApi.getAll().then(r => setSedes(r.data.filter(s => s.activo))) }, [])

  // Si viene con habitación precargada, carga sus datos
  useEffect(() => {
    if (!preHabId) return
    habitacionesApi.getDisponibles().then(r => {
      const hab = r.data.find(h => h.id === preHabId)
      if (hab) {
        setForm(f => ({ ...f, sede_id: String(hab.sede_id), habitacion_id: String(hab.id) }))
      }
    })
  }, [preHabId])

  useEffect(() => {
    if (!form.sede_id) { setHabitaciones([]); return }
    habitacionesApi.getAll({ sede_id: form.sede_id, estado: 'disponible' })
      .then(r => setHabitaciones(r.data.data ?? r.data))
  }, [form.sede_id])

  useEffect(() => {
    if (!form.habitacion_id || !form.fecha_entrada || !form.fecha_salida) { setPrecio(null); return }
    const hab  = habitaciones.find(h => h.id === +form.habitacion_id)
    if (!hab) return
    const dias = Math.ceil((new Date(form.fecha_salida) - new Date(form.fecha_entrada)) / 86400000)
    if (dias > 0) setPrecio({ noches: dias, porNoche: hab.precio, total: hab.precio * dias })
  }, [form.habitacion_id, form.fecha_entrada, form.fecha_salida, habitaciones])

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  async function handleSubmit(e) {
    e.preventDefault(); setErrors({})
    try { await onSave(form) }
    catch (err) { if (err.response?.status === 422) setErrors(err.response.data.errors ?? {}); else setErrors({ general: err.response?.data?.message ?? 'Error al crear la reserva.' }) }
  }

  const inp = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.65rem 0.85rem', fontSize: '0.875rem', outline: 'none' }
  const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }
  const err = (f) => errors[f]?.[0] ? <p style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors[f][0]}</p> : null

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {errors.general && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.7rem 1rem', borderRadius: 8, fontSize: '0.875rem' }}>{errors.general}</div>}

      <div>
        <label style={lbl}>Sede *</label>
        <select style={inp} value={form.sede_id} onChange={e => { set('sede_id', e.target.value); set('habitacion_id', '') }} required>
          <option value="">Seleccionar sede...</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
      </div>

      <div>
        <label style={lbl}>Habitación *</label>
        <select style={inp} value={form.habitacion_id} onChange={e => set('habitacion_id', e.target.value)} required disabled={!form.sede_id}>
          <option value="">Seleccionar habitación...</option>
          {habitaciones.map(h => (
            <option key={h.id} value={h.id}>
              Hab. {h.numero} — {h.tipo.replace(/_/g,' ')} — S/ {h.precio}/noche
            </option>
          ))}
        </select>
        {form.sede_id && habitaciones.length === 0 && <p style={{ fontSize: '0.75rem', color: '#F59E0B', marginTop: '0.3rem' }}>No hay habitaciones disponibles en esta sede.</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={lbl}>Fecha entrada *</label>
          <input style={inp} type="date" value={form.fecha_entrada} min={new Date().toISOString().split('T')[0]}
            onChange={e => set('fecha_entrada', e.target.value)} required/>
          {err('fecha_entrada')}
        </div>
        <div>
          <label style={lbl}>Fecha salida *</label>
          <input style={inp} type="date" value={form.fecha_salida} min={form.fecha_entrada || new Date().toISOString().split('T')[0]}
            onChange={e => set('fecha_salida', e.target.value)} required/>
          {err('fecha_salida')}
        </div>
      </div>

      <div>
        <label style={lbl}>N° de huéspedes *</label>
        <input style={inp} type="number" min={1} max={10} value={form.num_huespedes} onChange={e => set('num_huespedes', +e.target.value)} required/>
      </div>

      <div>
        <label style={lbl}>Notas (opcional)</label>
        <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Alguna solicitud especial..."/>
      </div>

      {precio && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '0.85rem 1rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#15803D', fontWeight: 600, marginBottom: '0.3rem' }}>Resumen de precio</p>
          <p style={{ fontSize: '0.82rem', color: '#166534' }}>S/ {precio.porNoche} × {precio.noches} noche{precio.noches > 1 ? 's' : ''}</p>
          <p style={{ fontSize: '1rem', fontWeight: 800, color: '#15803D', marginTop: '0.25rem' }}>Total: S/ {precio.total}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
        <button type="button" onClick={onCancel} style={{ padding: '0.65rem 1.25rem', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer' }}>Cancelar</button>
        <button type="submit" disabled={saving} style={{ padding: '0.65rem 1.25rem', borderRadius: 8, border: 'none', background: '#F5922E', color: 'white', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Reservando...' : 'Confirmar reserva'}
        </button>
      </div>
    </form>
  )
}

function ModalQR({ reserva, onClose }) {
  const qrRef = useRef(null)

  function descargar() {
    const svg    = qrRef.current?.querySelector('svg')
    if (!svg) return
    const data   = new XMLSerializer().serializeToString(svg)
    const blob   = new Blob([data], { type: 'image/svg+xml' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    a.href       = url
    a.download   = `reserva-${reserva.codigo}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const noches = Math.ceil((new Date(reserva.fecha_salida) - new Date(reserva.fecha_entrada)) / 86400000)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#111' }}>Tu código de reserva</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>

        {/* QR */}
        <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>

          {/* QR visual */}
          <div ref={qrRef} style={{ padding: '1.25rem', background: 'white', borderRadius: 16, border: '2px solid #F3F4F6', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <QRCode
              value={`BRISAS:${reserva.codigo}`}
              size={180}
              fgColor="#3D1A06"
              bgColor="white"
            />
          </div>

          {/* Código legible */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Código</p>
            <p style={{ fontFamily: 'monospace', fontSize: '1.75rem', fontWeight: 800, color: '#3D1A06', letterSpacing: '0.12em' }}>{reserva.codigo}</p>
          </div>

          {/* Detalles */}
          <div style={{ width: '100%', background: '#FDF6ED', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Row label="Sede"     value={reserva.sede?.nombre} />
            <Row label="Habitación" value={`Nº ${reserva.habitacion?.numero} — ${reserva.habitacion?.tipo?.replace(/_/g,' ')}`} />
            <Row label="Entrada"  value={new Date(reserva.fecha_entrada).toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'long', year:'numeric' })} />
            <Row label="Salida"   value={new Date(reserva.fecha_salida).toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'long', year:'numeric' })} />
            <Row label="Noches"   value={noches} />
            <Row label="Total"    value={`S/ ${reserva.precio_total}`} bold />
          </div>

          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', textAlign: 'center' }}>
            Muestra este QR al llegar al hotel para hacer tu check-in.
          </p>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <button onClick={descargar} style={{ flex: 1, padding: '0.7rem', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              ⬇ Descargar
            </button>
            <button onClick={onClose} style={{ flex: 1, padding: '0.7rem', borderRadius: 10, border: 'none', background: '#F5922E', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
      <span style={{ color: '#6B7280' }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 500, color: '#111' }}>{value}</span>
    </div>
  )
}

export default function MisReservas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [reservas, setReservas] = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [modal, setModal]       = useState(false)
  const [modalHabId, setModalHabId] = useState(null)
  const [qrReserva, setQrReserva] = useState(null)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [page, setPage]         = useState(1)
  const [nuevoCodigo, setNuevoCodigo] = useState(searchParams.get('nueva') ?? '')

  // Si viene de landing con ?hab=ID, redirige a la nueva página de reserva
  useEffect(() => {
    const habId = searchParams.get('hab')
    if (habId) navigate(`/reservas/nueva?hab=${habId}`, { replace: true })
    const nueva = searchParams.get('nueva')
    if (nueva) setSearchParams({}, { replace: true })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page }
      if (filtroEstado) params.estado = filtroEstado
      const { data } = await reservasApi.getAll(params)
      setReservas(data.data); setMeta(data)
    } finally { setLoading(false) }
  }, [page, filtroEstado])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    setSaving(true)
    try { await reservasApi.create(form); setModal(false); load() }
    finally { setSaving(false) }
  }

  async function handleCancelar(id) {
    if (!confirm('¿Cancelar esta reserva?')) return
    await reservasApi.cancelar(id); load()
  }

  const cell = { padding: '0.9rem 1rem', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #F3F4F6' }
  const head = { padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111', marginBottom: '0.15rem' }}>Mis Reservas</h1>
          <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Historial y estado de tus reservaciones</p>
        </div>
        <button onClick={() => navigate('/reservas/nueva')}
          style={{ padding: '0.6rem 1.25rem', background: '#F5922E', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          + Nueva reserva
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['', 'pendiente', 'confirmada', 'checkin', 'finalizada', 'cancelada'].map(e => (
          <button key={e} onClick={() => { setFiltroEstado(e); setPage(1) }}
            style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              borderColor: filtroEstado === e ? '#F5922E' : '#E5E7EB',
              background:  filtroEstado === e ? '#FFF7ED' : 'white',
              color:       filtroEstado === e ? '#F5922E' : '#6B7280' }}>
            {e === '' ? 'Todas' : ESTADO_STYLE[e]?.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={head}>Código</th>
              <th style={head}>Sede / Habitación</th>
              <th style={head}>Fechas</th>
              <th style={head}>Noches</th>
              <th style={head}>Total</th>
              <th style={head}>Estado</th>
              <th style={{ ...head, textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', color: '#9CA3AF' }}>Cargando...</td></tr>
            ) : reservas.length === 0 ? (
              <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', color: '#9CA3AF', padding: '3rem' }}>
                No tienes reservas aún. ¡Haz tu primera reserva!
              </td></tr>
            ) : reservas.map(r => {
              const noches = Math.ceil((new Date(r.fecha_salida) - new Date(r.fecha_entrada)) / 86400000)
              return (
                <tr key={r.id}>
                  <td style={cell}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3D1A06' }}>{r.codigo}</span></td>
                  <td style={cell}>
                    <div style={{ fontWeight: 600 }}>{r.sede?.nombre}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>Hab. {r.habitacion?.numero} — {r.habitacion?.tipo?.replace(/_/g,' ')}</div>
                  </td>
                  <td style={cell}>
                    <div style={{ fontSize: '0.82rem' }}>{new Date(r.fecha_entrada).toLocaleDateString('es-PE')}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>→ {new Date(r.fecha_salida).toLocaleDateString('es-PE')}</div>
                  </td>
                  <td style={{ ...cell, textAlign: 'center' }}>{noches}</td>
                  <td style={cell}><span style={{ fontWeight: 700 }}>S/ {r.precio_total}</span></td>
                  <td style={cell}><EstadoBadge estado={r.estado}/></td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                      {['pendiente','confirmada','checkin'].includes(r.estado) && (
                        <button onClick={() => setQrReserva(r)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                          title="Ver QR">
                          📱 QR
                        </button>
                      )}
                      {['pendiente', 'confirmada'].includes(r.estado) && (
                        <button onClick={() => handleCancelar(r.id)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {meta?.last_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E5E7EB', cursor: 'pointer', fontWeight: page === p ? 700 : 400, background: page === p ? '#F5922E' : 'white', color: page === p ? 'white' : '#374151' }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="Nueva reserva" onClose={() => { setModal(false); setModalHabId(null) }}>
          <NuevaReservaForm
            onSave={handleSave}
            onCancel={() => { setModal(false); setModalHabId(null) }}
            saving={saving}
            preHabId={modalHabId}
          />
        </Modal>
      )}

      {qrReserva && (
        <ModalQR reserva={qrReserva} onClose={() => setQrReserva(null)}/>
      )}
    </div>
  )
}
