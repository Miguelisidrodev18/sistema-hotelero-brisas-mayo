import { useState, useEffect, useRef, useCallback } from 'react'
import { ChefHat, Clock, CheckCircle, Package, UtensilsCrossed, RefreshCw } from 'lucide-react'
import { restauranteApi } from '../../api/restaurante'
import { imprimirThermalTicket } from '../../utils/printTicket'

const COLS = [
  { estado: 'pendiente',  label: 'Nuevos',     bg: '#FFFBEB', border: '#FCD34D', badge: '#F59E0B', icon: Clock },
  { estado: 'preparando', label: 'Preparando', bg: '#EFF6FF', border: '#93C5FD', badge: '#3B82F6', icon: ChefHat },
  { estado: 'listo',      label: 'Listos',     bg: '#F0FDF4', border: '#86EFAC', badge: '#22C55E', icon: CheckCircle },
]

function formatHora(ts) {
  return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}

function PedidoCard({ pedido, onAction }) {
  const [actioning, setActioning] = useState(false)

  async function action(fn) {
    setActioning(true)
    try { await fn(pedido.id) } catch {}
    finally { setActioning(false) }
  }

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '1rem', marginBottom: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#3D1A06', letterSpacing: '0.03em' }}>#{pedido.codigo}</span>
        <span style={{ fontSize: '0.72rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11}/> {formatHora(pedido.created_at)}
        </span>
      </div>

      {/* Items */}
      <div style={{ marginBottom: '0.75rem', borderBottom: '1px solid #F3F4F6', paddingBottom: '0.75rem' }}>
        {pedido.items?.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: '0.3rem' }}>
            <span style={{ fontWeight: 700, color: '#F5922E', fontSize: '0.85rem', minWidth: 24 }}>{item.cantidad}×</span>
            <div>
              <p style={{ fontWeight: 600, color: '#111827', fontSize: '0.85rem', margin: 0 }}>{item.plato?.nombre}</p>
              {item.notas && <p style={{ fontSize: '0.72rem', color: '#6B7280', margin: '1px 0 0' }}>↳ {item.notas}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Notas del pedido */}
      {pedido.notas && (
        <div style={{ background: '#FFFBEB', borderRadius: 8, padding: '0.4rem 0.6rem', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#92400E' }}>
          📝 {pedido.notas}
        </div>
      )}

      {/* Total + cliente */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{pedido.user?.name ?? 'Cliente anónimo'}</span>
        <span style={{ fontWeight: 800, color: '#F5922E', fontSize: '0.9rem' }}>S/ {Number(pedido.total).toFixed(2)}</span>
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {pedido.estado === 'pendiente' && (
          <button onClick={() => action(onAction.preparando)} disabled={actioning}
            style={{ flex: 1, padding: '7px 0', borderRadius: 9, border: 'none', background: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', opacity: actioning ? 0.6 : 1 }}>
            🍳 Preparar
          </button>
        )}
        {pedido.estado === 'preparando' && (
          <button onClick={() => action(onAction.listo)} disabled={actioning}
            style={{ flex: 1, padding: '7px 0', borderRadius: 9, border: 'none', background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', opacity: actioning ? 0.6 : 1 }}>
            ✅ Listo
          </button>
        )}
        {pedido.estado === 'listo' && (
          <button onClick={() => action(onAction.entregado)} disabled={actioning}
            style={{ flex: 1, padding: '7px 0', borderRadius: 9, border: 'none', background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', opacity: actioning ? 0.6 : 1 }}>
            📦 Entregado
          </button>
        )}
      </div>
    </div>
  )
}

// Contenido del ticket para impresión térmica 80mm
function buildTicket(pedido) {
  const lines = [
    'BRISAS DE MAYO — RESTAURANTE',
    '================================',
    `PEDIDO #${pedido.codigo}`,
    `Hora: ${formatHora(pedido.created_at)}`,
    '--------------------------------',
    ...(pedido.items?.map(it => {
      const linea = `${it.cantidad}x  ${it.plato?.nombre}`
      const precio = `S/${Number(it.subtotal).toFixed(2)}`
      const pad = Math.max(1, 32 - linea.length - precio.length)
      const row = linea + ' '.repeat(pad) + precio
      const nota = it.notas ? `    (${it.notas})` : ''
      return nota ? row + '\n' + nota : row
    }) ?? []),
    '--------------------------------',
    (() => {
      const label = 'TOTAL'
      const val = `S/${Number(pedido.total).toFixed(2)}`
      return label + ' '.repeat(Math.max(1, 32 - label.length - val.length)) + val
    })(),
    '--------------------------------',
    pedido.notas ? `NOTAS: ${pedido.notas}` : '',
    '================================',
    '',
  ].filter(l => l !== null)
  return lines.join('\n')
}

export default function Cocina() {
  const [pedidos, setPedidos]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [lastId,  setLastId]    = useState(0)
  const [newAlert, setNewAlert] = useState(false)
  const ticketRef               = useRef(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await restauranteApi.activos()
      setPedidos(data)
      if (data.length > 0) {
        const maxId = Math.max(...data.map(p => p.id))
        setLastId(prev => {
          if (prev > 0 && maxId > prev) {
            // Nuevo pedido detectado — alerta + imprimir
            setNewAlert(true)
            setTimeout(() => setNewAlert(false), 5000)
            const nuevo = data.find(p => p.id === maxId)
            if (nuevo && ticketRef.current) {
              ticketRef.current.innerText = buildTicket(nuevo)
              imprimirThermalTicket()
            }
          }
          return maxId
        })
      }
    } catch {}
    finally { if (!silent) setLoading(false) }
  }, [])

  // Carga inicial
  useEffect(() => { load() }, [load])

  // Polling cada 8 segundos
  useEffect(() => {
    const interval = setInterval(() => load(true), 8000)
    return () => clearInterval(interval)
  }, [load])

  const actions = {
    preparando: async (id) => { await restauranteApi.preparando(id); load(true) },
    listo:      async (id) => { await restauranteApi.listo(id);      load(true) },
    entregado:  async (id) => { await restauranteApi.entregado(id);  load(true) },
  }

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ChefHat size={22} style={{ color: '#F5922E' }}/>
          <div>
            <h1 className="section-title">Panel de Cocina</h1>
            <p className="section-subtitle">Pedidos activos — actualización automática cada 8 s</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {newAlert && (
            <span style={{ background: '#DC2626', color: 'white', fontSize: '0.78rem', fontWeight: 700, padding: '5px 12px', borderRadius: 9999, animation: 'pulse-soft 1s ease-in-out infinite' }}>
              🔔 ¡Nuevo pedido!
            </span>
          )}
          <button onClick={() => load()} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={15} style={{ color: '#6B7280' }}/>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>Cargando pedidos...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', alignItems: 'start' }}>
          {COLS.map(col => {
            const ColIcon = col.icon
            const items = pedidos.filter(p => p.estado === col.estado)
            return (
              <div key={col.estado} style={{ background: col.bg, borderRadius: 16, border: `1.5px solid ${col.border}`, padding: '1rem', minHeight: 200 }}>
                {/* Col header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                  <ColIcon size={16} style={{ color: col.badge }}/>
                  <span style={{ fontWeight: 800, color: '#111827', fontSize: '0.9rem' }}>{col.label}</span>
                  <span style={{ marginLeft: 'auto', background: col.badge, color: 'white', fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px', borderRadius: 9999 }}>
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9CA3AF' }}>
                    <UtensilsCrossed size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }}/>
                    <p style={{ fontSize: '0.8rem' }}>Sin pedidos</p>
                  </div>
                ) : items.map(p => (
                  <PedidoCard key={p.id} pedido={p} onAction={actions}/>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Ticket térmico oculto para impresión */}
      <div id="thermal-ticket" ref={ticketRef}/>
    </div>
  )
}
