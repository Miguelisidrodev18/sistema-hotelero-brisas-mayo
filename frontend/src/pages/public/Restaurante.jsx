import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShoppingCart, Plus, Minus, X, Trash2, CreditCard, Banknote,
  ChefHat, CheckCircle, UtensilsCrossed, Flame, Leaf, Sparkles,
  Clock, Star, ArrowRight,
} from 'lucide-react'
import { restauranteApi } from '../../api/restaurante'

/* ── Brand tokens ─────────────────────────── */
const B = {
  orange: '#F5922E',
  gold:   '#D4A843',
  brown:  '#3D1A06',
  wood:   '#7B4019',
  cream:  '#FBF5ED',
}

/* ── Category emoji map ─────────────────── */
const CAT_EMOJI = {
  entradas: '🥗', ensaladas: '🥗', sopas: '🍲', fondos: '🍽️',
  segundos: '🍽️', carnes: '🥩', mariscos: '🦞', pastas: '🍝',
  pizzas: '🍕', postres: '🍮', bebidas: '🥤', jugos: '🍹',
  desayunos: '☕', sándwiches: '🥪', combos: '🎁',
}
function catEmoji(nombre) {
  const key = nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  return Object.entries(CAT_EMOJI).find(([k]) => key.includes(k))?.[1] ?? '🍴'
}

/* ── Skeleton card ─────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
      <div style={{ height: 200, background: 'linear-gradient(90deg,#F3F4F6 25%,#E5E7EB 50%,#F3F4F6 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}/>
      <div style={{ padding: '1rem' }}>
        <div style={{ height: 14, background: '#F3F4F6', borderRadius: 8, marginBottom: 8, width: '70%', animation: 'shimmer 1.5s infinite' }}/>
        <div style={{ height: 10, background: '#F3F4F6', borderRadius: 8, marginBottom: 16, width: '90%', animation: 'shimmer 1.5s infinite' }}/>
        <div style={{ height: 36, background: '#F3F4F6', borderRadius: 12, animation: 'shimmer 1.5s infinite' }}/>
      </div>
    </div>
  )
}

/* ── Plato card ────────────────────────── */
function PlatoCard({ plato, onAdd }) {
  const [added, setAdded] = useState(false)
  const [hovered, setHovered] = useState(false)

  function handleAdd() {
    onAdd(plato)
    setAdded(true)
    setTimeout(() => setAdded(false), 900)
  }

  const isPopular = parseFloat(plato.precio) >= 30
  const isNew = plato.id % 5 === 0

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'white', borderRadius: 20, overflow: 'hidden',
        border: `1.5px solid ${hovered ? B.orange + '40' : '#F3F4F6'}`,
        display: 'flex', flexDirection: 'column',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? '0 16px 40px rgba(61,26,6,0.14)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.25s cubic-bezier(.22,1,.36,1)',
        position: 'relative',
      }}>

      {/* Imagen */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden', flexShrink: 0 }}>
        {plato.imagen_url ? (
          <img
            src={plato.imagen_url}
            alt={plato.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hovered ? 'scale(1.07)' : 'scale(1)', transition: 'transform 0.4s ease' }}
            onError={e => { e.target.parentElement.style.background = `linear-gradient(135deg,${B.brown},${B.wood})` ; e.target.style.display='none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg,${B.brown},${B.wood})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UtensilsCrossed size={44} style={{ color: 'rgba(255,255,255,0.25)' }}/>
          </div>
        )}

        {/* Gradient overlay bottom */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }}/>

        {/* Precio sobre la imagen */}
        <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
          <span style={{ background: B.orange, color: 'white', fontWeight: 900, fontSize: '1rem', padding: '4px 12px', borderRadius: 10, letterSpacing: '0.01em', boxShadow: '0 2px 8px rgba(245,146,46,0.45)' }}>
            S/ {Number(plato.precio).toFixed(2)}
          </span>
        </div>

        {/* Badges top-right */}
        <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          {isPopular && (
            <span style={{ background: '#DC2626', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 3, letterSpacing: '0.04em' }}>
              <Flame size={10}/> POPULAR
            </span>
          )}
          {isNew && (
            <span style={{ background: '#7C3AED', color: 'white', fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 3, letterSpacing: '0.04em' }}>
              <Sparkles size={10}/> NUEVO
            </span>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '1rem 1.1rem 1.1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <h3 style={{ fontSize: '0.97rem', fontWeight: 800, color: B.brown, margin: 0, lineHeight: 1.3 }}>{plato.nombre}</h3>
        {plato.descripcion && (
          <p style={{ fontSize: '0.76rem', color: '#6B7280', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {plato.descripcion}
          </p>
        )}

        {/* Botón agregar */}
        <button
          onClick={handleAdd}
          style={{
            marginTop: 'auto', paddingTop: '0.6rem',
            width: '100%', padding: '0.65rem', borderRadius: 12, border: 'none',
            background: added
              ? `linear-gradient(135deg,#16A34A,#15803D)`
              : `linear-gradient(135deg,${B.orange},${B.wood})`,
            color: 'white', fontWeight: 700, fontSize: '0.85rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            transform: added ? 'scale(0.97)' : 'scale(1)',
            transition: 'all 0.2s ease',
            boxShadow: added ? '0 4px 16px rgba(21,128,61,0.4)' : '0 4px 16px rgba(245,146,46,0.3)',
          }}>
          {added ? <><CheckCircle size={16}/> Agregado</> : <><Plus size={16}/> Agregar al pedido</>}
        </button>
      </div>
    </div>
  )
}

/* ── Cart Drawer ───────────────────────── */
function CartDrawer({ items, onClose, onQty, onRemove, onCheckout }) {
  const [notas, setNotas] = useState('')
  const [mesa,  setMesa]  = useState('')
  const total = items.reduce((s, i) => s + i.precio * i.qty, 0)
  const mesaValida = mesa.trim() !== ''

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }} onClick={e => e.target === e.currentTarget && onClose()}>
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} onClick={onClose}/>

      {/* Panel */}
      <div style={{ width: 400, maxWidth: '95vw', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', background: `linear-gradient(135deg,${B.brown},${B.wood})`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={18} style={{ color: B.gold }}/>
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>Tu pedido</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', margin: 0 }}>{items.reduce((s,i)=>s+i.qty,0)} items</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}>
            <X size={18}/>
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <ShoppingCart size={28} style={{ color: '#D1D5DB' }}/>
              </div>
              <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>Tu carrito está vacío</p>
              <p style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>Agrega platos del menú para comenzar</p>
            </div>
          ) : (
            <>
              {items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 0', borderBottom: '1px solid #F9FAFB' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: B.brown, margin: '0 0 2px' }}>{item.nombre}</p>
                    <p style={{ fontSize: '0.78rem', color: B.orange, fontWeight: 700, margin: 0 }}>S/ {Number(item.precio).toFixed(2)} c/u</p>
                  </div>
                  {/* qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F9FAFB', borderRadius: 10, padding: '4px 6px' }}>
                    <button onClick={() => onQty(item.id, item.qty - 1)}
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#374151' }}>
                      <Minus size={12}/>
                    </button>
                    <span style={{ width: 22, textAlign: 'center', fontWeight: 800, fontSize: '0.875rem', color: B.brown }}>{item.qty}</span>
                    <button onClick={() => onQty(item.id, item.qty + 1)}
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', background: B.orange, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Plus size={12}/>
                    </button>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#111827', minWidth: 60, textAlign: 'right' }}>S/ {(item.precio * item.qty).toFixed(2)}</span>
                  <button onClick={() => onRemove(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FCA5A5', padding: 2, display: 'flex' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                    onMouseLeave={e => e.currentTarget.style.color = '#FCA5A5'}>
                    <Trash2 size={15}/>
                  </button>
                </div>
              ))}

              {/* Número de mesa — obligatorio */}
              <div style={{ marginTop: '1rem', background: mesa.trim() ? '#F0FDF4' : '#FFF1F2', border: `1.5px solid ${mesa.trim() ? '#86EFAC' : '#FCA5A5'}`, borderRadius: 14, padding: '1rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: mesa.trim() ? '#15803D' : '#DC2626', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                  🪑 Número de mesa <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {[1,2,3,4,5,6,7,8].map(n => (
                    <button key={n} type="button" onClick={() => setMesa(String(n))}
                      style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${mesa === String(n) ? '#15803D' : '#E5E7EB'}`, background: mesa === String(n) ? '#15803D' : 'white', color: mesa === String(n) ? 'white' : '#374151', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
                      {n}
                    </button>
                  ))}
                  <input
                    type="number" min="1" max="99"
                    value={mesa}
                    onChange={e => setMesa(e.target.value)}
                    placeholder="Otra"
                    style={{ width: 64, height: 44, borderRadius: 10, border: `2px solid ${mesa.trim() && isNaN(parseInt(mesa)) === false && ![...Array(8)].map((_,i)=>String(i+1)).includes(mesa) ? '#15803D' : '#E5E7EB'}`, textAlign: 'center', fontWeight: 700, fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', color: '#374151' }}
                  />
                </div>
                {!mesa.trim() && (
                  <p style={{ fontSize: '0.72rem', color: '#DC2626', marginTop: 6, margin: '6px 0 0' }}>Indica tu número de mesa para continuar</p>
                )}
              </div>

              {/* Notas */}
              <div style={{ marginTop: '0.75rem', background: '#FFFBEB', borderRadius: 12, padding: '0.85rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400E', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                  📝 Notas adicionales (opcional)
                </label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)}
                  placeholder="Ej: sin ají, extra salsa, sin cebolla…"
                  style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #FCD34D', borderRadius: 8, padding: '0.55rem 0.75rem', fontSize: '0.82rem', resize: 'none', minHeight: 56, fontFamily: 'inherit', outline: 'none', background: 'white', color: '#374151' }}/>
              </div>
            </>
          )}
        </div>

        {/* Footer total + CTA */}
        {items.length > 0 && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '2px solid #F3F4F6', background: 'white' }}>
            {/* Resumen */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 2px' }}>Total a pagar</p>
                <p style={{ fontSize: '1.6rem', fontWeight: 900, color: B.brown, margin: 0, lineHeight: 1 }}>S/ {total.toFixed(2)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: 0 }}>{items.reduce((s,i)=>s+i.qty,0)} platos</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                  <Clock size={11} style={{ color: '#9CA3AF' }}/>
                  <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>~20 min</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                const notaFinal = [`Mesa ${mesa.trim()}`, notas.trim()].filter(Boolean).join(' · ')
                onCheckout(notaFinal)
              }}
              disabled={!mesaValida}
              style={{ width: '100%', padding: '1rem', borderRadius: 14, border: 'none', background: mesaValida ? `linear-gradient(135deg,${B.orange},${B.wood})` : '#E5E7EB', color: mesaValida ? 'white' : '#9CA3AF', fontWeight: 800, fontSize: '1rem', cursor: mesaValida ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: mesaValida ? '0 6px 20px rgba(245,146,46,0.4)' : 'none', transition: 'all 0.2s' }}>
              {mesaValida ? <>Confirmar pedido — Mesa {mesa} <ArrowRight size={18}/></> : <>Selecciona tu mesa para continuar</>}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Pago Modal ─────────────────────────── */
function PagoModal({ pedido, onClose, onSuccess }) {
  const [culqiReady, setCulqiReady] = useState(false)
  const [paying,     setPaying]     = useState(false)
  const [error,      setError]      = useState('')
  const [metodo,     setMetodo]     = useState('tarjeta')

  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://checkout.culqi.com/js/v4'
    s.async = true
    s.onload = () => setCulqiReady(true)
    document.head.appendChild(s)
    return () => { try { document.head.removeChild(s) } catch {} }
  }, [])

  const handleToken = useCallback(async (token) => {
    setPaying(true); setError('')
    try { await restauranteApi.pagarCulqi(pedido.id, token); onSuccess() }
    catch (err) { setError(err.response?.data?.message ?? 'El pago fue rechazado.') }
    finally { setPaying(false) }
  }, [pedido.id, onSuccess])

  useEffect(() => {
    window.culqi = () => {
      if (window.Culqi?.token?.id) {
        const t = window.Culqi.token.id; window.Culqi.close(); handleToken(t)
      }
    }
    return () => { delete window.culqi }
  }, [handleToken])

  function openCulqi() {
    if (!window.Culqi || !culqiReady) return
    window.Culqi.publicKey = import.meta.env.VITE_CULQI_PUBLIC_KEY ?? ''
    window.Culqi.settings({ title: 'Restaurante Brisas de Mayo', currency: 'PEN', description: `Pedido #${pedido.codigo}`, amount: Math.round(parseFloat(pedido.total) * 100) })
    window.Culqi.open()
  }

  async function pagarEfectivo() {
    setPaying(true); setError('')
    try { await restauranteApi.pagarEfectivo(pedido.id, 'efectivo'); onSuccess() }
    catch (err) { setError(err.response?.data?.message ?? 'Error.') }
    finally { setPaying(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 420, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${B.brown},${B.wood})`, padding: '1.75rem 1.75rem 3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Pedido listo</p>
              <p style={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>#{pedido.codigo}</p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}>
              <X size={16}/>
            </button>
          </div>
          <p style={{ color: B.gold, fontSize: '1.8rem', fontWeight: 900, margin: '0.5rem 0 0' }}>S/ {Number(pedido.total).toFixed(2)}</p>
        </div>

        <div style={{ padding: '1.5rem', marginTop: -16 }}>
          {/* Método selector */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { id: 'tarjeta', icon: CreditCard, label: 'Tarjeta', sub: 'Visa / Mastercard' },
              { id: 'efectivo', icon: Banknote, label: 'Efectivo', sub: 'Pago en caja' },
            ].map(opt => (
              <button key={opt.id} onClick={() => setMetodo(opt.id)}
                style={{ padding: '0.85rem', borderRadius: 12, border: `2px solid ${metodo === opt.id ? B.orange : '#E5E7EB'}`, background: metodo === opt.id ? '#FFF7ED' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', transition: 'all 0.15s' }}>
                <opt.icon size={20} style={{ color: metodo === opt.id ? B.orange : '#9CA3AF', flexShrink: 0 }}/>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.82rem', color: metodo === opt.id ? B.brown : '#374151', margin: 0 }}>{opt.label}</p>
                  <p style={{ fontSize: '0.68rem', color: '#9CA3AF', margin: 0 }}>{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#DC2626', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button
            onClick={metodo === 'tarjeta' ? openCulqi : pagarEfectivo}
            disabled={paying || (metodo === 'tarjeta' && !culqiReady)}
            style={{ width: '100%', padding: '1rem', borderRadius: 14, border: 'none', background: paying ? '#9CA3AF' : `linear-gradient(135deg,${B.orange},${B.wood})`, color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: paying ? 0.7 : 1, boxShadow: paying ? 'none' : '0 6px 20px rgba(245,146,46,0.4)' }}>
            {paying ? 'Procesando...' : metodo === 'tarjeta' ? <><CreditCard size={18}/> Pagar con tarjeta</> : <><Banknote size={18}/> Pagar en efectivo</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Confirmación ─────────────────────── */
function ConfirmacionModal({ pedido, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>
        {/* Banner verde */}
        <div style={{ background: 'linear-gradient(135deg,#16A34A,#15803D)', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', border: '3px solid rgba(255,255,255,0.3)' }}>
            <CheckCircle size={30} style={{ color: 'white' }}/>
          </div>
          <h2 style={{ color: 'white', fontSize: '1.3rem', fontWeight: 900, margin: '0 0 4px' }}>¡Pedido confirmado!</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', margin: 0 }}>El equipo de cocina ya está preparando tu pedido</p>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Código */}
          <div style={{ background: '#FFFBEB', border: '1.5px dashed #FCD34D', borderRadius: 14, padding: '1rem', textAlign: 'center', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Tu código de pedido</p>
            <p style={{ fontSize: '2rem', fontWeight: 900, color: B.brown, margin: '0 0 4px', letterSpacing: '0.08em' }}>#{pedido.codigo}</p>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>Tiempo estimado: ~20 minutos</p>
          </div>

          {/* Items */}
          <div style={{ marginBottom: '1.25rem' }}>
            {pedido.items?.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #F9FAFB', fontSize: '0.85rem' }}>
                <span style={{ color: '#374151' }}><strong style={{ color: B.orange }}>{item.cantidad}×</strong> {item.plato?.nombre}</span>
                <span style={{ fontWeight: 700, color: '#374151' }}>S/ {Number(item.subtotal).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0 0', fontWeight: 900, fontSize: '0.95rem' }}>
              <span style={{ color: B.brown }}>Total pagado</span>
              <span style={{ color: B.orange }}>S/ {Number(pedido.total).toFixed(2)}</span>
            </div>
          </div>

          <button onClick={onClose}
            style={{ width: '100%', padding: '0.9rem', borderRadius: 14, border: 'none', background: `linear-gradient(135deg,${B.orange},${B.wood})`, color: 'white', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 6px 20px rgba(245,146,46,0.4)' }}>
            ¡Hacer otro pedido! 🍴
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ────────────────────── */
export default function Restaurante() {
  const [menu,         setMenu]       = useState([])
  const [loading,      setLoading]    = useState(true)
  const [catActiva,    setCatActiva]  = useState(null)
  const [carrito,      setCarrito]    = useState([])
  const [cartOpen,     setCartOpen]   = useState(false)
  const [creando,      setCreando]    = useState(false)
  const [pedidoCreado, setPedido]     = useState(null)
  const [showPago,     setShowPago]   = useState(false)
  const [showConfirm,  setConfirm]    = useState(false)
  const tabsRef = useRef(null)

  useEffect(() => {
    restauranteApi.menu()
      .then(r => { setMenu(r.data); if (r.data.length) setCatActiva(r.data[0].id) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function addToCart(plato) {
    setCarrito(prev => {
      const ex = prev.find(i => i.id === plato.id)
      if (ex) return prev.map(i => i.id === plato.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { id: plato.id, nombre: plato.nombre, precio: parseFloat(plato.precio), qty: 1 }]
    })
  }

  function setQty(id, qty) {
    if (qty <= 0) setCarrito(prev => prev.filter(i => i.id !== id))
    else setCarrito(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  async function handleCheckout(notas) {
    setCartOpen(false); setCreando(true)
    try {
      const { data } = await restauranteApi.pedido({ items: carrito.map(i => ({ plato_id: i.id, cantidad: i.qty })), notas: notas || null })
      setPedido(data); setShowPago(true)
    } catch (err) { alert(err.response?.data?.message ?? 'No se pudo crear el pedido.') }
    finally { setCreando(false) }
  }

  function handlePaySuccess() { setShowPago(false); setConfirm(true); setCarrito([]) }
  function handleConfirmClose() { setConfirm(false); setPedido(null) }

  const totalQty  = carrito.reduce((s, i) => s + i.qty, 0)
  const totalAmt  = carrito.reduce((s, i) => s + i.precio * i.qty, 0)
  const catMenu   = menu.find(c => c.id === catActiva)

  return (
    <div style={{ minHeight: '100vh', background: '#F8F4EF', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Navbar ── */}
      <nav style={{ background: B.brown, padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200, boxShadow: '0 2px 20px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Volver al inicio */}
          <a href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: 500, textDecoration: 'none', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 10px', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'white' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}>
            ← Inicio
          </a>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <img src="/images/Logo-hotel.jpeg" alt="" style={{ height: 34, width: 34, objectFit: 'contain', borderRadius: 6 }}/>
            <div>
              <p style={{ color: 'white', fontWeight: 900, fontSize: '0.9rem', margin: 0, lineHeight: 1.2 }}>Brisas de Mayo</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', margin: 0 }}>Restaurante</p>
            </div>
          </a>
        </div>
        <button onClick={() => setCartOpen(true)}
          style={{ position: 'relative', background: totalQty > 0 ? B.orange : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, height: 42, paddingInline: totalQty > 0 ? '1rem' : '0.75rem', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>
          <ShoppingCart size={18}/>
          {totalQty > 0 && <span>S/ {totalAmt.toFixed(2)}</span>}
          {totalQty > 0 && (
            <span style={{ position: 'absolute', top: -7, right: -7, background: '#DC2626', color: 'white', fontSize: '0.68rem', fontWeight: 800, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
              {totalQty}
            </span>
          )}
        </button>
      </nav>

      {/* ── Hero ── */}
      <div style={{ background: `linear-gradient(135deg,${B.brown} 0%,${B.wood} 60%,#A0522D 100%)`, padding: '2.5rem 1.5rem 5rem', position: 'relative', overflow: 'hidden' }}>
        {/* decorative circle */}
        <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
        <div style={{ position: 'absolute', right: 40, top: 20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(212,168,67,0.1)' }}/>

        <div style={{ maxWidth: 600, position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 999, padding: '5px 14px', marginBottom: '0.75rem' }}>
            <Star size={12} style={{ color: B.gold }}/>
            <span style={{ color: B.gold, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em' }}>RESTAURANTE BRISAS DE MAYO</span>
          </div>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.75rem,4vw,2.6rem)', fontWeight: 900, lineHeight: 1.15, margin: '0 0 0.65rem' }}>
            Sabores que te <span style={{ color: B.gold }}>enamoran</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', margin: '0 0 1.25rem', maxWidth: 440 }}>
            Gastronomía peruana auténtica · Ingredientes locales · Lista en ~20 min
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[['🕐', '10am – 10pm'], ['📍', 'Huancaya, Yauyos'], ['⭐', '4.8 / 5.0']].map(([e, t]) => (
              <span key={t} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 12px', color: 'rgba(255,255,255,0.75)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                {e} {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Category Tabs — overlapping hero ── */}
      <div style={{ maxWidth: 1200, margin: '-2.5rem auto 0', padding: '0 1.5rem', position: 'relative', zIndex: 10 }}>
        <div ref={tabsRef} style={{ background: 'white', borderRadius: 18, boxShadow: '0 8px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
              {Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ height: 40, width: 110, background: '#F3F4F6', borderRadius: 10, flexShrink: 0, animation: 'shimmer 1.5s infinite' }}/>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', padding: '0.5rem' }}>
              {menu.map(cat => (
                <button key={cat.id} onClick={() => setCatActiva(cat.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.65rem 1.1rem', borderRadius: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: catActiva === cat.id ? 800 : 500, fontSize: '0.875rem', background: catActiva === cat.id ? `linear-gradient(135deg,${B.orange},${B.wood})` : 'transparent', color: catActiva === cat.id ? 'white' : '#6B7280', transition: 'all 0.2s', fontFamily: 'inherit', flexShrink: 0 }}>
                  <span style={{ fontSize: '1.1em' }}>{catEmoji(cat.nombre)}</span>
                  {cat.nombre}
                  <span style={{ fontSize: '0.68rem', opacity: 0.7, fontWeight: 400 }}>({cat.platos?.length ?? 0})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Grid de platos ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '1.25rem' }}>
            {Array(6).fill(0).map((_, i) => <SkeletonCard key={i}/>)}
          </div>
        ) : !catMenu || catMenu.platos?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
            <p style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🍽️</p>
            <p style={{ fontWeight: 700, color: '#374151', marginBottom: 4 }}>Sin platos en esta categoría</p>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Prueba con otra categoría del menú</p>
          </div>
        ) : (
          <>
            {/* Encabezado de sección */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.6rem' }}>{catEmoji(catMenu.nombre)}</span>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: B.brown, margin: 0 }}>{catMenu.nombre}</h2>
                <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>{catMenu.platos.length} platos disponibles</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(250px,1fr))', gap: '1.25rem' }}>
              {catMenu.platos.map(p => <PlatoCard key={p.id} plato={p} onAdd={addToCart}/>)}
            </div>
          </>
        )}
      </div>

      {/* ── FAB carrito flotante (solo cuando tiene items) ── */}
      {totalQty > 0 && !cartOpen && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 300 }}>
          <button onClick={() => setCartOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.9rem 1.75rem', borderRadius: 999, border: 'none', background: `linear-gradient(135deg,${B.brown},${B.wood})`, color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', boxShadow: '0 8px 32px rgba(61,26,6,0.45)', whiteSpace: 'nowrap' }}>
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={20}/>
              <span style={{ position: 'absolute', top: -8, right: -8, background: B.orange, color: 'white', fontSize: '0.65rem', fontWeight: 900, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(61,26,6,0.5)' }}>{totalQty}</span>
            </div>
            <span>Ver pedido</span>
            <span style={{ background: B.orange, padding: '3px 10px', borderRadius: 999, fontSize: '0.82rem' }}>S/ {totalAmt.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* ── Overlay cargando ── */}
      {creando && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 18, padding: '2rem 2.5rem', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${B.orange}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}/>
            <p style={{ fontWeight: 700, color: B.brown, margin: 0 }}>Creando tu pedido…</p>
            <p style={{ color: '#9CA3AF', fontSize: '0.82rem', marginTop: 4 }}>Un momento por favor</p>
          </div>
        </div>
      )}

      {cartOpen  && <CartDrawer items={carrito} onClose={() => setCartOpen(false)} onQty={setQty} onRemove={id => setCarrito(p => p.filter(i => i.id !== id))} onCheckout={handleCheckout}/>}
      {showPago  && pedidoCreado && <PagoModal  pedido={pedidoCreado} onClose={() => setShowPago(false)}  onSuccess={handlePaySuccess}/>}
      {showConfirm && pedidoCreado && <ConfirmacionModal pedido={pedidoCreado} onClose={handleConfirmClose}/>}
    </div>
  )
}
