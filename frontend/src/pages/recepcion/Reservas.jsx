import { useState, useEffect, useCallback, useRef } from 'react'
import { QrCode, X, Search, CheckCircle, ArrowRight, User, BedDouble, Calendar, MapPin, FileDown, Keyboard, Camera } from 'lucide-react'
import { reservasApi } from '../../api/reservas'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'
import axiosClient from '../../api/axiosClient'

const ESTADO_STYLE = {
  pendiente:  { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente'  },
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

function AccionBtn({ label, color, bg, border, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${border}`, background: bg, color, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}

// ── Sub-componente: escáner de cámara ────────────────────────
const QR_DIV_ID = 'qr-cam-reader'

function QrCamScanner({ onResult, onError }) {
  const scannerRef = useRef(null)
  const activeRef  = useRef(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    activeRef.current = true

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!activeRef.current) return

      const scanner = new Html5Qrcode(QR_DIV_ID)
      scannerRef.current = scanner

      const config = { fps: 12, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 }
      const onScan  = (text) => {
        const code = text.startsWith('BRISAS:') ? text.slice(7) : text.trim().toUpperCase()
        scanner.stop().catch(() => {})
        onResult(code)
      }

      // Try rear camera first (mobile), fall back to any available camera
      scanner.start({ facingMode: 'environment' }, config, onScan, () => {})
        .then(() => { if (activeRef.current) setReady(true) })
        .catch(() =>
          scanner.start({ facingMode: 'user' }, config, onScan, () => {})
            .then(() => { if (activeRef.current) setReady(true) })
            .catch(() => onError('No se pudo acceder a la cámara. Verifique los permisos del navegador.'))
        )
    }).catch(() => onError('No se pudo cargar el escáner.'))

    return () => {
      activeRef.current = false
      scannerRef.current?.stop().catch(() => {})
    }
  }, [])

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#111', position: 'relative' }}>
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 1, gap: 8 }}>
          <div style={{ width: 28, height: 28, border: '3px solid #16A34A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Iniciando cámara...</p>
        </div>
      )}
      <div id={QR_DIV_ID} style={{ width: '100%', minHeight: 280 }} />
      {ready && (
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', padding: '0.4rem 0.5rem 0.6rem', background: '#111' }}>
          Apunta al código QR de la reserva del huésped
        </p>
      )}
    </div>
  )
}

// ── Modal de Check-in rápido ─────────────────────────────────
function ModalCheckin({ onClose, onDone }) {
  const [modo, setModo]       = useState('camara') // 'camara' | 'manual'
  const [codigo, setCodigo]   = useState('')
  const [reserva, setReserva] = useState(null)
  const [buscando, setBusc]   = useState(false)
  const [accion, setAccion]   = useState(false)
  const [error, setError]     = useState('')
  const inputRef = useRef()

  useEffect(() => {
    if (modo === 'manual') inputRef.current?.focus()
  }, [modo])

  async function buscar(cod) {
    const q = (cod ?? codigo).trim().toUpperCase()
    if (!q) return
    setBusc(true); setError(''); setReserva(null)
    try {
      const { data } = await reservasApi.getAll({ search: q })
      const r = data.data?.find(x => x.codigo.toUpperCase() === q)
      if (!r) setError('No se encontró ninguna reserva con ese código.')
      else     setReserva(r)
    } catch { setError('Error al buscar la reserva.') }
    finally  { setBusc(false) }
  }

  function handleScan(cod) {
    setCodigo(cod)
    setModo('manual')
    buscar(cod)
  }

  async function hacerAccion(fn, msg) {
    setAccion(true)
    try { await fn(reserva.id); onDone(msg) }
    catch (err) { setError(err.response?.data?.message ?? 'Error al procesar.') }
    finally { setAccion(false) }
  }

  const noches = reserva
    ? Math.ceil((new Date(reserva.fecha_salida) - new Date(reserva.fecha_entrada)) / 86400000)
    : 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={18} style={{ color: '#16A34A' }}/>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Check-in rápido</p>
              <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Escanea o escribe el código de reserva</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
            <X size={20}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          {[
            { id: 'camara', icon: Camera,   label: 'Escanear QR' },
            { id: 'manual', icon: Keyboard, label: 'Escribir código' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setModo(id); setReserva(null); setError('') }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                background: modo === id ? '#F0FDF4' : 'white',
                color: modo === id ? '#16A34A' : '#6B7280',
                borderBottom: modo === id ? '2px solid #16A34A' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15}/> {label}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Cámara */}
          {modo === 'camara' && (
            <QrCamScanner onResult={handleScan} onError={msg => setError(msg)} />
          )}

          {/* Manual */}
          {modo === 'manual' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                ref={inputRef}
                placeholder="Ej: AB12CD34"
                value={codigo}
                onChange={e => { setCodigo(e.target.value.toUpperCase()); setReserva(null); setError('') }}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.7rem 0.9rem', fontSize: '0.95rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              />
              <button onClick={() => buscar()} disabled={buscando || !codigo.trim()}
                style={{ padding: '0.7rem 1rem', borderRadius: 10, border: 'none', background: '#3D1A06', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.85rem', opacity: !codigo.trim() ? 0.5 : 1 }}>
                <Search size={15}/> {buscando ? '...' : 'Buscar'}
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          {buscando && (
            <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem', padding: '0.5rem' }}>
              Buscando reserva...
            </div>
          )}

          {/* Tarjeta de reserva */}
          {reserva && (
            <div style={{ border: `2px solid ${reserva.estado === 'confirmada' ? '#16A34A' : reserva.estado === 'checkin' ? '#7C3AED' : '#E5E7EB'}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: reserva.estado === 'confirmada' ? 'linear-gradient(135deg,#16A34A,#15803D)' : reserva.estado === 'checkin' ? 'linear-gradient(135deg,#7C3AED,#5B21B6)' : 'linear-gradient(135deg,#6B7280,#374151)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', marginBottom: '0.15rem' }}>Código</p>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.08em', fontFamily: 'monospace' }}>{reserva.codigo}</p>
                </div>
                <EstadoBadge estado={reserva.estado}/>
              </div>

              <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', color: '#374151' }}>
                  <User size={14} style={{ color: '#9CA3AF' }}/> <b>{reserva.cliente?.name}</b> <span style={{ color: '#9CA3AF' }}>({reserva.num_huespedes} pers.)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', color: '#374151' }}>
                  <MapPin size={14} style={{ color: '#9CA3AF' }}/> {reserva.sede?.nombre} — Hab. {reserva.habitacion?.numero}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', color: '#374151' }}>
                  <Calendar size={14} style={{ color: '#9CA3AF' }}/>
                  {new Date(reserva.fecha_entrada + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  {' → '}
                  {new Date(reserva.fecha_salida + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>({noches} noche{noches !== 1 ? 's' : ''})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem' }}>
                  <BedDouble size={14} style={{ color: '#9CA3AF' }}/> <b style={{ color: '#F5922E' }}>S/ {reserva.precio_total}</b>
                </div>
              </div>

              <div style={{ padding: '0 1.25rem 1.25rem' }}>
                {reserva.estado === 'confirmada' && (
                  <button onClick={() => hacerAccion(reservasApi.checkin, 'Check-in realizado exitosamente.')} disabled={accion}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#16A34A,#15803D)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: accion ? 0.7 : 1 }}>
                    <CheckCircle size={17}/> {accion ? 'Procesando...' : 'Hacer Check-in'}
                  </button>
                )}
                {reserva.estado === 'checkin' && (
                  <button onClick={() => hacerAccion(reservasApi.checkout, 'Check-out completado.')} disabled={accion}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: accion ? 0.7 : 1 }}>
                    <ArrowRight size={17}/> {accion ? 'Procesando...' : 'Hacer Check-out'}
                  </button>
                )}
                {reserva.estado === 'pendiente' && (
                  <div style={{ background: '#FEF9C3', borderRadius: 10, padding: '0.75rem', fontSize: '0.8rem', color: '#854D0E', textAlign: 'center' }}>
                    Esta reserva aún no ha sido confirmada ni completado el pago.
                  </div>
                )}
                {['finalizada','cancelada','expirada'].includes(reserva.estado) && (
                  <div style={{ background: '#F3F4F6', borderRadius: 10, padding: '0.75rem', fontSize: '0.8rem', color: '#6B7280', textAlign: 'center' }}>
                    Esta reserva ya está {ESTADO_STYLE[reserva.estado]?.label?.toLowerCase()}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReservasRecepcion() {
  const [reservas, setReservas] = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ estado: '', search: '', fecha_desde: '', fecha_hasta: '', page: 1 })
  const [accionando, setAccionando]   = useState(null)
  const [modalCheckin, setModalCI]    = useState(false)
  const [exporting, setExporting]     = useState(false)
  const toast   = useToast()
  const { confirm, dialog } = useConfirm()

  async function exportPdf() {
    setExporting(true)
    try {
      const params = {}
      if (filters.estado) params.estado = filters.estado
      const { data } = await axiosClient.get('/export/reservas', { params, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = 'reservas.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('No se pudo generar el PDF.') }
    finally { setExporting(false) }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: filters.page }
      if (filters.estado)      params.estado      = filters.estado
      if (filters.search)      params.search      = filters.search
      if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde
      if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta
      const { data } = await reservasApi.getAll(params)
      setReservas(data.data); setMeta(data)
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  async function accion(fn, id, successMsg) {
    setAccionando(id)
    try { await fn(id); load(); toast.success(successMsg ?? 'Acción completada.') }
    catch (err) { toast.error(err.response?.data?.message ?? 'Error al procesar.') }
    finally { setAccionando(null) }
  }

  const cell = { padding: '0.85rem 1rem', fontSize: '0.855rem', color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' }
  const head = { padding: '0.7rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      {dialog}
      {modalCheckin && (
        <ModalCheckin
          onClose={() => setModalCI(false)}
          onDone={(msg) => { setModalCI(false); load(); if (msg) toast.success(msg) }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111', marginBottom: '0.15rem' }}>Reservas</h1>
          <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Gestión y seguimiento de reservaciones</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportPdf} disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: 12, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            <FileDown size={16}/> {exporting ? 'Generando...' : 'PDF'}
          </button>
          <button onClick={() => setModalCI(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#16A34A,#15803D)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
            <QrCode size={16}/> Check-in Rápido
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Buscar código o cliente..." value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          style={{ flex: '1 1 180px', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none' }}/>
        <select value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value, page: 1 }))}
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none' }}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" value={filters.fecha_desde} onChange={e => setFilters(f => ({ ...f, fecha_desde: e.target.value, page: 1 }))}
          title="Entrada desde"
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none', color: filters.fecha_desde ? '#374151' : '#9CA3AF' }}/>
        <input type="date" value={filters.fecha_hasta} onChange={e => setFilters(f => ({ ...f, fecha_hasta: e.target.value, page: 1 }))}
          title="Entrada hasta"
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none', color: filters.fecha_hasta ? '#374151' : '#9CA3AF' }}/>
        {(filters.fecha_desde || filters.fecha_hasta) && (
          <button onClick={() => setFilters(f => ({ ...f, fecha_desde: '', fecha_hasta: '', page: 1 }))}
            style={{ padding: '0.55rem 0.85rem', borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            × Fechas
          </button>
        )}
      </div>

      <div className="table-scroll" style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
              <th style={head}>Código</th>
              <th style={head}>Cliente</th>
              <th style={head}>Sede / Hab.</th>
              <th style={head}>Entrada</th>
              <th style={head}>Salida</th>
              <th style={head}>Noches</th>
              <th style={head}>Total</th>
              <th style={head}>Estado</th>
              <th style={{ ...head, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ ...cell, textAlign: 'center', color: '#9CA3AF' }}>Cargando...</td></tr>
            ) : reservas.length === 0 ? (
              <tr><td colSpan={9} style={{ ...cell, textAlign: 'center', color: '#9CA3AF', padding: '2.5rem' }}>No hay reservas</td></tr>
            ) : reservas.map(r => {
              const noches = Math.ceil((new Date(r.fecha_salida) - new Date(r.fecha_entrada)) / 86400000)
              const busy   = accionando === r.id
              return (
                <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={cell}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3D1A06', fontSize: '0.8rem' }}>{r.codigo}</span></td>
                  <td style={cell}>
                    <div style={{ fontWeight: 600 }}>{r.cliente?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{r.cliente?.email}</div>
                  </td>
                  <td style={cell}>
                    <div style={{ fontWeight: 500 }}>{r.sede?.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Hab. {r.habitacion?.numero}</div>
                  </td>
                  <td style={cell}>{new Date(r.fecha_entrada).toLocaleDateString('es-PE')}</td>
                  <td style={cell}>{new Date(r.fecha_salida).toLocaleDateString('es-PE')}</td>
                  <td style={{ ...cell, textAlign: 'center' }}>{noches}</td>
                  <td style={cell}><b>S/ {r.precio_total}</b></td>
                  <td style={cell}><EstadoBadge estado={r.estado}/></td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {r.estado === 'pendiente' && (
                        <AccionBtn label={busy ? '...' : '✓ Confirmar'} color="white" bg="#2563EB" border="#2563EB"
                          onClick={() => accion(reservasApi.confirmar, r.id, 'Reserva confirmada.')}/>
                      )}
                      {r.estado === 'confirmada' && (
                        <AccionBtn label={busy ? '...' : '↓ Check-in'} color="white" bg="#059669" border="#059669"
                          onClick={() => accion(reservasApi.checkin, r.id, 'Check-in realizado.')}/>
                      )}
                      {r.estado === 'checkin' && (
                        <AccionBtn label={busy ? '...' : '↑ Check-out'} color="white" bg="#7C3AED" border="#7C3AED"
                          onClick={() => accion(reservasApi.checkout, r.id, 'Check-out completado.')}/>
                      )}
                      {['pendiente','confirmada','checkin'].includes(r.estado) && (
                        <AccionBtn label="Cancelar" color="#DC2626" bg="#FEF2F2" border="#FEE2E2"
                          onClick={async () => {
                            const ok = await confirm({ title: 'Cancelar reserva', message: `¿Estás seguro de cancelar la reserva ${r.codigo}?`, confirmLabel: 'Sí, cancelar', danger: true })
                            if (ok) accion(reservasApi.cancelar, r.id, 'Reserva cancelada.')
                          }}/>
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
            <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E5E7EB', cursor: 'pointer', fontWeight: filters.page === p ? 700 : 400, background: filters.page === p ? '#F5922E' : 'white', color: filters.page === p ? 'white' : '#374151' }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
