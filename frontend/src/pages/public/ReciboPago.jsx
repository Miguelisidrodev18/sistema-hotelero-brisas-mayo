import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import axiosClient from '../../api/axiosClient'

function fDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fDateLong(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function noches(entrada, salida) {
  if (!entrada || !salida) return '—'
  return Math.round((new Date(salida) - new Date(entrada)) / 86400000)
}

const METODO = {
  yape: 'Yape', plin: 'Plin', transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo', tarjeta: 'Tarjeta',
}

const ESTADO_CFG = {
  verificado: { label: 'VERIFICADO', color: '#15803D', bg: '#DCFCE7' },
  pendiente:  { label: 'PENDIENTE',  color: '#D97706', bg: '#FEF9C3' },
  rechazado:  { label: 'RECHAZADO', color: '#DC2626', bg: '#FEE2E2' },
  devuelto:   { label: 'DEVUELTO',  color: '#4338CA', bg: '#E0E7FF' },
}

function imprimirFormato(f) {
  const el80 = document.querySelector('.recibo-80')
  const elA4 = document.querySelector('.recibo-a4')

  // Mostrar/ocultar directamente en el DOM (evita conflicto con inline styles)
  if (f === '80') {
    if (el80) el80.style.display = 'block'
    if (elA4) elA4.style.display = 'none'
  } else {
    if (el80) el80.style.display = 'none'
    if (elA4) elA4.style.display = 'block'
  }

  // Inyectar tamaño de página
  const prev = document.getElementById('__ps__')
  if (prev) prev.remove()
  const s = document.createElement('style')
  s.id = '__ps__'
  s.textContent = f === '80'
    ? `@media print { @page { size: 80mm auto; margin: 3mm; } .no-print { display: none !important; } body { margin: 0; background: white; } }`
    : `@media print { @page { size: A4 portrait; margin: 14mm 18mm; } .no-print { display: none !important; } body { margin: 0; background: white; } .recibo-a4 { box-shadow: none !important; border-radius: 0 !important; } }`
  document.head.appendChild(s)

  window.print()

  // Restaurar estado original después de imprimir
  window.addEventListener('afterprint', () => {
    s.remove()
    if (el80) el80.style.display = 'none'
    if (elA4) elA4.style.display = 'block'
  }, { once: true })
}

export default function ReciboPago() {
  const { codigo } = useParams()
  const [searchParams] = useSearchParams()
  const fParam = searchParams.get('f')

  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosClient.get(`/recibo/${codigo}`)
      .then(r => setData(r.data))
      .catch(() => setError('No se encontró el recibo para este código.'))
      .finally(() => setLoading(false))
  }, [codigo])

  useEffect(() => {
    if (data && fParam) {
      const t = setTimeout(() => imprimirFormato(fParam), 700)
      return () => clearTimeout(t)
    }
  }, [data, fParam])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
      <p style={{ color: '#6B7280', fontWeight: 600 }}>Cargando recibo...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
      <div style={{ textAlign: 'center', background: 'white', padding: '2.5rem 3rem', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
        <p style={{ color: '#DC2626', fontWeight: 700, fontSize: '1rem' }}>{error}</p>
        <p style={{ color: '#9CA3AF', fontSize: '0.82rem', marginTop: 6 }}>Verifique el código e intente nuevamente.</p>
      </div>
    </div>
  )

  const { reserva, pago } = data
  const estadoCfg = pago ? (ESTADO_CFG[pago.estado] ?? { label: pago.estado, color: '#6B7280', bg: '#F3F4F6' }) : null
  const n = noches(reserva.fecha_entrada, reserva.fecha_salida)

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', padding: '2rem 1rem' }}>

      {/* Toolbar */}
      <div className="no-print" style={{ maxWidth: 860, margin: '0 auto 1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => imprimirFormato('80')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.65rem 1.3rem', borderRadius: 10, border: 'none', background: '#1F2937', color: 'white', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer' }}>
          <Printer size={14}/> Imprimir 80 mm
        </button>
        <button
          onClick={() => imprimirFormato('a4')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.65rem 1.3rem', borderRadius: 10, border: 'none', background: '#7C3AED', color: 'white', fontWeight: 700, fontSize: '0.83rem', cursor: 'pointer' }}>
          <Printer size={14}/> Imprimir A4
        </button>
        <button
          onClick={() => window.history.back()}
          style={{ padding: '0.65rem 1.1rem', borderRadius: 10, border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, fontSize: '0.83rem', cursor: 'pointer' }}>
          ← Volver
        </button>
      </div>

      {/* ── A4 Receipt ── */}
      <div className="recibo-a4" style={{
        maxWidth: 794, margin: '0 auto', background: 'white',
        borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '2.5rem 3rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #F3F4F6', paddingBottom: '1.5rem', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.55rem', fontWeight: 900, color: '#3D1A06', letterSpacing: '-0.02em' }}>Hotel Brisas de Mayo</h1>
            <p style={{ margin: '4px 0 0', color: '#9CA3AF', fontSize: '0.82rem' }}>Huancaya, Yauyos, Lima — Perú</p>
            {reserva.sede?.nombre && <p style={{ margin: '2px 0 0', color: '#9CA3AF', fontSize: '0.78rem' }}>{reserva.sede.nombre}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recibo de pago</p>
            <p style={{ margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#3D1A06', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{reserva.codigo}</p>
            {estadoCfg && (
              <span style={{ display: 'inline-block', marginTop: 6, background: estadoCfg.bg, color: estadoCfg.color, fontSize: '0.72rem', fontWeight: 800, padding: '4px 12px', borderRadius: 999 }}>
                {estadoCfg.label}
              </span>
            )}
          </div>
        </div>

        {/* Two-column grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '1.1rem 1.25rem' }}>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cliente</p>
            <p style={{ margin: 0, fontWeight: 700, color: '#111827', fontSize: '0.95rem' }}>{reserva.cliente?.name ?? '—'}</p>
            {reserva.cliente?.email && <p style={{ margin: '3px 0 0', color: '#6B7280', fontSize: '0.8rem' }}>{reserva.cliente.email}</p>}
          </div>
          <div style={{ background: '#F9FAFB', borderRadius: 10, padding: '1.1rem 1.25rem' }}>
            <p style={{ margin: '0 0 0.6rem', fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pago</p>
            {pago ? (
              <>
                <p style={{ margin: 0, fontWeight: 800, color: '#F5922E', fontSize: '1.3rem' }}>S/ {Number(pago.monto).toFixed(2)}</p>
                <p style={{ margin: '3px 0 0', color: '#6B7280', fontSize: '0.8rem' }}>{METODO[pago.metodo_pago] ?? pago.metodo_pago}</p>
                {pago.referencia && <p style={{ margin: '2px 0 0', color: '#6B7280', fontSize: '0.78rem' }}>Ref: {pago.referencia}</p>}
                <p style={{ margin: '2px 0 0', color: '#6B7280', fontSize: '0.78rem' }}>{fDateLong(pago.fecha_pago)}</p>
              </>
            ) : <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.85rem' }}>Sin pago registrado</p>}
          </div>
        </div>

        {/* Reservation detail table */}
        <div style={{ border: '1px solid #F3F4F6', borderRadius: 10, overflow: 'hidden', marginBottom: '1.75rem' }}>
          <div style={{ background: '#F9FAFB', padding: '0.7rem 1.25rem', borderBottom: '1px solid #F3F4F6' }}>
            <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Detalle de Reserva</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { label: 'Habitación', value: `N° ${reserva.habitacion?.numero ?? '—'} — ${reserva.habitacion?.tipo ?? ''}` },
              { label: 'Check-in',   value: fDateLong(reserva.fecha_entrada) },
              { label: 'Check-out',  value: fDateLong(reserva.fecha_salida) },
              { label: 'Noches',     value: `${n} noche${n !== 1 ? 's' : ''}` },
              { label: 'Sede',       value: reserva.sede?.nombre ?? '—' },
              { label: 'Piso',       value: reserva.habitacion?.piso ? `Piso ${reserva.habitacion.piso}` : '—' },
            ].map(({ label, value }, i) => (
              <div key={i} style={{
                padding: '0.85rem 1.25rem',
                borderRight: (i + 1) % 3 !== 0 ? '1px solid #F3F4F6' : 'none',
                borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none',
              }}>
                <p style={{ margin: '0 0 3px', fontSize: '0.67rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ margin: 0, fontWeight: 600, color: '#111827', fontSize: '0.85rem' }}>{value ?? '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.73rem', color: '#9CA3AF' }}>Emitido el {fDateLong(new Date())}</p>
          <p style={{ margin: 0, fontSize: '0.73rem', color: '#9CA3AF' }}>Gracias por elegir Hotel Brisas de Mayo</p>
        </div>
      </div>

      {/* ── 80mm Thermal Receipt ── */}
      <div className="recibo-80" style={{
        maxWidth: 302, margin: '2rem auto 0', display: 'none',
        background: 'white', padding: '10px 8px', fontFamily: "'Courier New', Courier, monospace",
        fontSize: '11px', color: '#000', lineHeight: 1.5,
      }}>
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' }}>Hotel Brisas de Mayo</p>
          <p style={{ margin: 0 }}>Huancaya, Yauyos — Perú</p>
          {reserva.sede?.nombre && <p style={{ margin: 0 }}>{reserva.sede.nombre}</p>}
        </div>

        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>Recibo de Pago</p>
        </div>

        <div style={{ marginBottom: 6 }}>
          <Row80 label="Código"  value={reserva.codigo} />
          <Row80 label="Fecha"   value={fDate(pago?.fecha_pago ?? new Date())} />
        </div>

        <div style={{ borderTop: '1px dashed #000', paddingTop: 6, marginBottom: 6 }}>
          <p style={{ margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Cliente</p>
          <p style={{ margin: 0 }}>{reserva.cliente?.name ?? '—'}</p>
          {reserva.cliente?.email && <p style={{ margin: 0, fontSize: '9px' }}>{reserva.cliente.email}</p>}
        </div>

        <div style={{ borderTop: '1px dashed #000', paddingTop: 6, marginBottom: 6 }}>
          <p style={{ margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Reserva</p>
          <Row80 label="Hab."      value={`${reserva.habitacion?.numero ?? '—'} (${reserva.habitacion?.tipo ?? ''})`} />
          <Row80 label="Check-in"  value={fDate(reserva.fecha_entrada)} />
          <Row80 label="Check-out" value={fDate(reserva.fecha_salida)} />
          <Row80 label="Noches"    value={`${n}`} />
        </div>

        <div style={{ borderTop: '1px dashed #000', paddingTop: 6, marginBottom: 6 }}>
          <p style={{ margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' }}>Pago</p>
          {pago ? (
            <>
              <Row80 label="Monto"   value={`S/ ${Number(pago.monto).toFixed(2)}`} bold />
              <Row80 label="Método"  value={METODO[pago.metodo_pago] ?? pago.metodo_pago} />
              {pago.referencia && <Row80 label="Ref." value={pago.referencia} />}
              <Row80 label="Estado"  value={estadoCfg?.label ?? pago.estado} bold />
            </>
          ) : <p style={{ margin: 0 }}>Sin pago registrado</p>}
        </div>

        <div style={{ borderTop: '1px dashed #000', paddingTop: 6, textAlign: 'center' }}>
          <p style={{ margin: 0 }}>Gracias por su visita</p>
          <p style={{ margin: 0, fontSize: '9px' }}>www.brisasdemayo.pe</p>
        </div>
      </div>

    </div>
  )
}

function Row80({ label, value, bold }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
      <span style={{ color: '#444' }}>{label}:</span>
      <span style={{ fontWeight: bold ? 700 : 400, textAlign: 'right' }}>{value ?? '—'}</span>
    </div>
  )
}
