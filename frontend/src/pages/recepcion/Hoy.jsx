import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'
import { reservasApi } from '../../api/reservas'
import { pagosApi } from '../../api/pagos'
import axiosClient from '../../api/axiosClient'
import {
  ArrowRightToLine, ArrowLeftFromLine, BedDouble,
  Sparkles, Users, DollarSign, RefreshCw, Phone, CreditCard,
  AlertCircle, X, CheckCircle, Banknote, Smartphone, Building2,
} from 'lucide-react'

const METODOS_SALDO = [
  { id: 'efectivo',      label: 'Efectivo',        icon: Banknote,   color: '#15803D' },
  { id: 'yape',          label: 'Yape',             icon: Smartphone, color: '#7C3AED' },
  { id: 'plin',          label: 'Plin',             icon: Smartphone, color: '#0369A1' },
  { id: 'transferencia', label: 'Transferencia',    icon: Building2,  color: '#0F766E' },
  { id: 'tarjeta',       label: 'Tarjeta',          icon: CreditCard, color: '#1D4ED8' },
]

function ModalSaldo({ reserva, onClose, onConfirmado }) {
  const [metodo, setMetodo] = useState('efectivo')
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  async function registrar() {
    setSaving(true); setError('')
    try {
      await pagosApi.registrarSaldo(reserva.id, { metodo_pago: metodo })
      onConfirmado()
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al registrar el saldo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>

        {/* Cabecera */}
        <div style={{ background: 'linear-gradient(135deg, #F5922E, #E07820)', padding: '1.25rem 1.5rem', position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
            <X size={14}/>
          </button>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>Cobro de saldo pendiente</p>
          <p style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem', margin: 0 }}>{reserva.codigo} — {reserva.cliente?.name}</p>
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* Monto a cobrar */}
          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Saldo a cobrar ahora</p>
              <p style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F5922E', margin: '2px 0 0' }}>S/ {Number(reserva.saldo_pendiente).toFixed(2)}</p>
            </div>
            <AlertCircle size={28} style={{ color: '#F5922E', opacity: 0.6 }}/>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#6B7280', marginBottom: '1rem' }}>Selecciona el método de pago del huésped:</p>

          {/* Métodos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '1.1rem' }}>
            {METODOS_SALDO.map(m => {
              const Icon = m.icon
              const sel = metodo === m.id
              return (
                <button key={m.id} onClick={() => setMetodo(m.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.65rem 1rem', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${sel ? m.color : '#E5E7EB'}`, background: sel ? m.color + '10' : 'white', transition: 'all 0.15s' }}>
                  <Icon size={15} style={{ color: sel ? m.color : '#9CA3AF', flexShrink: 0 }}/>
                  <span style={{ fontSize: '0.85rem', fontWeight: sel ? 700 : 500, color: sel ? m.color : '#374151' }}>{m.label}</span>
                  {sel && <CheckCircle size={14} style={{ color: m.color, marginLeft: 'auto' }}/>}
                </button>
              )
            })}
          </div>

          {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.82rem', marginBottom: '0.85rem' }}>{error}</div>}

          <button onClick={registrar} disabled={saving}
            style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', background: saving ? '#9CA3AF' : 'linear-gradient(135deg, #F5922E, #E07820)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.8 : 1 }}>
            {saving ? 'Registrando...' : `Cobrar S/ ${Number(reserva.saldo_pendiente).toFixed(2)} y continuar`}
          </button>
          <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: '0.5rem', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.82rem', cursor: 'pointer', padding: '0.3rem' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

const TIPO_LABEL = {
  matrimonial: 'Matrimonial', matrimonial_king: 'King', matrimonial_queen: 'Queen',
  matrimonial_adicional: 'Mat. Adicional', doble: 'Doble', triple: 'Triple',
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} style={{ color }}/>
      </div>
      <div>
        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 2 }}>{label}</p>
      </div>
    </div>
  )
}

function ReservaRow({ r, accionLabel, accionColor, accionBg, onAccion, loading }) {
  const noches       = Math.ceil((new Date(r.fecha_salida) - new Date(r.fecha_entrada)) / 86400000)
  const tieneSaldo   = r.saldo_pendiente > 0

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid #F3F4F6', flexWrap: 'wrap' }}>
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', color: '#3D1A06' }}>{r.codigo}</span>
          <span style={{ background: '#F3F4F6', color: '#6B7280', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999 }}>
            Hab. {r.habitacion?.numero} — {TIPO_LABEL[r.habitacion?.tipo] ?? r.habitacion?.tipo}
          </span>
          {tieneSaldo && (
            <span style={{ background: '#FEF9C3', color: '#854D0E', fontSize: '0.63rem', fontWeight: 700, padding: '2px 8px', borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertCircle size={10}/> Saldo S/ {Number(r.saldo_pendiente).toFixed(2)}
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>{r.cliente?.name}</p>
        <div style={{ display: 'flex', gap: '0.85rem', marginTop: 3 }}>
          {r.cliente?.telefono && (
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Phone size={10}/> {r.cliente.telefono}
            </span>
          )}
          {r.cliente?.dni && (
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 3 }}>
              <CreditCard size={10}/> {r.cliente.dni}
            </span>
          )}
        </div>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#6B7280', flexShrink: 0 }}>
        <div>{r.sede?.nombre}</div>
        <div style={{ color: '#9CA3AF' }}>{noches} noche{noches > 1 ? 's' : ''}</div>
      </div>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: '0.8rem', color: '#9CA3AF', marginBottom: 1 }}>Total</div>
        <div style={{ fontWeight: 800, color: '#F5922E' }}>S/ {r.precio_total}</div>
        {tieneSaldo && (
          <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 600 }}>
            Pagado: S/ {(r.precio_total - r.saldo_pendiente).toFixed(2)}
          </div>
        )}
      </div>
      <button
        onClick={() => onAccion(r)}
        disabled={loading}
        style={{ padding: '0.5rem 1rem', borderRadius: 10, border: 'none', background: tieneSaldo ? '#F5922E' : accionBg, color: accionColor, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0, opacity: loading ? 0.6 : 1 }}>
        {tieneSaldo ? '💰 Cobrar saldo + Check-in' : accionLabel}
      </button>
    </div>
  )
}

export default function Hoy() {
  const toast = useToast()
  const { confirm, dialog } = useConfirm()
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [actionId, setActionId]   = useState(null)
  const [modalSaldo, setModalSaldo] = useState(null) // reserva con saldo pendiente

  const hoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: d } = await axiosClient.get('/recepcion/hoy')
      setData(d)
    } catch { toast.error('No se pudo cargar el panel.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function hacerCheckin(reserva) {
    // Si hay saldo pendiente, primero cobrar
    if (reserva.saldo_pendiente > 0) {
      setModalSaldo(reserva)
      return
    }
    ejecutarCheckin(reserva.id)
  }

  async function ejecutarCheckin(id) {
    const ok = await confirm({ title: 'Confirmar check-in', message: '¿Registrar el ingreso del huésped?', confirmLabel: 'Check-in' })
    if (!ok) return
    setActionId(id)
    try { await reservasApi.checkin(id); toast.success('Check-in registrado.'); load() }
    catch (e) { toast.error(e.response?.data?.message ?? 'Error al hacer check-in.') }
    finally { setActionId(null) }
  }

  async function saldoPagado() {
    const id = modalSaldo.id
    setModalSaldo(null)
    toast.success('Saldo cobrado. Procediendo con el check-in...')
    await ejecutarCheckin(id)
  }

  async function hacerCheckout(reserva) {
    const id = reserva.id ?? reserva
    const ok = await confirm({ title: 'Confirmar check-out', message: '¿Registrar la salida del huésped?', confirmLabel: 'Check-out' })
    if (!ok) return
    setActionId(id)
    try { await reservasApi.checkout(id); toast.success('Check-out registrado.'); load() }
    catch (e) { toast.error(e.response?.data?.message ?? 'Error al hacer check-out.') }
    finally { setActionId(null) }
  }

  const stats = data?.stats ?? {}

  return (
    <div style={{ maxWidth: 1000 }}>
      {modalSaldo && (
        <ModalSaldo
          reserva={modalSaldo}
          onClose={() => setModalSaldo(null)}
          onConfirmado={saldoPagado}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginBottom: 2 }}>Panel del día</h1>
          <p style={{ fontSize: '0.82rem', color: '#9CA3AF', textTransform: 'capitalize' }}>{hoy}</p>
        </div>
        <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.55rem 1rem', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: '#6B7280', fontWeight: 600 }}>
          <RefreshCw size={14}/> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        <StatCard icon={ArrowRightToLine} label="Llegadas hoy"   value={loading ? '—' : stats.llegadas}    color="#2563EB" bg="#DBEAFE"/>
        <StatCard icon={ArrowLeftFromLine} label="Salidas hoy"   value={loading ? '—' : stats.salidas}     color="#7C3AED" bg="#EDE9FE"/>
        <StatCard icon={Users}             label="En el hotel"   value={loading ? '—' : stats.en_hotel}    color="#065F46" bg="#D1FAE5"/>
        <StatCard icon={BedDouble}         label="Disponibles"   value={loading ? '—' : stats.disponibles} color="#16A34A" bg="#F0FDF4"/>
        <StatCard icon={Sparkles}          label="En limpieza"   value={loading ? '—' : stats.limpieza}    color="#D97706" bg="#FEF3C7"/>
        <StatCard icon={DollarSign}        label="Ingresos hoy"  value={loading ? '—' : `S/ ${Number(stats.ingresos_dia ?? 0).toFixed(0)}`} color="#F5922E" bg="#FFF7ED"/>
      </div>

      {/* Llegadas */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', marginBottom: '1.25rem', overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1rem', background: '#DBEAFE', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowRightToLine size={16} style={{ color: '#2563EB' }}/>
          <p style={{ fontWeight: 700, color: '#1E40AF', fontSize: '0.9rem', margin: 0 }}>
            Llegadas hoy ({data?.llegadas?.length ?? 0})
          </p>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>Cargando...</div>
        ) : !data?.llegadas?.length ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
            No hay llegadas programadas para hoy.
          </div>
        ) : data.llegadas.map(r => (
          <ReservaRow
            key={r.id} r={r}
            accionLabel="Check-in ✓"
            accionColor="white" accionBg="#2563EB"
            onAccion={hacerCheckin}
            loading={actionId === r.id}
          />
        ))}
      </div>

      {/* Salidas */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '0.85rem 1rem', background: '#EDE9FE', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowLeftFromLine size={16} style={{ color: '#7C3AED' }}/>
          <p style={{ fontWeight: 700, color: '#6D28D9', fontSize: '0.9rem', margin: 0 }}>
            Salidas hoy ({data?.salidas?.length ?? 0})
          </p>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>Cargando...</div>
        ) : !data?.salidas?.length ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem' }}>
            No hay salidas programadas para hoy.
          </div>
        ) : data.salidas.map(r => (
          <ReservaRow
            key={r.id} r={r}
            accionLabel="Check-out ✓"
            accionColor="white" accionBg="#7C3AED"
            onAccion={hacerCheckout}
            loading={actionId === r.id}
          />
        ))}
      </div>

      {dialog}
    </div>
  )
}
