import { useState, useEffect, useCallback } from 'react'
import { Search, CheckCircle, XCircle, RefreshCw, Banknote, Smartphone, Building2, CreditCard, Clock, TrendingUp, FileDown, Printer, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { pagosApi } from '../../api/pagos'
import { useToast } from '../../context/ToastContext'
import axiosClient from '../../api/axiosClient'
import { todayLocal, startOfWeekLocal, startOfMonthLocal } from '../../utils/date'

const PERIODOS = [
  { id: 'hoy',    label: 'Hoy',         desde: () => todayLocal(),       hasta: () => todayLocal() },
  { id: 'semana', label: 'Esta semana', desde: () => startOfWeekLocal(), hasta: () => todayLocal() },
  { id: 'mes',    label: 'Este mes',    desde: () => startOfMonthLocal(), hasta: () => todayLocal() },
  { id: 'todo',   label: 'Todo',        desde: () => '',                 hasta: () => '' },
]

// Ventana de páginas a mostrar alrededor de la actual, con la primera/última fija
// y "···" para los huecos — evita renderizar decenas de botones cuando hay muchas páginas.
function pageWindow(current, last, span = 1) {
  const pages = new Set([1, last])
  for (let p = current - span; p <= current + span; p++) {
    if (p >= 1 && p <= last) pages.add(p)
  }
  const sorted = [...pages].sort((a, b) => a - b)
  const out = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null)
    out.push(p)
  })
  return out
}

const ESTADO_BADGE = {
  pendiente:  { bg: '#FEF9C3', color: '#854D0E', label: 'Pendiente' },
  verificado: { bg: '#DCFCE7', color: '#15803D', label: 'Verificado' },
  rechazado:  { bg: '#FEE2E2', color: '#DC2626', label: 'Rechazado' },
  devuelto:   { bg: '#E0E7FF', color: '#4338CA', label: 'Devuelto'  },
}

const METODO_CONFIG = {
  yape:         { label: 'Yape',         icon: Smartphone, color: '#7C3AED' },
  plin:         { label: 'Plin',         icon: Smartphone, color: '#0369A1' },
  transferencia:{ label: 'Transferencia',icon: Building2,  color: '#0F766E' },
  efectivo:     { label: 'Efectivo',     icon: Banknote,   color: '#15803D' },
  tarjeta:      { label: 'Tarjeta',      icon: CreditCard, color: '#1D4ED8' },
}

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} style={{ color }}/>
      </div>
      <div>
        <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>{value}</p>
        {sub && <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.1rem' }}>{sub}</p>}
      </div>
    </div>
  )
}

function Badge({ estado }) {
  const cfg = ESTADO_BADGE[estado] ?? { bg: '#F3F4F6', color: '#6B7280', label: estado }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
      {cfg.label}
    </span>
  )
}

function MetodoChip({ metodo }) {
  const cfg = METODO_CONFIG[metodo] ?? { label: metodo, icon: Banknote, color: '#6B7280' }
  const Icon = cfg.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, color: cfg.color }}>
      <Icon size={13}/> {cfg.label}
    </span>
  )
}

export default function Pagos() {
  const [pagos, setPagos]       = useState([])
  const [resumen, setResumen]   = useState(null)
  const [meta,    setMeta]      = useState(null)
  const [loading, setLoading]   = useState(true)
  const [actionId, setActionId] = useState(null)
  const [filters, setFilters]   = useState({ estado: '', metodo_pago: '', search: '', fecha_desde: '', fecha_hasta: '', page: 1 })
  const [periodo, setPeriodo]   = useState('todo')
  const [exporting, setExporting] = useState(false)
  const toast = useToast()

  function aplicarPeriodo(id) {
    const p = PERIODOS.find(x => x.id === id)
    if (!p) return
    setPeriodo(id)
    setFilters(f => ({ ...f, fecha_desde: p.desde(), fecha_hasta: p.hasta(), page: 1 }))
  }

  async function exportPdf() {
    setExporting(true)
    try {
      const params = {}
      if (filters.estado)      params.estado      = filters.estado
      if (filters.metodo_pago) params.metodo_pago = filters.metodo_pago
      if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde
      if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta
      const { data } = await axiosClient.get('/export/pagos', { params, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = 'pagos.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('No se pudo generar el PDF.') }
    finally { setExporting(false) }
  }

  const load = useCallback(() => {
    setLoading(true)
    const params = { page: filters.page }
    if (filters.estado)      params.estado      = filters.estado
    if (filters.metodo_pago) params.metodo_pago = filters.metodo_pago
    if (filters.search)      params.search      = filters.search
    if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde
    if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta
    pagosApi.getAll(params)
      .then(r => { setPagos(r.data.pagos.data); setResumen(r.data.resumen); setMeta(r.data.pagos) })
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, [load])

  async function accion(tipo, pagoId) {
    setActionId(pagoId)
    try {
      if (tipo === 'verificar') { await pagosApi.verificar(pagoId); toast.success('Pago verificado correctamente.') }
      else                      { await pagosApi.rechazar(pagoId);  toast.warning('Pago rechazado.') }
      load()
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Error al procesar el pago.')
    } finally {
      setActionId(null)
    }
  }

  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v, page: 1 })) }

  function abrirRecibo(codigo, formato) {
    if (formato === '80') {
      window.open(`${window.location.origin}/ticket/${codigo}`, '_blank')
    } else {
      window.open(`${window.location.origin}/recibo/${codigo}?f=${formato}`, '_blank')
    }
  }

  function enviarWhatsapp(pago) {
    const url = `${window.location.origin}/recibo/${pago.reserva.codigo}`
    const cliente = pago.reserva?.cliente?.name ?? ''
    const monto   = `S/ ${Number(pago.monto).toFixed(2)}`
    const msg = `Hola${cliente ? ` ${cliente}` : ''}, aquí tienes tu recibo de pago del Hotel Brisas de Mayo:\n\n🧾 Código: ${pago.reserva.codigo}\n💰 Monto: ${monto}\n\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const inp = { border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.55rem 0.9rem', fontSize: '0.85rem', outline: 'none', background: 'white' }

  return (
    <div>
      {/* Stats */}
      {resumen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <StatCard label="Total pagos"  value={resumen.total}      icon={TrendingUp}   color="#6B7280"/>
          <StatCard label="Pendientes"   value={resumen.pendiente}  icon={Clock}        color="#D97706"/>
          <StatCard label="Verificados"  value={resumen.verificado} icon={CheckCircle}  color="#16A34A"/>
          <StatCard label="Rechazados"   value={resumen.rechazado}  icon={XCircle}      color="#DC2626"/>
          <StatCard label="Monto verificado" value={`S/ ${Number(resumen.monto_total).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`} icon={Banknote} color="#F5922E" sub="pagos verificados"/>
        </div>
      )}

      {/* Período rápido */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
        {PERIODOS.map(p => (
          <button key={p.id} onClick={() => aplicarPeriodo(p.id)}
            style={{
              padding: '0.45rem 1rem', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              border: periodo === p.id ? '1.5px solid #F5922E' : '1.5px solid #E5E7EB',
              background: periodo === p.id ? '#FFF7ED' : 'white',
              color: periodo === p.id ? '#C2410C' : '#6B7280',
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}/>
          <input
            placeholder="Buscar por código o cliente..."
            value={filters.search}
            onChange={e => setFilter('search', e.target.value)}
            style={{ ...inp, width: '100%', boxSizing: 'border-box', paddingLeft: 32 }}
          />
        </div>

        <input type="date" title="Desde" style={inp} value={filters.fecha_desde}
          onChange={e => { setPeriodo(''); setFilter('fecha_desde', e.target.value) }}/>
        <input type="date" title="Hasta" style={inp} value={filters.fecha_hasta}
          onChange={e => { setPeriodo(''); setFilter('fecha_hasta', e.target.value) }}/>

        <select style={inp} value={filters.estado} onChange={e => setFilter('estado', e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="verificado">Verificado</option>
          <option value="rechazado">Rechazado</option>
          <option value="devuelto">Devuelto</option>
        </select>

        <select style={inp} value={filters.metodo_pago} onChange={e => setFilter('metodo_pago', e.target.value)}>
          <option value="">Todos los métodos</option>
          <option value="yape">Yape</option>
          <option value="plin">Plin</option>
          <option value="transferencia">Transferencia</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
        </select>

        <button onClick={load} style={{ ...inp, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
          <RefreshCw size={14}/> Actualizar
        </button>

        <button onClick={exportPdf} disabled={exporting} style={{ ...inp, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#15803D', borderColor: '#BBF7D0', background: '#F0FDF4', fontWeight: 600 }}>
          <FileDown size={14}/> {exporting ? 'Generando...' : 'Exportar PDF'}
        </button>

        {(filters.estado || filters.metodo_pago || filters.search || filters.fecha_desde || filters.fecha_hasta) && (
          <button onClick={() => { setPeriodo('todo'); setFilters({ estado: '', metodo_pago: '', search: '', fecha_desde: '', fecha_hasta: '', page: 1 }) }}
            style={{ padding: '0.55rem 0.9rem', borderRadius: 10, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>Cargando pagos...</div>
        ) : pagos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</p>
            <p style={{ color: '#6B7280', fontWeight: 600 }}>No hay pagos que coincidan</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F3F4F6', background: '#F9FAFB' }}>
                  {['Código', 'Cliente', 'Habitación', 'Sede', 'Monto', 'Método', 'Estado', 'Fecha', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago, idx) => (
                  <tr key={pago.id} style={{ borderBottom: idx < pagos.length - 1 ? '1px solid #F9FAFB' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#3D1A06' }}>
                      {pago.reserva?.codigo ?? '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <p style={{ fontWeight: 600, color: '#111827' }}>{pago.reserva?.cliente?.name ?? '—'}</p>
                      <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{pago.reserva?.cliente?.email}</p>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#374151' }}>
                      Hab. {pago.reserva?.habitacion?.numero}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#374151' }}>
                      {pago.reserva?.sede?.nombre ?? '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#F5922E' }}>
                      S/ {Number(pago.monto).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <MetodoChip metodo={pago.metodo_pago}/>
                      {pago.referencia && (
                        <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.15rem' }}>Ref: {pago.referencia}</p>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <Badge estado={pago.estado}/>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {pago.fecha_pago
                        ? new Date(pago.fecha_pago).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {pago.estado === 'pendiente' && (
                          <>
                            <button
                              onClick={() => accion('verificar', pago.id)}
                              disabled={actionId === pago.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: 'none', background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.73rem', cursor: 'pointer', opacity: actionId === pago.id ? 0.6 : 1 }}>
                              <CheckCircle size={12}/> Verificar
                            </button>
                            <button
                              onClick={() => accion('rechazar', pago.id)}
                              disabled={actionId === pago.id}
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: 'none', background: '#FEE2E2', color: '#DC2626', fontWeight: 700, fontSize: '0.73rem', cursor: 'pointer', opacity: actionId === pago.id ? 0.6 : 1 }}>
                              <XCircle size={12}/> Rechazar
                            </button>
                          </>
                        )}
                        {pago.reserva?.codigo && (
                          <>
                            <button
                              onClick={() => abrirRecibo(pago.reserva.codigo, '80')}
                              title="Recibo 80 mm"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: 'none', background: '#F1F5F9', color: '#334155', fontWeight: 700, fontSize: '0.73rem', cursor: 'pointer' }}>
                              <Printer size={12}/> 80mm
                            </button>
                            <button
                              onClick={() => abrirRecibo(pago.reserva.codigo, 'a4')}
                              title="Recibo A4"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: 'none', background: '#EDE9FE', color: '#6D28D9', fontWeight: 700, fontSize: '0.73rem', cursor: 'pointer' }}>
                              <Printer size={12}/> A4
                            </button>
                            <button
                              onClick={() => enviarWhatsapp(pago)}
                              title="Enviar por WhatsApp"
                              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: 'none', background: '#DCFCE7', color: '#16A34A', fontWeight: 700, fontSize: '0.73rem', cursor: 'pointer' }}>
                              <MessageCircle size={12}/> WA
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {meta && meta.total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', marginTop: '1.25rem' }}>
          {meta.last_page > 1 && (
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => setFilters(f => ({ ...f, page: Math.max(1, f.page - 1) }))} disabled={filters.page <= 1}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E5E7EB', cursor: filters.page <= 1 ? 'not-allowed' : 'pointer', opacity: filters.page <= 1 ? 0.4 : 1, background: 'white', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={15}/>
              </button>
              {pageWindow(filters.page, meta.last_page).map((p, i) => p === null ? (
                <span key={`gap-${i}`} style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB' }}>···</span>
              ) : (
                <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
                  style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E5E7EB', cursor: 'pointer', fontWeight: filters.page === p ? 700 : 400, background: filters.page === p ? '#F5922E' : 'white', color: filters.page === p ? 'white' : '#374151', fontSize: '0.85rem' }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setFilters(f => ({ ...f, page: Math.min(meta.last_page, f.page + 1) }))} disabled={filters.page >= meta.last_page}
                style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E5E7EB', cursor: filters.page >= meta.last_page ? 'not-allowed' : 'pointer', opacity: filters.page >= meta.last_page ? 0.4 : 1, background: 'white', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={15}/>
              </button>
            </div>
          )}
          <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>
            Mostrando {meta.from}–{meta.to} de {meta.total} pagos
          </p>
        </div>
      )}
    </div>
  )
}
