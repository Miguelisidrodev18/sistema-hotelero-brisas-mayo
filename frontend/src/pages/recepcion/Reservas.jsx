import { useState, useEffect, useCallback } from 'react'
import { reservasApi } from '../../api/reservas'

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

export default function ReservasRecepcion() {
  const [reservas, setReservas] = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ estado: '', search: '', page: 1 })
  const [accionando, setAccionando] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: filters.page }
      if (filters.estado) params.estado = filters.estado
      if (filters.search) params.search = filters.search
      const { data } = await reservasApi.getAll(params)
      setReservas(data.data); setMeta(data)
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  async function accion(fn, id) {
    setAccionando(id)
    try { await fn(id); load() }
    catch (err) { alert(err.response?.data?.message ?? 'Error al procesar.') }
    finally { setAccionando(null) }
  }

  const cell = { padding: '0.85rem 1rem', fontSize: '0.855rem', color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' }
  const head = { padding: '0.7rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111', marginBottom: '0.15rem' }}>Reservas</h1>
        <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Gestión y seguimiento de reservaciones</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input placeholder="Buscar código o cliente..." value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          style={{ flex: 1, minWidth: 200, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none' }}/>
        <select value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value, page: 1 }))}
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none' }}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'auto' }}>
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
                          onClick={() => accion(reservasApi.confirmar, r.id)}/>
                      )}
                      {r.estado === 'confirmada' && (
                        <AccionBtn label={busy ? '...' : '↓ Check-in'} color="white" bg="#059669" border="#059669"
                          onClick={() => accion(reservasApi.checkin, r.id)}/>
                      )}
                      {r.estado === 'checkin' && (
                        <AccionBtn label={busy ? '...' : '↑ Check-out'} color="white" bg="#7C3AED" border="#7C3AED"
                          onClick={() => accion(reservasApi.checkout, r.id)}/>
                      )}
                      {['pendiente','confirmada','checkin'].includes(r.estado) && (
                        <AccionBtn label="Cancelar" color="#DC2626" bg="#FEF2F2" border="#FEE2E2"
                          onClick={() => { if(confirm('¿Cancelar esta reserva?')) accion(reservasApi.cancelar, r.id) }}/>
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
