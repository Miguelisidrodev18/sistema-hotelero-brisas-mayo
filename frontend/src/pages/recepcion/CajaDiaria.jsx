import { useState, useEffect, useCallback } from 'react'
import { recepcionApi } from '../../api/recepcion'
import { Banknote, Smartphone, Building2, CreditCard, TrendingUp, Calendar, RefreshCw } from 'lucide-react'
import { todayLocal } from '../../utils/date'

const METODO_CONFIG = {
  yape:         { label: 'Yape',          icon: Smartphone, color: '#7C3AED', bg: '#EDE9FE' },
  plin:         { label: 'Plin',          icon: Smartphone, color: '#0369A1', bg: '#DBEAFE' },
  transferencia:{ label: 'Transferencia', icon: Building2,  color: '#0F766E', bg: '#CCFBF1' },
  efectivo:     { label: 'Efectivo',      icon: Banknote,   color: '#15803D', bg: '#DCFCE7' },
  tarjeta:      { label: 'Tarjeta/Culqi', icon: CreditCard, color: '#1D4ED8', bg: '#DBEAFE' },
}

function MetodoCard({ metodo, datos }) {
  const cfg = METODO_CONFIG[metodo] ?? { label: metodo, icon: Banknote, color: '#6B7280', bg: '#F3F4F6' }
  const Icon = cfg.icon
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} style={{ color: cfg.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</p>
        <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>
          S/ {Number(datos.total).toFixed(2)}
        </p>
        <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.1rem' }}>
          {datos.cantidad} {datos.cantidad === 1 ? 'pago' : 'pagos'}
        </p>
      </div>
    </div>
  )
}

function PagoRow({ pago }) {
  const cfg = METODO_CONFIG[pago.metodo_pago] ?? { label: pago.metodo_pago, icon: Banknote, color: '#6B7280' }
  const Icon = cfg.icon
  return (
    <tr style={{ borderBottom: '1px solid #F3F4F6' }}>
      <td style={{ padding: '0.65rem 1rem', fontWeight: 600, fontSize: '0.85rem' }}>
        {pago.reserva?.codigo ?? '—'}
      </td>
      <td style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#374151' }}>
        {pago.cliente?.name ?? '—'}
      </td>
      <td style={{ padding: '0.65rem 1rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', fontWeight: 600, color: cfg.color }}>
          <Icon size={13} /> {cfg.label}
        </span>
      </td>
      <td style={{ padding: '0.65rem 1rem', fontSize: '0.82rem', color: '#6B7280' }}>
        {pago.referencia ?? '—'}
      </td>
      <td style={{ padding: '0.65rem 1rem', fontWeight: 700, color: '#F5922E', textAlign: 'right' }}>
        S/ {Number(pago.monto).toFixed(2)}
      </td>
      <td style={{ padding: '0.65rem 1rem', fontSize: '0.75rem', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
        {pago.fecha_pago ? new Date(pago.fecha_pago).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : '—'}
      </td>
    </tr>
  )
}

export default function CajaDiaria() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [fecha,   setFecha]   = useState(() => todayLocal())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: res } = await recepcionApi.cajaDiaria(fecha)
      setData(res)
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [fecha])

  useEffect(() => { load() }, [load])

  const total = data?.total_general ?? 0
  const porMetodo = data?.total_por_metodo ?? {}
  const pagos = data?.pagos ?? []

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Caja diaria</h1>
          <p className="section-subtitle">Ingresos verificados del día por método de pago</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '0 12px', height: 38 }}>
            <Calendar size={14} style={{ color: '#9CA3AF' }} />
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: '0.875rem', color: '#374151' }}
            />
          </div>
          <button onClick={load} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={15} style={{ color: '#6B7280' }} />
          </button>
        </div>
      </div>

      {/* Total general */}
      <div style={{ background: 'linear-gradient(135deg,#3D1A06,#7B4019)', borderRadius: 16, padding: '1.5rem 2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total ingresado</p>
          <p style={{ color: 'white', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.1, marginTop: 4 }}>
            S/ {Number(total).toFixed(2)}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginTop: 4 }}>
            {pagos.length} {pagos.length === 1 ? 'pago verificado' : 'pagos verificados'} — {new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <TrendingUp size={48} style={{ color: 'rgba(255,255,255,0.15)' }} />
      </div>

      {/* Cards por método */}
      {Object.keys(porMetodo).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {Object.entries(porMetodo).map(([metodo, datos]) => (
            <MetodoCard key={metodo} metodo={metodo} datos={datos} />
          ))}
        </div>
      )}

      {/* Detalle de pagos */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1.25rem', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>Detalle de pagos</span>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2.5rem' }}>Cargando...</div>
        ) : pagos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>💳</p>
            <p style={{ fontWeight: 600, color: '#374151' }}>Sin ingresos este día</p>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: 4 }}>No hay pagos verificados para la fecha seleccionada</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {['Reserva', 'Cliente', 'Método', 'Referencia', 'Monto', 'Hora'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: h === 'Monto' ? 'right' : 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagos.map(p => <PagoRow key={p.id} pago={p} />)}
              </tbody>
              <tfoot>
                <tr style={{ background: '#F9FAFB' }}>
                  <td colSpan={4} style={{ padding: '0.75rem 1rem', fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>TOTAL</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#F5922E', textAlign: 'right', fontSize: '0.95rem' }}>
                    S/ {Number(total).toFixed(2)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
