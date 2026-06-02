import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BedDouble, Users, Calendar, CheckCircle, Smartphone, Banknote, CreditCard, Building2, Zap, Car, X, MapPin } from 'lucide-react'
import { pagosApi } from '../../api/pagos'
import { cocherasApi } from '../../api/cocheras'
import { useBreakpoint } from '../../hooks/useBreakpoint'

const TIPO_ICONO = { auto: '🚗', moto: '🏍️', discapacitado: '♿' }
const TIPO_LABEL = { auto: 'Auto', moto: 'Moto', discapacitado: 'Discapacitado' }

// ── Modal cochera post-pago ───────────────────────────────────────────────────
function ModalCochera({ reserva, onDone, initialPaso = 'pregunta' }) {
  const [paso, setPaso]           = useState(initialPaso)
  const [cocheras, setCocheras]   = useState([])
  const [loadingC, setLoadingC]   = useState(false)
  const [selected, setSelected]   = useState(null)
  const [tipo, setTipo]           = useState('')
  const [placa, setPlaca]         = useState('')
  const [reservando, setReservando] = useState(false)
  const [error, setError]         = useState('')
  const [cocheraRes, setCocheraRes] = useState(null)

  function cargarCocheras() {
    setLoadingC(true)
    cocherasApi.getDisponibles({ sede_id: reserva.sede_id })
      .then(r => setCocheras(r.data))
      .catch(() => setCocheras([]))
      .finally(() => setLoadingC(false))
  }

  // Si arranca directamente en 'seleccionar', carga las cocheras al montar
  useEffect(() => {
    if (initialPaso === 'seleccionar') cargarCocheras()
  }, [])

  const cocherasFiltradas = tipo ? cocheras.filter(c => c.tipo === tipo) : cocheras

  async function reservarCochera() {
    if (!selected) return
    setReservando(true); setError('')
    try {
      const { data } = await cocherasApi.reservar({
        cochera_id:    selected.id,
        fecha_entrada: reserva.fecha_entrada?.split('T')[0] ?? reserva.fecha_entrada,
        fecha_salida:  reserva.fecha_salida?.split('T')[0]  ?? reserva.fecha_salida,
        placa:         placa.trim() || undefined,
        reserva_id:    reserva.id,
      })
      setCocheraRes(data)
      setPaso('exito')
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al reservar el espacio.')
    } finally {
      setReservando(false)
    }
  }

  // ── Paso 1: Pregunta ─────────────────────────────────────────────────────
  if (paso === 'pregunta') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}>
          <div style={{ background: 'linear-gradient(135deg, #3D1A06, #7B4019)', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
              <Car size={26} color="white"/>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Servicio de estacionamiento</p>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>¿Vendrás con vehículo propio?</p>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <p style={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.25rem', textAlign: 'center' }}>
              Tenemos cocheras disponibles en <b>{reserva.sede?.nombre}</b>. Reserva tu espacio ahora y llega sin preocupaciones.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button onClick={() => { setPaso('seleccionar'); cargarCocheras() }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #F5922E, #E07820)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                🚗 Sí, quiero reservar cochera
              </button>
              <button onClick={onDone}
                style={{ padding: '0.85rem', borderRadius: 12, border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
                No, continuar sin cochera →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Paso 2: Seleccionar ──────────────────────────────────────────────────
  if (paso === 'seleccionar') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.22)' }}>
          {/* Header */}
          <div style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1, borderBottom: '1px solid #F3F4F6', padding: '1.1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#111827' }}>Elige tu espacio</p>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11}/> {reserva.sede?.nombre}
              </p>
            </div>
            <button onClick={onDone} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={14} style={{ color: '#6B7280' }}/>
            </button>
          </div>

          <div style={{ padding: '1.25rem 1.5rem' }}>
            {/* Filtro tipo */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              {['', 'auto', 'moto', 'discapacitado'].map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  style={{ padding: '5px 14px', borderRadius: 9999, border: '1.5px solid', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', borderColor: tipo === t ? '#F5922E' : '#E5E7EB', background: tipo === t ? '#FFF7ED' : 'white', color: tipo === t ? '#F5922E' : '#6B7280' }}>
                  {t === '' ? 'Todos' : TIPO_ICONO[t] + ' ' + TIPO_LABEL[t]}
                </button>
              ))}
            </div>

            {loadingC ? (
              <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem 0' }}>Cargando espacios...</p>
            ) : cocherasFiltradas.length === 0 ? (
              /* Aforo máximo */
              <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#FEF2F2', borderRadius: 14, border: '1px solid #FCA5A5' }}>
                <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🚫</p>
                <p style={{ fontWeight: 800, color: '#DC2626', fontSize: '0.95rem', margin: '0 0 0.3rem' }}>Capacidad máxima alcanzada</p>
                <p style={{ color: '#6B7280', fontSize: '0.82rem', margin: 0 }}>
                  {tipo ? `No hay espacios para ${TIPO_LABEL[tipo].toLowerCase()} disponibles.` : 'Todas las cocheras están ocupadas para tus fechas.'}
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                  {cocherasFiltradas.length} espacio{cocherasFiltradas.length !== 1 ? 's' : ''} disponible{cocherasFiltradas.length !== 1 ? 's' : ''}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
                  {cocherasFiltradas.map(c => {
                    const sel = selected?.id === c.id
                    return (
                      <button key={c.id} onClick={() => setSelected(c)}
                        style={{ padding: '0.85rem 0.6rem', borderRadius: 14, border: `2px solid ${sel ? '#F5922E' : '#E5E7EB'}`, background: sel ? '#FFF7ED' : 'white', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', boxShadow: sel ? '0 0 0 3px rgba(245,146,46,0.15)' : 'none', position: 'relative' }}>
                        {sel && <span style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#F5922E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: 'white', fontWeight: 900 }}>✓</span>}
                        <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{TIPO_ICONO[c.tipo]}</div>
                        <p style={{ fontWeight: 800, color: sel ? '#F5922E' : '#111827', fontSize: '0.82rem', margin: '0 0 2px' }}>N° {c.numero}</p>
                        <p style={{ fontSize: '0.65rem', color: '#9CA3AF', margin: '0 0 4px' }}>{TIPO_LABEL[c.tipo]}</p>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: c.precio_noche > 0 ? '#374151' : '#10B981', margin: 0 }}>
                          {c.precio_noche > 0 ? `S/ ${c.precio_noche}/noche` : 'Incluido'}
                        </p>
                      </button>
                    )
                  })}
                </div>

                {/* Placa */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                    Placa del vehículo <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span>
                  </label>
                  <input
                    value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())}
                    placeholder="Ej: ABC-123"
                    style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.65rem 0.9rem', fontSize: '0.875rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.1em' }}
                  />
                </div>

                {error && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '0.7rem 1rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {error}
                  </div>
                )}

                <button onClick={reservarCochera} disabled={!selected || reservando}
                  style={{ width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', background: !selected ? '#E5E7EB' : 'linear-gradient(135deg, #F5922E, #E07820)', color: !selected ? '#9CA3AF' : 'white', fontWeight: 700, fontSize: '0.9rem', cursor: !selected ? 'not-allowed' : 'pointer', opacity: reservando ? 0.75 : 1 }}>
                  {reservando ? 'Reservando...' : selected ? `Reservar espacio N° ${selected.numero}` : 'Selecciona un espacio'}
                </button>
                <button onClick={onDone} style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.82rem', cursor: 'pointer', padding: '0.3rem' }}>
                  Continuar sin cochera
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Paso 3: Éxito cochera ────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 380, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.22)', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg, #10B981, #059669)', padding: '1.75rem 1.5rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
            <CheckCircle size={32} color="white"/>
          </div>
          <p style={{ color: 'white', fontWeight: 900, fontSize: '1.15rem', margin: '0 0 4px' }}>¡Espacio reservado!</p>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', margin: 0 }}>
            {TIPO_ICONO[cocheraRes?.cochera?.tipo]} Cochera N° {cocheraRes?.cochera?.numero}
          </p>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ background: '#F9FAFB', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
              <span style={{ color: '#6B7280' }}>Código cochera</span>
              <span style={{ fontWeight: 800, fontFamily: 'monospace', color: '#111827' }}>{cocheraRes?.codigo}</span>
            </div>
            {placa && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                <span style={{ color: '#6B7280' }}>Placa</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{placa}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#6B7280' }}>Total</span>
              <span style={{ fontWeight: 800, color: '#F5922E' }}>S/ {Number(cocheraRes?.precio_total ?? 0).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={onDone}
            style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
            Ver mis reservas →
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const { isMobile }  = useBreakpoint()

  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [tipoPago, setTipoPago]       = useState('adelanto')
  const [metodo, setMetodo]           = useState('')
  const [referencia, setRef]          = useState('')
  const [paying, setPaying]           = useState(false)
  const [showCochera, setShowCochera] = useState(false)
  const [culqiPaying, setCulqiPaying] = useState(false)
  const [culqiReady, setCulqiReady]   = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  // Cargar datos de la reserva
  useEffect(() => {
    pagosApi.getByReserva(reservaId)
      .then(r => {
        setData(r.data)
        if (r.data.pago) {
          navigate(`/reservas?nueva=${r.data.reserva.codigo}`, { replace: true })
        }
      })
      .catch(() => navigate('/reservas', { replace: true }))
      .finally(() => setLoading(false))
  }, [reservaId])

  // Inyectar Culqi.js
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.culqi.com/js/v4'
    script.async = true
    script.onload = () => setCulqiReady(true)
    document.head.appendChild(script)
    return () => {
      try { document.head.removeChild(script) } catch {}
    }
  }, [])

  // Callback global de Culqi
  const handleCulqiToken = useCallback(async (token) => {
    setCulqiPaying(true)
    setError('')
    try {
      await pagosApi.culqiCharge({ token, reserva_id: parseInt(reservaId) })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message ?? 'El pago fue rechazado. Intenta con otra tarjeta.')
    } finally {
      setCulqiPaying(false)
    }
  }, [reservaId, data, navigate])

  useEffect(() => {
    window.culqi = () => {
      if (window.Culqi?.token?.id) {
        const tokenId = window.Culqi.token.id
        window.Culqi.close()
        handleCulqiToken(tokenId)
      }
    }
    return () => { delete window.culqi }
  }, [handleCulqiToken])

  function openCulqi() {
    if (!window.Culqi || !culqiReady) return
    const reserva = data.reserva
    window.Culqi.publicKey = import.meta.env.VITE_CULQI_PUBLIC_KEY ?? ''
    window.Culqi.settings({
      title: 'Hotel Brisas de Mayo',
      currency: 'PEN',
      description: `Reserva ${reserva.codigo}`,
      amount: Math.round(parseFloat(reserva.precio_total) * 100),
    })
    window.Culqi.open()
  }

  async function handlePagar() {
    if (!metodo) return
    setPaying(true); setError('')
    try {
      await pagosApi.registrar(reservaId, {
        metodo_pago: metodo,
        tipo_pago:   tipoPago,
        referencia:  referencia || undefined,
      })
      setSuccess(true)
      setTimeout(() => navigate(`/reservas?nueva=${data.reserva.codigo}`), 2200)
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', padding: '2rem 1rem', gap: 0 }}>

        {/* Banner de éxito — siempre visible */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F0FDF4', border: '3px solid #86EFAC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <CheckCircle size={36} style={{ color: '#16A34A' }}/>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', margin: '0 0 0.4rem' }}>¡Pago registrado!</h2>
          <p style={{ color: '#6B7280', fontSize: '0.88rem', margin: 0 }}>
            Reserva <b style={{ color: '#3D1A06' }}>{data?.reserva?.codigo}</b> — un recepcionista verificará tu pago.
          </p>
        </div>

        {/* Pregunta cochera embebida — sin modal, sin timer */}
        {!showCochera ? (
          <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 18, border: '1px solid #E5E7EB', overflow: 'hidden', boxShadow: '0 4px 20px rgba(61,26,6,0.08)' }}>
            <div style={{ background: 'linear-gradient(135deg, #3D1A06, #7B4019)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Car size={20} color="white"/>
              </div>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 2px' }}>Estacionamiento</p>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>¿Vendrás con vehículo propio?</p>
              </div>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <p style={{ color: '#6B7280', fontSize: '0.82rem', lineHeight: 1.55, margin: 0 }}>
                Tenemos cocheras disponibles en <b>{data?.reserva?.sede?.nombre}</b>. Reserva tu espacio y llega sin preocupaciones.
              </p>
              <button
                onClick={() => setShowCochera(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #F5922E, #E07820)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                🚗 Sí, quiero reservar cochera
              </button>
              <button
                onClick={() => navigate(`/reservas?nueva=${data?.reserva?.codigo}`)}
                style={{ padding: '0.8rem', borderRadius: 12, border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' }}>
                No, ir a mis reservas →
              </button>
            </div>
          </div>
        ) : (
          /* Modal de selección de cochera */
          data?.reserva && (
            <ModalCochera
              reserva={data.reserva}
              initialPaso="seleccionar"
              onDone={() => navigate(`/reservas?nueva=${data.reserva.codigo}`)}
            />
          )
        )}
      </div>
    )
  }

  const { reserva } = data
  const noches      = Math.ceil((new Date(reserva.fecha_salida) - new Date(reserva.fecha_entrada)) / 86400000)
  const metodoInfo  = METODOS.find(m => m.id === metodo)
  const montoAdelanto = (reserva.precio_total * 0.5).toFixed(2)
  const montoTotal    = Number(reserva.precio_total).toFixed(2)
  const montoAPagar   = tipoPago === 'adelanto' ? montoAdelanto : montoTotal

  return (
    <div className="page-pad" style={{ maxWidth: 960, margin: '0 auto' }}>

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
      <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1.5rem' }}>Reserva <b style={{ color: '#3D1A06' }}>{reserva.codigo}</b> · elige cuánto pagar ahora</p>

      {/* ── Selector adelanto / completo ── */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E7EB', padding: '1.1rem 1.25rem', marginBottom: '1.75rem', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '0.85rem' }}>¿Cuánto quieres pagar ahora?</p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem' }}>

          {/* Adelanto 50% */}
          <button onClick={() => setTipoPago('adelanto')}
            style={{ textAlign: 'left', padding: '1rem 1.1rem', borderRadius: 14, cursor: 'pointer', border: `2px solid ${tipoPago === 'adelanto' ? '#F5922E' : '#E5E7EB'}`, background: tipoPago === 'adelanto' ? '#FFF7ED' : 'white', boxShadow: tipoPago === 'adelanto' ? '0 0 0 3px rgba(245,146,46,0.15)' : 'none', transition: 'all 0.18s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: tipoPago === 'adelanto' ? '#F5922E' : '#374151' }}>Adelanto 50%</span>
              {tipoPago === 'adelanto' && <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#F5922E', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckCircle size={12} color="white"/></span>}
            </div>
            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F5922E', margin: '0 0 0.3rem' }}>S/ {montoAdelanto}</p>
            <p style={{ fontSize: '0.73rem', color: '#9CA3AF', lineHeight: 1.4 }}>Pagas la mitad ahora. El recepcionista cobra el saldo (S/ {montoAdelanto}) al hacer el check-in.</p>
          </button>

          {/* Pago completo */}
          <button onClick={() => setTipoPago('total')}
            style={{ textAlign: 'left', padding: '1rem 1.1rem', borderRadius: 14, cursor: 'pointer', border: `2px solid ${tipoPago === 'total' ? '#10B981' : '#E5E7EB'}`, background: tipoPago === 'total' ? '#F0FDF4' : 'white', boxShadow: tipoPago === 'total' ? '0 0 0 3px rgba(16,185,129,0.15)' : 'none', transition: 'all 0.18s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: tipoPago === 'total' ? '#10B981' : '#374151' }}>Pago completo</span>
              {tipoPago === 'total' && <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckCircle size={12} color="white"/></span>}
            </div>
            <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981', margin: '0 0 0.3rem' }}>S/ {montoTotal}</p>
            <p style={{ fontSize: '0.73rem', color: '#9CA3AF', lineHeight: 1.4 }}>Paga el total ahora y evita cualquier trámite al llegar al hotel.</p>
          </button>

        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1.25rem' : '2rem' }}>

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
              <InfoRow label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13}/> Entrada</span>} value={new Date((reserva.fecha_entrada || '').split('T')[0] + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}/>
              <InfoRow label={<span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13}/> Salida</span>}  value={new Date((reserva.fecha_salida  || '').split('T')[0] + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' })}/>
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

          {/* Culqi — pago online con tarjeta */}
          <div style={{ background: 'linear-gradient(135deg,#1a0050,#3b0764)', borderRadius: 16, padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="white"/>
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Pago instantáneo con tarjeta</p>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', margin: 0 }}>Visa, Mastercard — procesado por Culqi</p>
              </div>
              <span style={{ marginLeft: 'auto', background: '#4ADE80', color: '#14532D', fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 9999, whiteSpace: 'nowrap' }}>
                CONFIRMACIÓN INMEDIATA
              </span>
            </div>

            {error && metodo === '' && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                {error}
              </div>
            )}

            <button
              onClick={openCulqi}
              disabled={culqiPaying || !culqiReady}
              style={{
                width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none',
                background: culqiPaying ? '#6B7280' : 'white',
                color: culqiPaying ? 'white' : '#3b0764',
                fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                transition: 'opacity 0.2s', opacity: culqiPaying ? 0.7 : 1,
              }}>
              <CreditCard size={18}/>
              {culqiPaying ? 'Procesando pago...' : `Pagar S/ ${montoAPagar} con tarjeta`}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }}/>
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>o paga manualmente</span>
            <div style={{ flex: 1, height: 1, background: '#E5E7EB' }}/>
          </div>

          <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B7280', marginBottom: '0.75rem' }}>Otros métodos de pago</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {METODOS.filter(m => m.id !== 'tarjeta').map(m => (
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

          {error && metodo !== '' && (
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
            {paying ? 'Procesando...' : !metodo ? 'Selecciona un método' : `Registrar pago — S/ ${montoAPagar}`}
          </button>

          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center', marginTop: '0.75rem' }}>
            Los métodos manuales quedan en estado <b>Pendiente</b> hasta que un recepcionista los verifique.
          </p>
        </div>
      </div>
    </div>
  )
}
