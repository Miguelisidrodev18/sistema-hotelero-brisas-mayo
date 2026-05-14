import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, BedDouble, Users, Calendar, CheckCircle, Smartphone, Banknote, CreditCard, Building2 } from 'lucide-react'
import { pagosApi } from '../../api/pagos'

const METODOS = [
  {
    id: 'yape',
    label: 'Yape',
    icon: Smartphone,
    color: '#6B21A8',
    bg: '#F5F3FF',
    border: '#C4B5FD',
    desc: 'Pago instantáneo con Yape',
  },
  {
    id: 'plin',
    label: 'Plin',
    icon: Smartphone,
    color: '#0369A1',
    bg: '#F0F9FF',
    border: '#7DD3FC',
    desc: 'Pago instantáneo con Plin',
  },
  {
    id: 'transferencia',
    label: 'Transferencia',
    icon: Building2,
    color: '#0F766E',
    bg: '#F0FDFA',
    border: '#5EEAD4',
    desc: 'Transferencia bancaria',
  },
  {
    id: 'efectivo',
    label: 'Efectivo',
    icon: Banknote,
    color: '#15803D',
    bg: '#F0FDF4',
    border: '#86EFAC',
    desc: 'Pago en recepción al llegar',
  },
  {
    id: 'tarjeta',
    label: 'Tarjeta',
    icon: CreditCard,
    color: '#1D4ED8',
    bg: '#EFF6FF',
    border: '#93C5FD',
    desc: 'Tarjeta débito o crédito',
  },
]

function MetodoPill({ metodo, selected, onSelect }) {
  const Icon = metodo.icon
  const isSelected = selected === metodo.id
  return (
    <button
      onClick={() => onSelect(metodo.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.85rem',
        padding: '1rem 1.25rem', borderRadius: 14, cursor: 'pointer',
        border: `2px solid ${isSelected ? metodo.color : '#E5E7EB'}`,
        background: isSelected ? metodo.bg : 'white',
        transition: 'all 0.18s', textAlign: 'left', width: '100%',
        boxShadow: isSelected ? `0 0 0 3px ${metodo.border}55` : 'none',
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 12, background: isSelected ? metodo.bg : '#F9FAFB', border: `1.5px solid ${isSelected ? metodo.border : '#E5E7EB'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.18s' }}>
        <Icon size={18} style={{ color: isSelected ? metodo.color : '#9CA3AF' }}/>
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? metodo.color : '#111827', marginBottom: '0.1rem' }}>{metodo.label}</p>
        <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{metodo.desc}</p>
      </div>
      {isSelected && (
        <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: metodo.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle size={14} style={{ color: 'white' }}/>
        </div>
      )}
    </button>
  )
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: highlight ? '1rem' : '0.85rem', paddingTop: highlight ? '0.75rem' : 0, borderTop: highlight ? '1px solid #F3F4F6' : 'none' }}>
      <span style={{ color: highlight ? '#374151' : '#6B7280', fontWeight: highlight ? 700 : 400 }}>{label}</span>
      <span style={{ color: highlight ? '#F5922E' : '#111827', fontWeight: highlight ? 800 : 600 }}>{value}</span>
    </div>
  )
}

export default function PagoReserva() {
  const { reservaId } = useParams()
  const navigate      = useNavigate()

  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [metodo, setMetodo]     = useState('')
  const [referencia, setRef]    = useState('')
  const [paying, setPaying]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  useEffect(() => {
    pagosApi.getByReserva(reservaId)
      .then(r => {
        setData(r.data)
        // Si ya existe pago previo redirigir a mis reservas
        if (r.data.pago) {
          navigate(`/reservas?nueva=${r.data.reserva.codigo}`, { replace: true })
        }
      })
      .catch(() => navigate('/reservas', { replace: true }))
      .finally(() => setLoading(false))
  }, [reservaId])

  async function handlePagar() {
    if (!metodo) return
    setPaying(true); setError('')
    try {
      await pagosApi.registrar(reservaId, { metodo_pago: metodo, referencia: referencia || undefined })
      setSuccess(true)
      setTimeout(() => {
        navigate(`/reservas?nueva=${data.reserva.codigo}`)
      }, 2200)
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al registrar el pago. Intenta de nuevo.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ color: '#9CA3AF' }}>Cargando...</p>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F0FDF4', border: '3px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={36} style={{ color: '#16A34A' }}/>
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827' }}>¡Pago registrado!</h2>
        <p style={{ color: '#6B7280', fontSize: '0.9rem' }}>Tu reserva ha sido confirmada. Redirigiendo...</p>
      </div>
    )
  }

  const { reserva } = data
  const noches = Math.ceil((new Date(reserva.fecha_salida) - new Date(reserva.fecha_entrada)) / 86400000)
  const metodoInfo = METODOS.find(m => m.id === metodo)

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 960, margin: '0 auto' }}>

      {/* Header */}
      <button
        onClick={() => navigate('/reservas')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', fontSize: '0.875rem', marginBottom: '1.5rem', padding: 0 }}>
        <ArrowLeft size={16}/> Volver a mis reservas
      </button>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
        {[{ n: 1, label: 'Habitación' }, { n: 2, label: 'Fechas' }, { n: 3, label: 'Pago' }].map(({ n, label }, i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, background: n < 3 ? '#22C55E' : '#F5922E', color: 'white' }}>
                {n < 3 ? '✓' : n}
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: n === 3 ? 700 : 400, color: n === 3 ? '#F5922E' : '#374151' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ width: 40, height: 2, background: n < 3 ? '#22C55E' : '#E5E7EB', borderRadius: 9999 }}/>}
          </div>
        ))}
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111', marginBottom: '0.25rem' }}>Confirma tu pago</h1>
      <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.75rem' }}>Reserva <b style={{ color: '#3D1A06' }}>{reserva.codigo}</b> · elige tu método de pago</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

        {/* ── Resumen de reserva ── */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '0.75rem' }}>Resumen de reserva</p>
          <div style={{ background: 'white', borderRadius: 18, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 16px rgba(61,26,6,0.06)' }}>
            {/* Mini banner */}
            <div style={{ height: 90, background: 'linear-gradient(135deg, #3D1A06 0%, #7B4019 100%)', display: 'flex', alignItems: 'flex-end', padding: '1rem' }}>
              <div>
                <p style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>Habitación N° {reserva.habitacion?.numero}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem' }}>{reserva.sede?.nombre}</p>
              </div>
            </div>

            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <InfoRow label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13}/> Entrada</span>} value={new Date(reserva.fecha_entrada + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}/>
              <InfoRow label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13}/> Salida</span>}  value={new Date(reserva.fecha_salida  + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}/>
              <InfoRow label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Users size={13}/> Huéspedes</span>}  value={`${reserva.num_huespedes} persona${reserva.num_huespedes > 1 ? 's' : ''}`}/>
              <InfoRow label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><BedDouble size={13}/> Noches</span>} value={`${noches} noche${noches > 1 ? 's' : ''}`}/>
              <div style={{ height: 1, background: '#F3F4F6' }}/>
              <InfoRow label="Precio por noche" value={`S/ ${reserva.precio_noche}`}/>
              <InfoRow label="Total a pagar" value={`S/ ${reserva.precio_total}`} highlight/>
            </div>
          </div>

          {/* Instrucciones según método */}
          {metodo && metodo !== 'efectivo' && (
            <div style={{ marginTop: '1rem', background: metodoInfo.bg, border: `1px solid ${metodoInfo.border}`, borderRadius: 14, padding: '1rem 1.25rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: metodoInfo.color, marginBottom: '0.5rem' }}>Instrucciones de pago</p>
              {metodo === 'yape' && <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.6 }}>Yapea al número <b>+51 999 000 111</b> con el monto exacto y coloca el código <b>{reserva.codigo}</b> como concepto.</p>}
              {metodo === 'plin' && <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.6 }}>Envía el pago por Plin al número <b>+51 999 000 111</b>. Indica el código <b>{reserva.codigo}</b> como referencia.</p>}
              {metodo === 'transferencia' && <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.6 }}>Transfiere a la cuenta BCP <b>123-456789-0-12</b> a nombre de <b>Hotel Brisas de Mayo</b>. Indica el código <b>{reserva.codigo}</b>.</p>}
              {metodo === 'tarjeta' && <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.6 }}>El pago con tarjeta se procesará en recepción al momento del check-in. Presenta tu reserva con el código <b>{reserva.codigo}</b>.</p>}
            </div>
          )}
          {metodo === 'efectivo' && (
            <div style={{ marginTop: '1rem', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 14, padding: '1rem 1.25rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#15803D', marginBottom: '0.5rem' }}>Pago en recepción</p>
              <p style={{ fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.6 }}>Presenta el código <b>{reserva.codigo}</b> al llegar. El pago se realiza en efectivo al momento del check-in.</p>
            </div>
          )}
        </div>

        {/* ── Selección de método ── */}
        <div>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '0.75rem' }}>Método de pago</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {METODOS.map(m => (
              <MetodoPill key={m.id} metodo={m} selected={metodo} onSelect={setMetodo}/>
            ))}
          </div>

          {/* Campo referencia (opcional para transferencia/yape/plin) */}
          {metodo && metodo !== 'efectivo' && metodo !== 'tarjeta' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                N° de operación / voucher <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej: 12345678"
                value={referencia}
                onChange={e => setRef(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.7rem 0.9rem', fontSize: '0.875rem', outline: 'none' }}
              />
            </div>
          )}

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePagar}
            disabled={!metodo || paying}
            style={{
              width: '100%', padding: '1rem', borderRadius: 14, border: 'none', cursor: !metodo ? 'not-allowed' : 'pointer',
              background: !metodo ? '#E5E7EB' : 'linear-gradient(135deg, #F5922E, #E07820)',
              color: !metodo ? '#9CA3AF' : 'white', fontWeight: 700, fontSize: '1rem',
              transition: 'opacity 0.2s', opacity: paying ? 0.7 : 1,
            }}>
            {paying ? 'Procesando...' : !metodo ? 'Selecciona un método' : `Confirmar pago — S/ ${reserva.precio_total}`}
          </button>

          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', marginTop: '0.75rem' }}>
            Al confirmar, tu reserva quedará <b>Confirmada</b> y recibirás el QR de acceso.
          </p>
        </div>
      </div>
    </div>
  )
}
