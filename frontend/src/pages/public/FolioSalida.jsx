import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Printer, X } from 'lucide-react'
import QRLib from 'qr.js/lib/QRCode'
import EL   from 'qr.js/lib/ErrorCorrectLevel'
import axiosClient from '../../api/axiosClient'

function QRCodeSVG({ value, size = 100, fgColor = '#111111', bgColor = '#ffffff' }) {
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
    return <div style={{ width: size, height: size, background: '#F3F4F6', borderRadius: 4 }} />
  }
}

function fDate(d) {
  if (!d) return '—'
  return new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmt(n) { return 'S/ ' + Number(n ?? 0).toFixed(2) }

const METODO = { efectivo: 'Efectivo', yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia', tarjeta: 'Tarjeta' }
const TIPO   = { adelanto: 'Adelanto', saldo: 'Saldo', total: 'Total' }

const HR = () => <div style={{ borderTop: '1px dashed #AAAAAA', margin: '7px 0' }} />

function imprimir() {
  const wrapper = document.querySelector('.fp-wrapper')
  const banner  = document.querySelector('.fp-noprint')
  const ticket  = document.querySelector('.fp-ticket')

  const wOrig = wrapper ? wrapper.getAttribute('style') : null

  if (wrapper) {
    wrapper.style.minHeight  = '0'
    wrapper.style.padding    = '0'
    wrapper.style.background = 'white'
  }
  if (banner) banner.style.display = 'none'
  if (ticket) {
    ticket.style.boxShadow    = 'none'
    ticket.style.borderRadius = '0'
    ticket.style.margin       = '0'
    ticket.style.maxWidth     = '100%'
    ticket.style.width        = '100%'
  }

  const prev = document.getElementById('__fps__')
  if (prev) prev.remove()
  const s = document.createElement('style')
  s.id = '__fps__'
  s.textContent = `@media print { @page { size: 80mm auto; margin: 2mm; } }`
  document.head.appendChild(s)

  window.print()

  window.addEventListener('afterprint', () => {
    s.remove()
    if (wrapper) {
      if (wOrig !== null) wrapper.setAttribute('style', wOrig)
      else wrapper.removeAttribute('style')
    }
    if (banner) banner.style.display = ''
    if (ticket) {
      ticket.style.boxShadow    = ''
      ticket.style.borderRadius = ''
      ticket.style.margin       = ''
      ticket.style.maxWidth     = ''
      ticket.style.width        = ''
    }
  }, { once: true })
}

export default function FolioSalida() {
  const { codigo } = useParams()
  const [data,    setData]    = useState(null)
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosClient.get(`/folio/${codigo}`)
      .then(r  => setData(r.data))
      .catch(() => setError('No se encontró el folio para este código.'))
      .finally(() => setLoading(false))
  }, [codigo])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F0F0' }}>
      <p style={{ color: '#6B7280', fontWeight: 600, fontFamily: 'system-ui' }}>Cargando folio...</p>
    </div>
  )
  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F0F0' }}>
      <div style={{ textAlign: 'center', background: 'white', padding: '2rem', borderRadius: 14, fontFamily: 'system-ui' }}>
        <p style={{ fontSize: 32, margin: '0 0 10px' }}>🔍</p>
        <p style={{ color: '#DC2626', fontWeight: 700 }}>{error}</p>
      </div>
    </div>
  )

  const { reserva, noches, total_pagado, total_servicios, gran_total, saldo_pendiente } = data

  return (
    <div className="fp-wrapper" style={{ minHeight: '100vh', background: '#F0F0F0', padding: '1.25rem 1rem 3rem', fontFamily: 'system-ui, sans-serif' }}>

      {/* Banner */}
      <div className="fp-noprint" style={{ maxWidth: 420, margin: '0 auto 1rem', background: 'white', border: '1.5px solid #BBF7D0', borderRadius: 14, padding: '0.9rem 1.1rem', boxShadow: '0 3px 12px rgba(0,0,0,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Printer size={16} style={{ color: '#7C3AED' }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: '0.88rem', color: '#111827', margin: 0 }}>Folio listo — revisa y presiona Imprimir</p>
          {data && <p style={{ fontSize: '0.72rem', color: '#6B7280', margin: '2px 0 0', fontFamily: 'monospace' }}>{'N° F-' + String(data.reserva.id).padStart(6, '0')} · {data.reserva.codigo}</p>}
        </div>
        <button onClick={imprimir}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1rem', borderRadius: 9, border: 'none', background: '#7C3AED', color: 'white', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Printer size={13} /> Imprimir
        </button>
        <button onClick={() => window.close()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4, flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      {/* Folio 80mm */}
      <div className="fp-ticket" style={{
        maxWidth: 302, margin: '0 auto', background: 'white',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '11px', color: '#111', lineHeight: 1.5,
        padding: '12px 10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        borderRadius: 4,
      }}>

        {/* Logo + Nombre */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <img src={`${import.meta.env.BASE_URL}images/Logo-hotel.jpeg`} alt="Logo"
            style={{ height: 60, objectFit: 'contain', display: 'block', margin: '0 auto 5px' }}
            onError={e => { e.currentTarget.style.display = 'none' }} />
          <div style={{ fontWeight: 900, fontSize: '12px', letterSpacing: '0.04em' }}>HOTEL BRISAS DE MAYO</div>
          <div style={{ fontSize: '9px', color: '#555', marginTop: 1 }}>Huancaya, Yauyos, Lima</div>
        </div>

        <HR />

        {/* Título */}
        <div style={{ textAlign: 'center', margin: '4px 0' }}>
          <div style={{ fontWeight: 800, fontSize: '11px' }}>FOLIO DE SALIDA</div>
          <div style={{ fontSize: '9px', color: '#888', marginTop: 1 }}>
            {'N° F-' + String(reserva.id).padStart(6, '0')}
          </div>
          <div style={{ fontSize: '9px', color: '#555', marginTop: 3 }}>Codigo de reserva:</div>
          <div style={{ margin: '4px auto 0', display: 'inline-block', border: '1.5px dashed #555', borderRadius: 3, padding: '3px 16px', fontWeight: 900, fontSize: '16px', letterSpacing: '0.1em' }}>
            {reserva.codigo}
          </div>
        </div>

        <HR />

        {/* Huesped */}
        <div style={{ marginBottom: 3 }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: 1 }}>Huesped</div>
          <div style={{ fontWeight: 800, fontSize: '11.5px' }}>{reserva.cliente ? reserva.cliente.name : 'Huesped'}</div>
          {reserva.cliente?.dni && <div style={{ fontSize: '9px', color: '#666' }}>{'DNI: ' + reserva.cliente.dni}</div>}
        </div>

        <HR />

        {/* Habitacion + fechas */}
        <div style={{ marginBottom: 3 }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: 1 }}>Habitacion</div>
          <div style={{ fontWeight: 700, fontSize: '11px' }}>
            {'N° ' + (reserva.habitacion ? reserva.habitacion.numero : '-') + ' — ' + (reserva.habitacion ? reserva.habitacion.tipo : '-')}
            {reserva.habitacion?.piso != null ? ' | Piso ' + reserva.habitacion.piso : ''}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, margin: '3px 0' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Ingreso</div>
            <div style={{ fontWeight: 700, fontSize: '10px', marginTop: 1 }}>{fDate(reserva.fecha_entrada)}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Salida</div>
            <div style={{ fontWeight: 700, fontSize: '10px', marginTop: 1 }}>{fDate(reserva.fecha_salida)}</div>
          </div>
        </div>
        {noches > 0 && <div style={{ fontSize: '9px', color: '#777' }}>{noches} {noches === 1 ? 'noche' : 'noches'}</div>}

        <HR />

        {/* Detalle de cargos */}
        <div style={{ marginBottom: 2 }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: 3 }}>Detalle de cargos</div>

          {/* Alojamiento */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 2 }}>
            <span>{'Alojamiento x' + noches}</span>
            <span style={{ fontWeight: 700 }}>{fmt(reserva.precio_original ?? reserva.precio_total)}</span>
          </div>

          {/* Descuento */}
          {reserva.descuento_porcentaje > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 2 }}>
              <span>{'Descuento ' + reserva.descuento_porcentaje + '%'}</span>
              <span style={{ fontWeight: 700 }}>{'-' + fmt((reserva.precio_original ?? reserva.precio_total) - reserva.precio_total)}</span>
            </div>
          )}

          {/* Servicios */}
          {reserva.servicios && reserva.servicios.length > 0 && (
            reserva.servicios.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 2, paddingLeft: 6 }}>
                <span>{(s.servicio ? s.servicio.nombre : 'Servicio') + ' x' + s.cantidad}</span>
                <span style={{ fontWeight: 600 }}>{fmt(s.subtotal)}</span>
              </div>
            ))
          )}

          <div style={{ borderTop: '1px solid #DDD', marginTop: 4, paddingTop: 4, display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
            <span style={{ fontWeight: 800 }}>TOTAL</span>
            <span style={{ fontWeight: 900 }}>{fmt(gran_total)}</span>
          </div>
        </div>

        <HR />

        {/* Pagos */}
        {reserva.pagos && reserva.pagos.length > 0 && (<>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: 3 }}>Pagos realizados</div>
          {reserva.pagos.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: 2 }}>
              <span>{(TIPO[p.tipo_pago] || p.tipo_pago) + ' - ' + (METODO[p.metodo_pago] || p.metodo_pago)}</span>
              <span style={{ fontWeight: 600 }}>{fmt(p.monto)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: 3, paddingTop: 3, borderTop: '1px solid #EEE' }}>
            <span>Total pagado</span>
            <span style={{ fontWeight: 800, color: '#16A34A' }}>{fmt(total_pagado)}</span>
          </div>
          {saldo_pendiente > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: 2 }}>
              <span style={{ fontWeight: 700 }}>Saldo pendiente</span>
              <span style={{ fontWeight: 900, color: '#D97706' }}>{fmt(saldo_pendiente)}</span>
            </div>
          )}
          <HR />
        </>)}

        {/* QR */}
        <div style={{ textAlign: 'center', margin: '5px 0 3px' }}>
          <div style={{ display: 'inline-block', padding: 5, background: 'white', border: '1px solid #DDD', borderRadius: 4 }}>
            <QRCodeSVG value={'BRISAS:' + reserva.codigo} size={100} />
          </div>
          <div style={{ fontSize: '9px', color: '#555', marginTop: 3 }}>Escanea para verificar</div>
        </div>

        <HR />

        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <div style={{ fontSize: '10px', color: '#777' }}>~ * ~</div>
          <div style={{ fontWeight: 800, fontSize: '11px', marginTop: 2 }}>Gracias por su preferencia!</div>
        </div>

      </div>
    </div>
  )
}
