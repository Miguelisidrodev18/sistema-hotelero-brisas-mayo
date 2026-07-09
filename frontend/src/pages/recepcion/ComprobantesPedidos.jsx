import { useState, useEffect, useRef, useCallback } from 'react'
import { Receipt, Clock, RefreshCw, Printer, CreditCard, Banknote } from 'lucide-react'
import { restauranteApi } from '../../api/restaurante'
import { imprimirThermalTicket } from '../../utils/printTicket'

const METODO_LABEL = { tarjeta: 'Tarjeta', efectivo: 'Efectivo' }
const ESTADO_LABEL = { pendiente: 'Nuevo', preparando: 'Preparando', listo: 'Listo', entregado: 'Entregado' }

function formatHora(ts) {
  return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
}
function formatFecha(ts) {
  return new Date(ts).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Comprobante de pago para impresión térmica 80mm — copia para caja/admin
// (el encabezado con el logo se arma aparte, en imprimirComprobante)
function buildComprobante(pedido) {
  const lines = [
    '================================',
    `PEDIDO #${pedido.codigo}`,
    `Fecha: ${formatFecha(pedido.created_at)}  ${formatHora(pedido.created_at)}`,
    '--------------------------------',
    ...(pedido.items?.map(it => {
      const linea = `${it.cantidad}x  ${it.plato?.nombre}`
      const precio = `S/${Number(it.subtotal).toFixed(2)}`
      const pad = Math.max(1, 32 - linea.length - precio.length)
      return linea + ' '.repeat(pad) + precio
    }) ?? []),
    '--------------------------------',
    (() => {
      const label = 'TOTAL'
      const val = `S/${Number(pedido.total).toFixed(2)}`
      return label + ' '.repeat(Math.max(1, 32 - label.length - val.length)) + val
    })(),
    `Metodo de pago: ${METODO_LABEL[pedido.metodo_pago] ?? pedido.metodo_pago ?? '-'}`,
    'Estado: PAGADO',
    '--------------------------------',
    pedido.notas ? pedido.notas : '',
    '================================',
    'Gracias por su preferencia!',
    '',
  ].filter(l => l !== null)
  return lines.join('\n')
}

function PedidoRow({ pedido, onReimprimir }) {
  const MetodoIcon = pedido.metodo_pago === 'tarjeta' ? CreditCard : Banknote
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '0.6rem' }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Receipt size={17} style={{ color: '#F5922E' }}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#3D1A06' }}>#{pedido.codigo}</span>
          <span style={{ fontSize: '0.72rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={11}/> {formatHora(pedido.created_at)}
          </span>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#F3F4F6', color: '#6B7280' }}>
            {ESTADO_LABEL[pedido.estado] ?? pedido.estado}
          </span>
        </div>
        {pedido.notas && <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0' }}>{pedido.notas}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280', fontSize: '0.78rem' }}>
        <MetodoIcon size={14}/> {METODO_LABEL[pedido.metodo_pago] ?? pedido.metodo_pago}
      </div>
      <span style={{ fontWeight: 800, color: '#F5922E', fontSize: '0.95rem', minWidth: 70, textAlign: 'right' }}>S/ {Number(pedido.total).toFixed(2)}</span>
      <button onClick={() => onReimprimir(pedido)}
        style={{ width: 34, height: 34, borderRadius: 9, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        title="Reimprimir comprobante">
        <Printer size={14} style={{ color: '#6B7280' }}/>
      </button>
    </div>
  )
}

export default function ComprobantesPedidos() {
  const [pedidos, setPedidos]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [lastId,  setLastId]    = useState(0)
  const [newAlert, setNewAlert] = useState(false)
  const ticketRef               = useRef(null)

  function imprimir(pedido) {
    const el = ticketRef.current
    if (!el) return
    el.innerHTML = ''

    // Encabezado con logo — se arma con el DOM (no innerHTML) para evitar
    // inyectar HTML sin escapar desde campos de texto libre del pedido (notas).
    const header = document.createElement('div')
    header.style.textAlign = 'center'
    header.style.marginBottom = '6px'

    const img = document.createElement('img')
    img.alt = 'Logo'
    img.style.height = '46px'
    img.style.objectFit = 'contain'
    img.style.display = 'block'
    img.style.margin = '0 auto 4px'
    // Se espera a que el logo termine de cargar antes de imprimir — si no,
    // window.print() se dispara antes de que la imagen llegue y sale en blanco.
    const logoListo = new Promise(resolve => {
      let resuelto = false
      const listo = () => { if (!resuelto) { resuelto = true; resolve() } }
      img.onload = listo
      img.onerror = listo
      setTimeout(listo, 1500)
    })
    img.src = `${import.meta.env.BASE_URL}images/Logo-hotel-bn.png`
    header.appendChild(img)

    const nombre = document.createElement('div')
    nombre.style.fontWeight = '900'
    nombre.style.fontSize = '12px'
    nombre.style.letterSpacing = '0.04em'
    nombre.textContent = 'BRISAS DE MAYO — RESTAURANTE'
    header.appendChild(nombre)

    const subtitulo = document.createElement('div')
    subtitulo.style.fontSize = '9px'
    subtitulo.style.color = '#555'
    subtitulo.style.marginTop = '1px'
    subtitulo.textContent = 'COMPROBANTE DE PAGO'
    header.appendChild(subtitulo)

    el.appendChild(header)

    const cuerpo = document.createElement('pre')
    cuerpo.style.whiteSpace = 'pre'
    cuerpo.style.fontFamily = 'inherit'
    cuerpo.style.fontSize = 'inherit'
    cuerpo.style.margin = '0'
    cuerpo.textContent = buildComprobante(pedido)
    el.appendChild(cuerpo)

    logoListo.then(() => imprimirThermalTicket())
  }

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await restauranteApi.pagados()
      setPedidos(data)
      if (data.length > 0) {
        const maxId = Math.max(...data.map(p => p.id))
        setLastId(prev => {
          if (prev > 0 && maxId > prev) {
            setNewAlert(true)
            setTimeout(() => setNewAlert(false), 5000)
            const nuevo = data.find(p => p.id === maxId)
            if (nuevo) imprimir(nuevo)
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

  const ordenados = [...pedidos].reverse()

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Receipt size={22} style={{ color: '#F5922E' }}/>
          <div>
            <h1 className="section-title">Comprobantes — Restaurante</h1>
            <p className="section-subtitle">Pedidos pagados — impresión automática cada 8 s</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {newAlert && (
            <span style={{ background: '#16A34A', color: 'white', fontSize: '0.78rem', fontWeight: 700, padding: '5px 12px', borderRadius: 9999, animation: 'pulse-soft 1s ease-in-out infinite' }}>
              🧾 ¡Nuevo pago!
            </span>
          )}
          <button onClick={() => load()} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={15} style={{ color: '#6B7280' }}/>
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>Cargando comprobantes...</div>
      ) : ordenados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
          <Receipt size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }}/>
          <p>Aún no hay pedidos pagados.</p>
        </div>
      ) : (
        <div>{ordenados.map(p => <PedidoRow key={p.id} pedido={p} onReimprimir={imprimir}/>)}</div>
      )}

      {/* Ticket térmico oculto para impresión */}
      <div id="thermal-ticket" ref={ticketRef}/>
    </div>
  )
}
