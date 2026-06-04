import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Printer, X } from 'lucide-react'
import QRLib from 'qr.js/lib/QRCode'
import EL   from 'qr.js/lib/ErrorCorrectLevel'
import axiosClient from '../../api/axiosClient'

/* ── QR SVG (mismo helper que MisReservas — tiene try/catch) ── */
function QRCodeSVG({ value, size = 110, fgColor = '#111111', bgColor = '#ffffff' }) {
  try {
    const qr = new QRLib(-1, EL['L'])
    const bytes = Array.from(new TextEncoder().encode(value))
      .map(b => String.fromCharCode(b & 0xff)).join('')
    qr.addData(bytes, 'Byte')
    qr.make()
    const cells = qr.modules
    const n = cells.length
    const fgD = cells.map((row, r) => row.map((cell, c) =>  cell ? `M ${c} ${r} l 1 0 0 1 -1 0 Z` : '').join(' ')).join(' ')
    const bgD = cells.map((row, r) => row.map((cell, c) => !cell ? `M ${c} ${r} l 1 0 0 1 -1 0 Z` : '').join(' ')).join(' ')
    return (
      <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} xmlns="http://www.w3.org/2000/svg">
        <path d={bgD} fill={bgColor} />
        <path d={fgD} fill={fgColor} />
      </svg>
    )
  } catch {
    return (
      <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', borderRadius: 6 }}>
        <span style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>QR no disp.</span>
      </div>
    )
  }
}

/* ── Helpers ── */
function fDate(d) {
  if (!d) return '—'
  // slice(0,10) extrae "YYYY-MM-DD" sin importar si llega como ISO completo o solo fecha
  return new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fHora(h) {
  if (!h) return '—'
  return h.slice(0, 5) + ' hrs'
}

const METODO = { yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia', efectivo: 'Efectivo', tarjeta: 'Tarjeta' }

const HR = () => <div style={{ borderTop: '1px dashed #AAAAAA', margin: '7px 0' }} />

/* ── Función de impresión (igual que ReciboPago) ── */
function imprimir() {
  const prev = document.getElementById('__tps__')
  if (prev) prev.remove()
  const s = document.createElement('style')
  s.id = '__tps__'
  // Técnica visibility: oculta todo el body, muestra solo el ticket
  // Funciona independientemente de la estructura del DOM y de estilos inline
  s.textContent = `
    @media print {
      @page { size: 80mm auto; margin: 2mm; }
      body * { visibility: hidden !important; }
      .tp-ticket, .tp-ticket * { visibility: visible !important; }
      .tp-ticket {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        width: 76mm !important;
        margin: 0 !important;
        padding: 4px !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: white !important;
      }
    }
  `
  document.head.appendChild(s)
  window.print()
  window.addEventListener('afterprint', () => s.remove(), { once: true })
}

/* ══════════════════════════════════════════════════ */
export default function TicketCheckin() {
  const { codigo } = useParams()

  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosClient.get(`/recibo/${codigo}`)
      .then(r  => setData(r.data))
      .catch(() => setError('No se encontró la reserva para este código.'))
      .finally(()  => setLoading(false))
  }, [codigo])

  /* ── Loading ── */
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
      <p style={{ color: '#6B7280', fontWeight: 600, fontFamily: 'system-ui, sans-serif' }}>Cargando ticket...</p>
    </div>
  )

  /* ── Error ── */
  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
      <div style={{ textAlign: 'center', background: 'white', padding: '2rem 2.5rem', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', fontFamily: 'system-ui, sans-serif' }}>
        <p style={{ fontSize: 32, margin: '0 0 10px' }}>🔍</p>
        <p style={{ color: '#DC2626', fontWeight: 700 }}>{error}</p>
      </div>
    </div>
  )

  const { reserva, pago } = data
  const noches  = reserva.fecha_entrada && reserva.fecha_salida
    ? Math.round((new Date(reserva.fecha_salida.slice(0, 10) + 'T12:00:00') - new Date(reserva.fecha_entrada.slice(0, 10) + 'T12:00:00')) / 86400000)
    : 0
  const esPagado = pago?.estado === 'verificado'
  const esPendiente = pago?.estado === 'pendiente'

  return (
    <div className="tp-wrapper" style={{ minHeight: '100vh', background: '#F0F0F0', padding: '1.25rem 1rem 3rem', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Banner previsualización ── */}
      <div className="tp-noprint" style={{ maxWidth: 420, margin: '0 auto 1rem', background: 'white', border: '1.5px solid #BBF7D0', borderRadius: 14, padding: '0.9rem 1.1rem', boxShadow: '0 3px 12px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Printer size={16} style={{ color: '#16A34A' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: '0.88rem', color: '#111827', margin: 0 }}>Ticket listo — revisa y presiona Imprimir</p>
        </div>
        <button onClick={imprimir}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1rem', borderRadius: 9, border: 'none', background: '#16A34A', color: 'white', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Printer size={13} /> Imprimir
        </button>
        <button onClick={() => window.close()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      {/* ── Ticket 80mm ── */}
      <div className="tp-ticket" style={{
        maxWidth: 302, margin: '0 auto', background: 'white',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '11px', color: '#111', lineHeight: 1.5,
        padding: '12px 10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        borderRadius: 4,
      }}>

        {/* Logo + nombre */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <img
            src={`${import.meta.env.BASE_URL}images/Logo-hotel.jpeg`}
            alt="Logo"
            style={{ height: 60, objectFit: 'contain', display: 'block', margin: '0 auto 5px' }}
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <div style={{ fontWeight: 900, fontSize: '12px', letterSpacing: '0.04em' }}>HOTEL BRISAS DE MAYO</div>
          <div style={{ fontSize: '9px', color: '#555', marginTop: 1 }}>Huancaya, Yauyos, Lima</div>
        </div>

        <HR />

        {/* CHECK-IN CONFIRMADO */}
        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <div style={{ fontWeight: 800, fontSize: '11px' }}>CHECK-IN CONFIRMADO</div>
          <div style={{ fontSize: '9px', color: '#555', marginTop: 2 }}>Codigo de reserva:</div>
          <div style={{ margin: '4px auto 0', display: 'inline-block', border: '1.5px dashed #555', borderRadius: 3, padding: '3px 16px', fontWeight: 900, fontSize: '16px', letterSpacing: '0.1em' }}>
            {reserva.codigo}
          </div>
          <div style={{ fontSize: '9px', color: '#888', marginTop: 4 }}>
            {'Emision: ' + new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <HR />

        {/* Huesped */}
        <div style={{ marginBottom: 3 }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: 1 }}>Huesped</div>
          <div style={{ fontWeight: 800, fontSize: '11.5px' }}>{reserva.cliente ? reserva.cliente.name : 'Huesped'}</div>
        </div>

        <HR />

        {/* Habitacion */}
        <div style={{ marginBottom: 3 }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: 1 }}>Habitacion</div>
          <div style={{ fontWeight: 700, fontSize: '11px' }}>
            {'N° ' + (reserva.habitacion ? reserva.habitacion.numero : '-') + ' — ' + (reserva.habitacion ? reserva.habitacion.tipo : '-')}
            {reserva.habitacion && reserva.habitacion.piso != null ? ' | Piso ' + reserva.habitacion.piso : ''}
          </div>
        </div>

        <HR />

        {/* Fechas y horas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, margin: '3px 0' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Check-In</div>
            <div style={{ fontWeight: 700, fontSize: '10.5px', marginTop: 1 }}>{fDate(reserva.fecha_entrada)}</div>
            <div style={{ fontSize: '10px', color: '#333' }}>{fHora(reserva.hora_checkin)}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Check-Out</div>
            <div style={{ fontWeight: 700, fontSize: '10.5px', marginTop: 1 }}>{fDate(reserva.fecha_salida)}</div>
            <div style={{ fontSize: '10px', color: '#333' }}>{fHora(reserva.hora_checkout)}</div>
          </div>
        </div>
        {noches > 0 && <div style={{ fontSize: '9px', color: '#777', marginTop: 2 }}>{noches} {noches === 1 ? 'noche' : 'noches'}</div>}

        <HR />

        {/* Total */}
        <div style={{ textAlign: 'center', margin: '3px 0' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Total Pagado</div>
          <div style={{ fontWeight: 900, fontSize: '20px', letterSpacing: '-0.01em', marginTop: 2 }}>
            {'S/ ' + Number(reserva.precio_total).toFixed(2)}
          </div>
          {pago && (
            <div style={{ fontSize: '9.5px', color: '#555', marginTop: 1 }}>
              {'Metodo: ' + (METODO[pago.metodo_pago] || pago.metodo_pago)}
            </div>
          )}
          {(esPagado || esPendiente) && (
            <div style={{ display: 'inline-block', marginTop: 5, background: esPagado ? '#16A34A' : '#D97706', color: 'white', fontWeight: 800, fontSize: '10px', padding: '2px 14px', borderRadius: 3, letterSpacing: '0.06em' }}>
              {esPagado ? 'PAGADO' : 'PENDIENTE'}
            </div>
          )}
        </div>

        <HR />

        {/* Info importante */}
        <div style={{ marginBottom: 3 }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: 2 }}>Informacion importante</div>
          <div style={{ fontSize: '8.5px', color: '#444', lineHeight: 1.5 }}>
            El establecimiento se rige por sus politicas internas. Al hospedarse, el huesped declara conocer y aceptar los terminos y condiciones. Cualquier reclamo sera atendido conforme a dichas politicas.
          </div>
        </div>

        <HR />

        {/* QR */}
        <div style={{ textAlign: 'center', margin: '5px 0 3px' }}>
          <div style={{ display: 'inline-block', padding: 5, background: 'white', border: '1px solid #DDD', borderRadius: 4 }}>
            <QRCodeSVG value={'BRISAS:' + reserva.codigo} size={100} fgColor="#111111" bgColor="#ffffff" />
          </div>
          <div style={{ fontSize: '9px', color: '#555', marginTop: 3 }}>Escanea para validar tu reserva</div>
        </div>

        <HR />

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <div style={{ fontSize: '10px', color: '#777' }}>~ * ~</div>
          <div style={{ fontWeight: 800, fontSize: '11px', marginTop: 2 }}>Gracias por elegirnos!</div>
        </div>

      </div>
    </div>
  )
}
