import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { reservasApi } from '../../api/reservas'
import { habitacionesApi } from '../../api/habitaciones'
import { sedesApi } from '../../api/sedes'
import { cocherasApi } from '../../api/cocheras'
import QRLib from 'qr.js/lib/QRCode'
import EL from 'qr.js/lib/ErrorCorrectLevel'

function QRCodeSVG({ value, size = 256, fgColor = '#000000', bgColor = '#ffffff' }) {
  try {
    const qr = new QRLib(-1, EL['L'])
    const bytes = Array.from(new TextEncoder().encode(value))
      .map(b => String.fromCharCode(b & 0xff)).join('')
    qr.addData(bytes, 'Byte')
    qr.make()
    const cells = qr.modules
    const n = cells.length
    const fgD = cells.map((row, r) => row.map((cell, c) => cell ? `M ${c} ${r} l 1 0 0 1 -1 0 Z` : '').join(' ')).join(' ')
    const bgD = cells.map((row, r) => row.map((cell, c) => !cell ? `M ${c} ${r} l 1 0 0 1 -1 0 Z` : '').join(' ')).join(' ')
    return (
      <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} xmlns="http://www.w3.org/2000/svg">
        <path d={bgD} fill={bgColor} />
        <path d={fgD} fill={fgColor} />
      </svg>
    )
  } catch {
    return <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', borderRadius: 8 }}><span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>QR no disponible</span></div>
  }
}
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'

const ESTADO_STYLE = {
  pendiente:  { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente' },
  confirmada: { bg: '#DBEAFE', color: '#1E40AF', label: 'Confirmada' },
  checkin:    { bg: '#D1FAE5', color: '#065F46', label: 'En hotel'   },
  finalizada: { bg: '#F3F4F6', color: '#374151', label: 'Finalizada' },
  cancelada:  { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelada'  },
  expirada:   { bg: '#F3F4F6', color: '#6B7280', label: 'Expirada'   },
}

const METODO_LABEL = {
  yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia',
  efectivo: 'Efectivo', tarjeta: 'Tarjeta',
}
const TIPO_PAGO_LABEL = {
  adelanto: 'Adelanto 50%', saldo: 'Saldo restante', total: 'Pago completo',
}

// ── helpers de pago ──────────────────────────────────────────────────────────
function calcPagos(reserva) {
  const pagos = reserva.pagos ?? []
  const verificados = pagos.filter(p => p.estado === 'verificado')
  const pendientes  = pagos.filter(p => p.estado === 'pendiente')
  const totalPagado = verificados.reduce((s, p) => s + Number(p.monto), 0)
  const saldo       = Math.max(0, Number(reserva.precio_total) - totalPagado)
  return { pagos, verificados, pendientes, totalPagado, saldo }
}

// ── Modal detalle de pago ────────────────────────────────────────────────────
function ModalPago({ reserva, onClose }) {
  const { pagos, totalPagado, saldo } = calcPagos(reserva)
  const total = Number(reserva.precio_total)

  function fDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #3D1A06, #7B4019)', padding: '1.25rem 1.5rem', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 12, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: '1.1rem' }}>×</button>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>Detalle de pago</p>
          <p style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{reserva.codigo} — {reserva.sede?.nombre}</p>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto' }}>

          {/* Resumen */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '0.75rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.62rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Total reserva</p>
              <p style={{ fontWeight: 900, color: '#111827', fontSize: '1rem', margin: 0 }}>S/ {total.toFixed(2)}</p>
            </div>
            <div style={{ background: totalPagado > 0 ? '#F0FDF4' : '#F9FAFB', borderRadius: 12, padding: '0.75rem', textAlign: 'center', border: totalPagado > 0 ? '1px solid #BBF7D0' : 'none' }}>
              <p style={{ fontSize: '0.62rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Pagado</p>
              <p style={{ fontWeight: 900, color: totalPagado > 0 ? '#16A34A' : '#9CA3AF', fontSize: '1rem', margin: 0 }}>S/ {totalPagado.toFixed(2)}</p>
            </div>
            <div style={{ background: saldo > 0 ? '#FFF7ED' : '#F0FDF4', borderRadius: 12, padding: '0.75rem', textAlign: 'center', border: saldo > 0 ? '1px solid #FED7AA' : '1px solid #BBF7D0' }}>
              <p style={{ fontSize: '0.62rem', color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Saldo</p>
              <p style={{ fontWeight: 900, color: saldo > 0 ? '#F5922E' : '#16A34A', fontSize: '1rem', margin: 0 }}>
                {saldo > 0 ? `S/ ${saldo.toFixed(2)}` : '✓ S/ 0'}
              </p>
            </div>
          </div>

          {/* Barra progreso */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9CA3AF', marginBottom: 6 }}>
              <span>Progreso de pago</span>
              <span>{total > 0 ? Math.round((totalPagado / total) * 100) : 0}%</span>
            </div>
            <div style={{ height: 8, background: '#F3F4F6', borderRadius: 9999, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 9999, background: saldo === 0 ? '#16A34A' : 'linear-gradient(90deg, #F5922E, #E07820)', width: `${Math.min(100, total > 0 ? (totalPagado / total) * 100 : 0)}%`, transition: 'width 0.4s' }}/>
            </div>
          </div>

          {/* Detalle de cada pago */}
          {pagos.length > 0 ? (
            <>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>Movimientos</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                {pagos.map((p, i) => {
                  const esVerif = p.estado === 'verificado'
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.9rem', borderRadius: 12, background: esVerif ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${esVerif ? '#BBF7D0' : '#FDE68A'}` }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: esVerif ? '#DCFCE7' : '#FEF9C3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                        {esVerif ? '✅' : '⏳'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>S/ {Number(p.monto).toFixed(2)}</span>
                          <span style={{ fontSize: '0.7rem', color: esVerif ? '#16A34A' : '#D97706', fontWeight: 700 }}>
                            {esVerif ? 'Verificado' : 'Pendiente'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{METODO_LABEL[p.metodo_pago] ?? p.metodo_pago}</span>
                          {p.tipo_pago && <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>· {TIPO_PAGO_LABEL[p.tipo_pago] ?? p.tipo_pago}</span>}
                          <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>· {fDate(p.fecha_pago)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#F9FAFB', borderRadius: 12 }}>
              <p style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>Sin pagos registrados aún.</p>
            </div>
          )}

          {/* Aviso saldo */}
          {saldo > 0 && (
            <div style={{ marginTop: '1rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
              <p style={{ fontSize: '0.8rem', color: '#92400E', lineHeight: 1.55, margin: 0 }}>
                Tienes un saldo pendiente de <b>S/ {saldo.toFixed(2)}</b>. El recepcionista te lo cobrará al momento del check-in.
              </p>
            </div>
          )}
          {saldo === 0 && totalPagado > 0 && (
            <div style={{ marginTop: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1rem' }}>✅</span>
              <p style={{ fontSize: '0.8rem', color: '#166534', margin: 0, fontWeight: 600 }}>
                Pago completo. No tienes saldo pendiente.
              </p>
            </div>
          )}

          <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: '1.1rem', padding: '0.7rem', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
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

const COCHERA_TIPO_ICONO = { auto: '🚗', moto: '🏍️', discapacitado: '♿' }

function ModalQR({ reserva, onClose }) {
  const qrRef = useRef(null)
  const [cocheraReserva, setCocheraReserva] = useState(null)

  useEffect(() => {
    cocherasApi.getReservas({ reserva_id: reserva.id })
      .then(r => {
        const items = r.data.data ?? r.data
        const cr = items.find(cr => !['cancelada', 'finalizada'].includes(cr.estado))
        setCocheraReserva(cr ?? null)
      })
      .catch(() => {})
  }, [reserva.id])

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

  const noches = Math.ceil((new Date((reserva.fecha_salida || '').split('T')[0] + 'T12:00:00') - new Date((reserva.fecha_entrada || '').split('T')[0] + 'T12:00:00')) / 86400000)

  const { totalPagado, saldo, pendientes } = calcPagos(reserva)
  const total = Number(reserva.precio_total)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      {/* scroll habilitado */}
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 420, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column' }}>

        {/* Header sticky */}
        <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontWeight: 800, fontSize: '1rem', color: '#111', margin: 0 }}>Tu código de reserva</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280', lineHeight: 1 }}>×</button>
        </div>

        {/* QR */}
        <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>

          <div ref={qrRef} style={{ padding: '1.1rem', background: 'white', borderRadius: 16, border: '2px solid #F3F4F6', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <QRCodeSVG value={`BRISAS:${reserva.codigo}`} size={160} fgColor="#3D1A06" bgColor="white"/>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.68rem', color: '#9CA3AF', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Código</p>
            <p style={{ fontFamily: 'monospace', fontSize: '1.6rem', fontWeight: 800, color: '#3D1A06', letterSpacing: '0.12em', margin: 0 }}>{reserva.codigo}</p>
          </div>
        </div>

        <div style={{ padding: '0.75rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

          {/* Detalles de reserva */}
          <div style={{ background: '#FDF6ED', borderRadius: 12, padding: '0.9rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <Row label="Sede"       value={reserva.sede?.nombre} />
            <Row label="Habitación" value={`Nº ${reserva.habitacion?.numero} — ${reserva.habitacion?.tipo?.replace(/_/g,' ')}`} />
            <Row label="Entrada"    value={new Date((reserva.fecha_entrada || '').split('T')[0] + 'T12:00:00').toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'long', year:'numeric' })} />
            <Row label="Salida"     value={new Date((reserva.fecha_salida  || '').split('T')[0] + 'T12:00:00').toLocaleDateString('es-PE', { weekday:'short', day:'numeric', month:'long', year:'numeric' })} />
            <Row label="Noches"     value={noches} />
            <Row label="Total"      value={`S/ ${reserva.precio_total}`} bold />
          </div>

          {/* ── Estado de pago — para que el recepcionista vea de un vistazo ── */}
          {(() => {
            if (totalPagado === 0 && pendientes.length === 0) return (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>❌</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#DC2626', fontSize: '0.82rem', margin: 0 }}>Sin pago registrado</p>
                  <p style={{ color: '#9CA3AF', fontSize: '0.72rem', margin: 0 }}>El cliente debe pagar en recepción: S/ {total.toFixed(2)}</p>
                </div>
              </div>
            )
            if (pendientes.length > 0 && totalPagado === 0) return (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>⏳</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#D97706', fontSize: '0.82rem', margin: 0 }}>Pago pendiente de verificación</p>
                  <p style={{ color: '#9CA3AF', fontSize: '0.72rem', margin: 0 }}>Monto: S/ {pendientes.reduce((s,p) => s + Number(p.monto), 0).toFixed(2)} — verificar en sistema</p>
                </div>
              </div>
            )
            if (saldo > 0) return (
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>💳</span>
                  <p style={{ fontWeight: 700, color: '#D97706', fontSize: '0.82rem', margin: 0 }}>Pago parcial — saldo pendiente</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 3 }}>
                  <span style={{ color: '#6B7280' }}>Pagado</span>
                  <span style={{ fontWeight: 700, color: '#16A34A' }}>S/ {totalPagado.toFixed(2)} ✓</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingTop: 4, borderTop: '1px solid #FED7AA' }}>
                  <span style={{ color: '#6B7280', fontWeight: 600 }}>⚠ Cobrar al check-in</span>
                  <span style={{ fontWeight: 800, color: '#F5922E' }}>S/ {saldo.toFixed(2)}</span>
                </div>
              </div>
            )
            return (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.1rem' }}>✅</span>
                <div>
                  <p style={{ fontWeight: 700, color: '#16A34A', fontSize: '0.82rem', margin: 0 }}>Pago completo verificado</p>
                  <p style={{ color: '#9CA3AF', fontSize: '0.72rem', margin: 0 }}>S/ {totalPagado.toFixed(2)} — sin saldo pendiente</p>
                </div>
              </div>
            )
          })()}

          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', margin: 0 }}>
            Muestra este QR al llegar al hotel para hacer tu check-in.
          </p>

          {/* Cochera vinculada */}
          {cocheraReserva && (
            <div style={{ background: '#FFF7ED', borderRadius: 12, padding: '0.85rem 1.1rem', border: '1px solid #FED7AA' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>
                🚗 Cochera reservada
              </p>
              <Row label="Espacio" value={`${COCHERA_TIPO_ICONO[cocheraReserva.cochera?.tipo] ?? '🚗'} N° ${cocheraReserva.cochera?.numero} (${cocheraReserva.cochera?.tipo})`} />
              <Row label="Código"  value={cocheraReserva.codigo} />
              {cocheraReserva.placa && <Row label="Placa" value={cocheraReserva.placa} />}
              <Row label="Total"   value={cocheraReserva.precio_total > 0 ? `S/ ${Number(cocheraReserva.precio_total).toFixed(2)}` : 'Incluido'} bold/>
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
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
  const { isMobile } = useBreakpoint()
  const toast = useToast()
  const { confirm, dialog } = useConfirm()
  const [reservas, setReservas] = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [modal, setModal]       = useState(false)
  const [modalHabId, setModalHabId] = useState(null)
  const [qrReserva, setQrReserva]   = useState(null)
  const [pagoReserva, setPagoReserva] = useState(null)
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

  async function handleCancelar(id, codigo) {
    const ok = await confirm({ title: 'Cancelar reserva', message: `¿Cancelar la reserva ${codigo}? Esta acción no se puede deshacer.`, confirmLabel: 'Sí, cancelar', danger: true })
    if (!ok) return
    try { await reservasApi.cancelar(id); toast.success('Reserva cancelada.'); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'No se pudo cancelar.') }
  }

  const cell = { padding: '0.9rem 1rem', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #F3F4F6' }
  const head = { padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }

  return (
    <div className="page-pad">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 800, color: '#111', marginBottom: '0.15rem' }}>Mis Reservas</h1>
          <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Historial y estado de tus reservaciones</p>
        </div>
        <button onClick={() => navigate('/reservas/nueva')}
          style={{ padding: '0.6rem 1.1rem', background: '#F5922E', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
          + {isMobile ? 'Reservar' : 'Nueva reserva'}
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['', 'pendiente', 'confirmada', 'checkin', 'finalizada', 'cancelada'].map(e => (
          <button key={e} onClick={() => { setFiltroEstado(e); setPage(1) }}
            style={{ padding: '5px 14px', borderRadius: 20, border: '1.5px solid', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              borderColor: filtroEstado === e ? '#F5922E' : '#E5E7EB',
              background:  filtroEstado === e ? '#FFF7ED' : 'white',
              color:       filtroEstado === e ? '#F5922E' : '#6B7280' }}>
            {e === '' ? 'Todas' : ESTADO_STYLE[e]?.label}
          </button>
        ))}
      </div>

      {/* Mobile card list */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1rem', height: 120, backgroundColor: '#F9FAFB' }} />
            ))
          ) : reservas.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: '2.5rem 1rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
              No tienes reservas aún. ¡Haz tu primera reserva!
            </div>
          ) : reservas.map(r => {
            const noches = Math.ceil((new Date(r.fecha_salida) - new Date(r.fecha_entrada)) / 86400000)
            return (
              <div key={r.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                {/* Top row: code + badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#3D1A06' }}>{r.codigo}</span>
                  <EstadoBadge estado={r.estado}/>
                </div>
                {/* Location + dates */}
                <div style={{ fontSize: '0.82rem', color: '#374151', marginBottom: '0.3rem', fontWeight: 600 }}>
                  {r.sede?.nombre} · Hab. {r.habitacion?.numero}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginBottom: '0.65rem' }}>
                  {r.habitacion?.tipo?.replace(/_/g,' ')}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entrada</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{new Date((r.fecha_entrada||'').slice(0,10)+'T12:00:00').toLocaleDateString('es-PE')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salida</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{new Date((r.fecha_salida||'').slice(0,10)+'T12:00:00').toLocaleDateString('es-PE')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Noches</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{noches}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#3D1A06' }}>S/ {r.precio_total}</div>
                    {(() => {
                      const { totalPagado, saldo } = calcPagos(r)
                      if (totalPagado > 0 && saldo > 0) return <div style={{ fontSize: '0.65rem', color: '#F5922E', fontWeight: 700 }}>⚠ S/ {saldo.toFixed(2)} saldo</div>
                      if (totalPagado > 0 && saldo === 0) return <div style={{ fontSize: '0.65rem', color: '#16A34A', fontWeight: 700 }}>✓ Pagado</div>
                      return null
                    })()}
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #F3F4F6', paddingTop: '0.65rem', flexWrap: 'wrap' }}>
                  {(r.pagos ?? []).length > 0 && (
                    <button onClick={() => setPagoReserva(r)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid #FED7AA', background: '#FFF7ED', color: '#D97706', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                      💳 Ver pago
                    </button>
                  )}
                  {['pendiente','confirmada','checkin'].includes(r.estado) && (
                    <button onClick={() => setQrReserva(r)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      📱 Ver QR
                    </button>
                  )}
                  {['pendiente','confirmada'].includes(r.estado) && (
                    <button onClick={() => handleCancelar(r.id, r.codigo)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Desktop table */
        <div className="table-scroll" style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB' }}>
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
                      <div style={{ fontSize: '0.82rem' }}>{new Date((r.fecha_entrada||'').slice(0,10)+'T12:00:00').toLocaleDateString('es-PE')}</div>
                      <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>→ {new Date((r.fecha_salida||'').slice(0,10)+'T12:00:00').toLocaleDateString('es-PE')}</div>
                    </td>
                    <td style={{ ...cell, textAlign: 'center' }}>{noches}</td>
                    <td style={cell}>
                      {(() => {
                        const { totalPagado, saldo } = calcPagos(r)
                        return (
                          <>
                            <span style={{ fontWeight: 700 }}>S/ {r.precio_total}</span>
                            {totalPagado > 0 && saldo > 0 && (
                              <div style={{ marginTop: 3 }}>
                                <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 700 }}>✓ S/ {totalPagado.toFixed(2)} pagado</span>
                                <br/>
                                <span style={{ fontSize: '0.68rem', color: '#F5922E', fontWeight: 700 }}>⚠ S/ {saldo.toFixed(2)} saldo</span>
                              </div>
                            )}
                            {totalPagado > 0 && saldo === 0 && (
                              <div style={{ marginTop: 3 }}>
                                <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 700 }}>✓ Pagado completo</span>
                              </div>
                            )}
                            {(r.pagos ?? []).some(p => p.estado === 'pendiente') && totalPagado === 0 && (
                              <div style={{ marginTop: 3 }}>
                                <span style={{ fontSize: '0.68rem', color: '#D97706', fontWeight: 600 }}>⏳ En verificación</span>
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </td>
                    <td style={cell}><EstadoBadge estado={r.estado}/></td>
                    <td style={{ ...cell, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {(r.pagos ?? []).length > 0 && (
                          <button onClick={() => setPagoReserva(r)}
                            title="Detalle de pago"
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FED7AA', background: '#FFF7ED', color: '#D97706', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                            💳 Pago
                          </button>
                        )}
                        {['pendiente','confirmada','checkin'].includes(r.estado) && (
                          <button onClick={() => setQrReserva(r)}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                            title="Ver QR">
                            📱 QR
                          </button>
                        )}
                        {['pendiente','confirmada'].includes(r.estado) && (
                          <button onClick={() => handleCancelar(r.id, r.codigo)}
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
      )}

      {/* Pagination */}
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

      {qrReserva   && <ModalQR   reserva={qrReserva}   onClose={() => setQrReserva(null)}/>}
      {pagoReserva && <ModalPago reserva={pagoReserva} onClose={() => setPagoReserva(null)}/>}

      {dialog}
    </div>
  )
}
