import { useState, useEffect, useCallback } from 'react'
import {
  UtensilsCrossed, Plus, Minus, X, RefreshCw, Users, Lock, Unlock,
  ChefHat, Clock, CheckCircle, Package, Banknote, CreditCard, ShoppingCart,
} from 'lucide-react'
import { mesasApi } from '../../api/mesas'
import { restauranteApi } from '../../api/restaurante'

const ESTADO_MESA = {
  libre:       { label: 'Libre',      bg: '#F0FDF4', border: '#86EFAC', badge: '#16A34A' },
  ocupada:     { label: 'Ocupada',    bg: '#FFF7ED', border: '#FDBA74', badge: '#EA580C' },
  por_cobrar:  { label: 'Por cobrar', bg: '#FEF2F2', border: '#FCA5A5', badge: '#DC2626' },
}

const ESTADO_PEDIDO = {
  pendiente:  { label: 'Nuevo',      icon: Clock,       color: '#F59E0B' },
  preparando: { label: 'Preparando', icon: ChefHat,     color: '#3B82F6' },
  listo:      { label: 'Listo',      icon: CheckCircle, color: '#22C55E' },
  entregado:  { label: 'Entregado',  icon: Package,     color: '#6B7280' },
}

/* ── Selector de menú para tomar un pedido ─────────────── */
function TomarPedidoModal({ mesa, menu, onClose, onSubmit, saving }) {
  const [carrito, setCarrito] = useState([])
  const [notas, setNotas] = useState('')
  const [catActiva, setCatActiva] = useState(menu[0]?.id ?? null)

  function addItem(plato) {
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

  const total = carrito.reduce((s, i) => s + i.precio * i.qty, 0)
  const catMenu = menu.find(c => c.id === catActiva)

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 880, maxHeight: '90vh', display: 'flex', overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.3)' }}>

        {/* Menú */}
        <div style={{ flex: 1.3, display: 'flex', flexDirection: 'column', borderRight: '1px solid #F3F4F6', minWidth: 0 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', margin: 0 }}>Nuevo pedido — Mesa {mesa.numero}</p>
              <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>Selecciona los platos a agregar</p>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: 'none', background: '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16}/>
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, padding: '0.75rem 1.25rem', overflowX: 'auto', borderBottom: '1px solid #F3F4F6' }}>
            {menu.map(cat => (
              <button key={cat.id} onClick={() => setCatActiva(cat.id)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: 9, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 700, fontSize: '0.8rem', background: catActiva === cat.id ? '#F5922E' : '#F3F4F6', color: catActiva === cat.id ? 'white' : '#6B7280', flexShrink: 0 }}>
                {cat.nombre}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
            {!catMenu || catMenu.platos?.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem' }}>Sin platos en esta categoría</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.6rem' }}>
                {catMenu.platos.map(p => (
                  <button key={p.id} onClick={() => addItem(p)}
                    style={{ textAlign: 'left', border: '1.5px solid #F3F4F6', borderRadius: 12, padding: '0.7rem 0.8rem', background: 'white', cursor: 'pointer' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827', margin: '0 0 4px' }}>{p.nombre}</p>
                    <p style={{ fontWeight: 800, fontSize: '0.85rem', color: '#F5922E', margin: 0 }}>S/ {Number(p.precio).toFixed(2)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Carrito */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6' }}>
            <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShoppingCart size={16}/> Pedido ({carrito.reduce((s,i)=>s+i.qty,0)})
            </p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
            {carrito.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: '0.82rem', textAlign: 'center', padding: '2rem 0' }}>Toca un plato para agregarlo</p>
            ) : carrito.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 0', borderBottom: '1px solid #F9FAFB' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.nombre}</p>
                  <p style={{ fontSize: '0.72rem', color: '#F5922E', margin: 0 }}>S/ {(item.precio * item.qty).toFixed(2)}</p>
                </div>
                <button onClick={() => setQty(item.id, item.qty - 1)} style={{ width: 22, height: 22, borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={11}/></button>
                <span style={{ width: 18, textAlign: 'center', fontWeight: 700, fontSize: '0.8rem' }}>{item.qty}</span>
                <button onClick={() => setQty(item.id, item.qty + 1)} style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: '#F5922E', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11}/></button>
              </div>
            ))}
          </div>
          <div style={{ padding: '0.9rem 1.25rem', borderTop: '1px solid #F3F4F6' }}>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas (opcional)…"
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: 8, padding: '0.5rem 0.65rem', fontSize: '0.78rem', resize: 'none', minHeight: 44, fontFamily: 'inherit', marginBottom: '0.6rem' }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Total</span>
              <span style={{ fontWeight: 800, color: '#111827' }}>S/ {total.toFixed(2)}</span>
            </div>
            <button
              disabled={carrito.length === 0 || saving}
              onClick={() => onSubmit(carrito, notas)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: 10, border: 'none', background: carrito.length === 0 ? '#E5E7EB' : '#F5922E', color: carrito.length === 0 ? '#9CA3AF' : 'white', fontWeight: 800, cursor: carrito.length === 0 ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Enviando a cocina…' : 'Enviar a cocina'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Panel de detalle de una mesa ─────────────────────── */
function MesaDrawer({ mesa, onClose, onNuevoPedido, onEntregado, onCobrar, onLiberar, busy }) {
  const pedidos = mesa.pedidos ?? []
  const hayActivos = pedidos.some(p => !(p.estado === 'entregado' && p.pagado))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={onClose}/>
      <div style={{ width: 420, maxWidth: '95vw', background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-12px 0 40px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', margin: 0 }}>Mesa {mesa.numero}</p>
            <p style={{ fontSize: '0.78rem', color: '#9CA3AF', margin: 0 }}>{ESTADO_MESA[mesa.estado]?.label}{mesa.capacidad ? ` · ${mesa.capacidad} personas` : ''}</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#F3F4F6', cursor: 'pointer' }}><X size={16}/></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          {pedidos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9CA3AF' }}>
              <UtensilsCrossed size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }}/>
              <p>Sin pedidos activos en esta mesa</p>
            </div>
          ) : pedidos.map(p => {
            const est = ESTADO_PEDIDO[p.estado]
            const EstIcon = est.icon
            return (
              <div key={p.id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: '0.85rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>#{p.codigo}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 700, color: est.color }}>
                    <EstIcon size={12}/> {est.label}
                  </span>
                </div>
                {p.items?.map(it => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#374151', padding: '2px 0' }}>
                    <span><strong style={{ color: '#F5922E' }}>{it.cantidad}×</strong> {it.plato?.nombre}</span>
                    <span>S/ {Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: '0.78rem', color: '#6B7280' }}>{p.pagado ? '✅ Pagado' : 'Pendiente de pago'}</span>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>S/ {Number(p.total).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: '0.6rem' }}>
                  {p.estado === 'listo' && (
                    <button disabled={busy} onClick={() => onEntregado(p.id)}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                      📦 Marcar entregado
                    </button>
                  )}
                  {p.estado === 'entregado' && !p.pagado && (
                    <>
                      <button disabled={busy} onClick={() => onCobrar(p.id, 'efectivo')}
                        style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Banknote size={12}/> Cobrar efectivo
                      </button>
                      <button disabled={busy} onClick={() => onCobrar(p.id, 'tarjeta')}
                        style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', background: '#DBEAFE', color: '#1D4ED8', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <CreditCard size={12}/> Cobrar tarjeta
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #F3F4F6', display: 'flex', gap: '0.6rem' }}>
          <button onClick={onNuevoPedido}
            style={{ flex: 1, padding: '0.75rem', borderRadius: 10, border: 'none', background: '#F5922E', color: 'white', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={16}/> Nuevo pedido
          </button>
          <button disabled={busy || hayActivos || mesa.estado === 'libre'} onClick={onLiberar}
            title={hayActivos ? 'Hay pedidos sin entregar o sin pagar' : ''}
            style={{ flex: 1, padding: '0.75rem', borderRadius: 10, border: '1.5px solid #E5E7EB', background: (hayActivos || mesa.estado === 'libre') ? '#F9FAFB' : 'white', color: (hayActivos || mesa.estado === 'libre') ? '#D1D5DB' : '#374151', fontWeight: 800, cursor: (hayActivos || mesa.estado === 'libre') ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Unlock size={16}/> Liberar mesa
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Mozo() {
  const [mesas, setMesas]     = useState([])
  const [menu, setMenu]       = useState([])
  const [loading, setLoading] = useState(true)
  const [seleccion, setSeleccion] = useState(null)
  const [tomandoPedido, setTomandoPedido] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [busy, setBusy]       = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { data } = await mesasApi.index()
      setMesas(data)
      setSeleccion(prev => prev ? (data.find(m => m.id === prev.id) ?? null) : null)
    } catch {}
    finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => { load(); restauranteApi.menu().then(r => setMenu(r.data)).catch(() => {}) }, [load])

  useEffect(() => {
    const interval = setInterval(() => load(true), 8000)
    return () => clearInterval(interval)
  }, [load])

  async function handleOcupar(mesa) {
    setBusy(true)
    try { await mesasApi.ocupar(mesa.id); await load(true) }
    catch (err) { alert(err.response?.data?.message ?? 'No se pudo ocupar la mesa.') }
    finally { setBusy(false) }
  }

  async function handleLiberar() {
    if (!seleccion) return
    setBusy(true)
    try { await mesasApi.liberar(seleccion.id); await load(true) }
    catch (err) { alert(err.response?.data?.message ?? 'No se pudo liberar la mesa.') }
    finally { setBusy(false) }
  }

  async function handleEntregado(pedidoId) {
    setBusy(true)
    try { await restauranteApi.entregado(pedidoId); await load(true) }
    catch (err) { alert(err.response?.data?.message ?? 'No se pudo marcar como entregado.') }
    finally { setBusy(false) }
  }

  async function handleCobrar(pedidoId, metodo) {
    setBusy(true)
    try { await restauranteApi.pagarEfectivo(pedidoId, metodo); await load(true) }
    catch (err) { alert(err.response?.data?.message ?? 'No se pudo registrar el cobro.') }
    finally { setBusy(false) }
  }

  async function handleSubmitPedido(carrito, notas) {
    if (!seleccion) return
    setSaving(true)
    try {
      await restauranteApi.pedido({
        items: carrito.map(i => ({ plato_id: i.id, cantidad: i.qty })),
        notas: notas || null,
        mesa_id: seleccion.id,
      })
      setTomandoPedido(false)
      await load(true)
    } catch (err) { alert(err.response?.data?.message ?? 'No se pudo enviar el pedido.') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={22} style={{ color: '#F5922E' }}/>
          <div>
            <h1 className="section-title">Salón — Mesas</h1>
            <p className="section-subtitle">Toma pedidos y envíalos a cocina — actualización cada 8 s</p>
          </div>
        </div>
        <button onClick={() => load()} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <RefreshCw size={15} style={{ color: '#6B7280' }}/>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>Cargando mesas...</div>
      ) : mesas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
          <Lock size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }}/>
          <p>Aún no hay mesas registradas. Pide al administrador que las cree.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '1rem' }}>
          {mesas.map(mesa => {
            const est = ESTADO_MESA[mesa.estado]
            const activos = (mesa.pedidos ?? []).length
            return (
              <button key={mesa.id} onClick={() => setSeleccion(mesa)}
                style={{ background: est.bg, border: `1.5px solid ${est.border}`, borderRadius: 16, padding: '1.1rem 0.9rem', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
                <p style={{ fontWeight: 900, fontSize: '1.4rem', color: '#111827', margin: '0 0 4px' }}>Mesa {mesa.numero}</p>
                <span style={{ display: 'inline-block', background: est.badge, color: 'white', fontSize: '0.68rem', fontWeight: 700, padding: '2px 9px', borderRadius: 999 }}>
                  {est.label}
                </span>
                {activos > 0 && (
                  <span style={{ position: 'absolute', top: 10, right: 10, background: '#DC2626', color: 'white', fontSize: '0.68rem', fontWeight: 800, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {activos}
                  </span>
                )}
                {mesa.capacidad && <p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: '6px 0 0' }}>{mesa.capacidad} personas</p>}
              </button>
            )
          })}
        </div>
      )}

      {seleccion && !tomandoPedido && (
        <MesaDrawer
          mesa={seleccion}
          busy={busy}
          onClose={() => setSeleccion(null)}
          onNuevoPedido={() => {
            if (seleccion.estado === 'libre') handleOcupar(seleccion)
            setTomandoPedido(true)
          }}
          onEntregado={handleEntregado}
          onCobrar={handleCobrar}
          onLiberar={handleLiberar}
        />
      )}

      {seleccion && tomandoPedido && (
        <TomarPedidoModal
          mesa={seleccion}
          menu={menu}
          saving={saving}
          onClose={() => setTomandoPedido(false)}
          onSubmit={handleSubmitPedido}
        />
      )}
    </div>
  )
}
