import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, CalendarDays, BedDouble,
  DollarSign, Percent, RefreshCw, Banknote, Smartphone, Building2, CreditCard,
} from 'lucide-react'
import { statsApi } from '../../api/stats'
import { useBreakpoint } from '../../hooks/useBreakpoint'

// ── Colores de estado reserva ────────────────────────────────
const ESTADO_COLOR = {
  pendiente:  '#F59E0B',
  confirmada: '#3B82F6',
  checkin:    '#8B5CF6',
  finalizada: '#10B981',
  cancelada:  '#EF4444',
  expirada:   '#9CA3AF',
}
const ESTADO_LABEL = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  checkin:    'En hospedaje',
  finalizada: 'Finalizada',
  cancelada:  'Cancelada',
  expirada:   'Expirada',
}

const METODO_ICON = { yape: Smartphone, plin: Smartphone, transferencia: Building2, efectivo: Banknote, tarjeta: CreditCard }
const METODO_COLOR = { yape: '#7C3AED', plin: '#0369A1', transferencia: '#0F766E', efectivo: '#15803D', tarjeta: '#1D4ED8' }

// ── KPI Card ─────────────────────────────────────────────────
function KpiCard({ label, value, prev, prefix, suffix, icon: Icon, color, loading }) {
  const diff = prev !== undefined && prev !== null ? value - prev : null
  const pct  = prev > 0 ? Math.round((diff / prev) * 100) : null
  const up    = diff >= 0
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} style={{ color }}/>
        </div>
      </div>
      {loading ? (
        <div style={{ width: 80, height: 32, background: '#F3F4F6', borderRadius: 8 }}/>
      ) : (
        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>
          {prefix}{typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value}{suffix}
        </p>
      )}
      {diff !== null && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: '0.5rem' }}>
          {up ? <TrendingUp size={13} style={{ color: '#16A34A' }}/> : <TrendingDown size={13} style={{ color: '#DC2626' }}/>}
          <span style={{ fontSize: '0.75rem', color: up ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
            {up ? '+' : ''}{pct !== null ? `${pct}%` : ''} vs mes anterior
          </span>
        </div>
      )}
    </div>
  )
}

// ── Badge estado reserva ─────────────────────────────────────
function EstadoBadge({ estado }) {
  const color = ESTADO_COLOR[estado] ?? '#9CA3AF'
  return (
    <span style={{ background: color + '18', color, fontSize: '0.7rem', fontWeight: 700, padding: '3px 9px', borderRadius: 9999 }}>
      {ESTADO_LABEL[estado] ?? estado}
    </span>
  )
}

// ── Tooltip personalizado para barras ────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 10, padding: '0.6rem 1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.2rem' }}>{label}</p>
      <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F5922E' }}>S/ {Number(payload[0]?.value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
    </div>
  )
}

export default function DashboardGerencial() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const { isMobile }          = useBreakpoint()

  function load() {
    setLoading(true)
    statsApi.dashboard()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const kpis = data?.kpis ?? {}
  const hoy  = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div style={{ maxWidth: 1200 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>Dashboard Gerencial</h1>
          <p style={{ fontSize: '0.82rem', color: '#9CA3AF', textTransform: 'capitalize' }}>{hoy}</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1rem', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>
          <RefreshCw size={14}/> Actualizar
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard label="Ingresos del mes"    value={kpis.ingresos_mes}          prev={kpis.ingresos_mes_anterior} prefix="S/ " icon={DollarSign}  color="#F5922E" loading={loading}/>
        <KpiCard label="Ingresos de hoy"     value={kpis.ingresos_hoy}          prefix="S/ "                                    icon={TrendingUp}  color="#10B981" loading={loading}/>
        <KpiCard label="Reservas del mes"    value={kpis.reservas_mes}           prev={kpis.reservas_mes_anterior}               icon={CalendarDays} color="#3B82F6" loading={loading}/>
        <KpiCard label="Tasa de ocupación"   value={kpis.tasa_ocupacion}         suffix="%"                                      icon={Percent}     color="#8B5CF6" loading={loading}/>
        <KpiCard label="Total habitaciones"  value={kpis.total_habitaciones}                                                     icon={BedDouble}   color="#6B7280" loading={loading}/>
      </div>

      {/* ── Gráficas fila 1 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Ingresos últimos 6 meses */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Ingresos mensuales (últimos 6 meses)</p>
          {loading ? (
            <div style={{ height: 220, background: '#F9FAFB', borderRadius: 12 }}/>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.ingresos_mensuales ?? []} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false}/>
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `S/${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="monto" radius={[6, 6, 0, 0]} fill="url(#barGrad)" maxBarSize={48}/>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F5922E"/>
                    <stop offset="100%" stopColor="#E07820"/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Reservas por estado — donut */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>Reservas por estado</p>
          {loading ? (
            <div style={{ height: 220, background: '#F9FAFB', borderRadius: 12 }}/>
          ) : !data?.reservas_por_estado?.length ? (
            <p style={{ color: '#9CA3AF', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>Sin datos aún</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.reservas_por_estado}
                  dataKey="total"
                  nameKey="estado"
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}>
                  {data.reservas_por_estado.map(entry => (
                    <Cell key={entry.estado} fill={ESTADO_COLOR[entry.estado] ?? '#9CA3AF'}/>
                  ))}
                </Pie>
                <Legend
                  iconType="circle" iconSize={8}
                  formatter={v => <span style={{ fontSize: '0.72rem', color: '#374151' }}>{ESTADO_LABEL[v] ?? v}</span>}
                />
                <Tooltip formatter={(v, n) => [v, ESTADO_LABEL[n] ?? n]}/>
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Fila 2: Ocupación sedes + Métodos de pago ── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Ocupación por sede */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Ocupación por sede</p>
          {loading ? (
            <div style={{ height: 120, background: '#F9FAFB', borderRadius: 12 }}/>
          ) : (data?.ocupacion_sedes ?? []).map(sede => (
            <div key={sede.id} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151' }}>{sede.nombre}</span>
                <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{sede.ocupadas}/{sede.total} · <b style={{ color: '#F5922E' }}>{sede.tasa}%</b></span>
              </div>
              <div style={{ height: 8, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${sede.tasa}%`, background: 'linear-gradient(90deg, #F5922E, #E07820)', borderRadius: 99, transition: 'width 0.8s ease' }}/>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#16A34A' }}>{sede.disponibles} disponibles</span>
                <span style={{ fontSize: '0.7rem', color: '#3B82F6' }}>{sede.reservadas} reservadas</span>
              </div>
            </div>
          ))}
        </div>

        {/* Métodos de pago del mes */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '1rem' }}>Métodos de pago — este mes</p>
          {loading ? (
            <div style={{ height: 120, background: '#F9FAFB', borderRadius: 12 }}/>
          ) : !(data?.metodos_pago?.length) ? (
            <p style={{ color: '#9CA3AF', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>Sin pagos este mes aún</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.metodos_pago.map(m => {
                const Icon  = METODO_ICON[m.metodo] ?? Banknote
                const color = METODO_COLOR[m.metodo] ?? '#6B7280'
                return (
                  <div key={m.metodo} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} style={{ color }}/>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', textTransform: 'capitalize' }}>{m.metodo}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#F5922E' }}>S/ {Number(m.monto).toFixed(2)}</span>
                      </div>
                      <p style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>{m.total} pago{m.total !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Últimas reservas ── */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>Últimas reservas</p>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF' }}>Cargando...</div>
        ) : (
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                  {['Código', 'Cliente', 'Hab.', 'Sede', 'Entrada', 'Estado', 'Total'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.ultimas_reservas ?? []).map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < (data.ultimas_reservas.length - 1) ? '1px solid #F9FAFB' : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#3D1A06' }}>{r.codigo}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#374151' }}>{r.cliente}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6B7280' }}>#{r.habitacion}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6B7280' }}>{r.sede}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#6B7280', whiteSpace: 'nowrap' }}>
                      {new Date(r.fecha_entrada + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}><EstadoBadge estado={r.estado}/></td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#F5922E' }}>S/ {Number(r.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
