import { useState, useEffect, useCallback, useRef } from 'react'
import { QrCode, X, Search, CheckCircle, ArrowRight, User, BedDouble, Calendar, MapPin, FileDown, Keyboard, Camera, CreditCard, Car, AlertCircle, Printer, Receipt } from 'lucide-react'
import { reservasApi } from '../../api/reservas'
import { codigosDescuentoApi } from '../../api/codigosDescuento'
import { pagosApi } from '../../api/pagos'
import { cocherasApi } from '../../api/cocheras'
import { serviciosApi } from '../../api/servicios'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'
import axiosClient from '../../api/axiosClient'
import { todayLocal } from '../../utils/date'

const METODO_LABEL = { yape:'Yape', plin:'Plin', transferencia:'Transferencia', efectivo:'Efectivo', tarjeta:'Tarjeta' }
const TIPO_PAGO_LABEL = { adelanto:'Adelanto 50%', saldo:'Saldo', total:'Completo' }

function calcPagos(pagos = [], total) {
  const verif = pagos.filter(p => p.estado === 'verificado')
  const pend  = pagos.filter(p => p.estado === 'pendiente')
  const pagado = verif.reduce((s, p) => s + Number(p.monto), 0)
  const saldo  = Math.max(0, Number(total) - pagado)
  return { verif, pend, pagado, saldo }
}

const ESTADO_STYLE = {
  pendiente:  { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente'  },
  confirmada: { bg: '#DBEAFE', color: '#1E40AF', label: 'Confirmada' },
  checkin:    { bg: '#D1FAE5', color: '#065F46', label: 'En hotel'   },
  finalizada: { bg: '#F3F4F6', color: '#374151', label: 'Finalizada' },
  cancelada:  { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelada'  },
  expirada:   { bg: '#F3F4F6', color: '#6B7280', label: 'Expirada'   },
}

function EstadoBadge({ estado }) {
  const s = ESTADO_STYLE[estado] ?? ESTADO_STYLE.pendiente
  return <span style={{ ...s, padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>{s.label}</span>
}

function AccionBtn({ label, color, bg, border, onClick }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${border}`, background: bg, color, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {label}
    </button>
  )
}

// ── Sub-componente: escáner de cámara ────────────────────────
const QR_DIV_ID = 'qr-cam-reader'

function QrCamScanner({ onResult, onError }) {
  const scannerRef = useRef(null)
  const activeRef  = useRef(true)
  const [ready, setReady]   = useState(false)
  const [status, setStatus] = useState('Buscando cámara...')

  useEffect(() => {
    activeRef.current = true

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!activeRef.current) return

      // Usar getCameras() para obtener el ID real de la cámara — más fiable que facingMode
      Html5Qrcode.getCameras()
        .then(cameras => {
          if (!activeRef.current) return
          if (!cameras || cameras.length === 0) {
            onError('No se encontró ninguna cámara en este dispositivo.')
            return
          }

          // Preferir cámara trasera (mobile) o la primera disponible
          const cam = cameras.find(c =>
            /back|rear|environment|trasera/i.test(c.label)
          ) ?? cameras[0]

          setStatus('Iniciando ' + (cam.label || 'cámara') + '...')

          const scanner = new Html5Qrcode(QR_DIV_ID)
          scannerRef.current = scanner

          const config = { fps: 10, qrbox: { width: 220, height: 220 } }
          const onScan  = (text) => {
            if (!activeRef.current) return
            const code = text.startsWith('BRISAS:') ? text.slice(7) : text.trim().toUpperCase()
            scanner.stop().catch(() => {}).finally(() => { try { scanner.clear() } catch {} })
            onResult(code)
          }

          scanner.start(cam.id, config, onScan, () => {})
            .then(() => { if (activeRef.current) setReady(true) })
            .catch(err => {
              if (!activeRef.current) return
              onError('No se pudo iniciar la cámara. Verifica los permisos del navegador.')
            })
        })
        .catch(() => onError('Sin acceso a las cámaras. Verifica los permisos del navegador.'))

    }).catch(() => onError('No se pudo cargar el módulo de escaneo.'))

    return () => {
      activeRef.current = false
      const s = scannerRef.current
      if (s) {
        s.stop().catch(() => {}).finally(() => { try { s.clear() } catch {} })
      }
    }
  }, [])

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden', background: '#111', position: 'relative', minHeight: 280 }}>
      {!ready && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2, gap: 8 }}>
          <div style={{ width: 28, height: 28, border: '3px solid #16A34A', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', textAlign: 'center', padding: '0 1rem' }}>{status}</p>
        </div>
      )}
      <div id={QR_DIV_ID} style={{ width: '100%' }} />
      {ready && (
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', padding: '0.4rem 0.5rem 0.6rem', background: '#111' }}>
          Apunta al código QR de la reserva del huésped
        </p>
      )}
    </div>
  )
}

// ── Modal: nueva reserva presencial / llamada ────────────────
// Estado de disponibilidad de una habitación según sus fechas ocupadas
function statusHab(hab) {
  const hoy = todayLocal()
  const fut  = (hab.fechas_ocupadas ?? []).filter(f => f.salida >= hoy)
  if (!fut.length) return { dot:'#16A34A', label:'Disponible', bg:'#F0FDF4', color:'#166534' }

  const actual = fut.find(f => f.entrada <= hoy)
  if (actual) return { dot:'#DC2626', label:'Ocupada hoy', bg:'#FEF2F2', color:'#991B1B' }

  const prox  = fut.sort((a,b) => a.entrada.localeCompare(b.entrada))[0]
  const dStr  = new Date(prox.entrada + 'T12:00:00').toLocaleDateString('es-PE', { day:'2-digit', month:'short' })
  return { dot:'#D97706', label:`Próx: ${dStr}`, bg:'#FFFBEB', color:'#92400E' }
}

// ¿El rango entrada-salida choca con alguna fecha ocupada?
function hayConflicto(fechasOcupadas, entrada, salida) {
  if (!entrada || !salida || !fechasOcupadas?.length) return false
  return fechasOcupadas.some(({ entrada: e, salida: s }) =>
    entrada < s && salida > e
  )
}

const TIPO_GRADIENTS_REC = {
  matrimonial:'linear-gradient(135deg,#7B4019,#3D1A06)',
  matrimonial_king:'linear-gradient(135deg,#1a1a2e,#16213e)',
  matrimonial_queen:'linear-gradient(135deg,#0f766e,#134e4a)',
  matrimonial_adicional:'linear-gradient(135deg,#b45309,#78350f)',
  doble:'linear-gradient(135deg,#1e40af,#1e3a8a)',
  triple:'linear-gradient(135deg,#5b21b6,#3b0764)',
}

function ModalNuevaReserva({ onClose, onCreada }) {
  const [paso, setPaso]               = useState(1) // 1=cliente 2=habitación 3=detalles 4=pago
  const [cliente, setCliente]         = useState(null)
  const [busqCliente, setBusqCliente] = useState('')
  const [resultados, setResultados]   = useState([])
  const [buscandoC, setBuscandoC]     = useState(false)
  const [nuevoCliente, setNuevoCliente]   = useState({ name:'', email:'', telefono:'', dni:'' })
  const [docNumero, setDocNumero]         = useState('')
  const [buscandoDoc, setBuscandoDoc]     = useState(false)
  const [docEncontrado, setDocEncontrado] = useState(null) // nombre hallado
  const [docError, setDocError]           = useState('')
  const [modoCliente, setModoCliente] = useState('buscar') // 'buscar' | 'nuevo'

  const [habitaciones, setHabitaciones] = useState([])
  const [habSede, setHabSede]           = useState('')
  const [habPiso, setHabPiso]           = useState(null) // null = todos
  const [sedes, setSedes]               = useState([])
  const [habsSel, setHabsSel]           = useState([])   // array — soporta múltiples
  const [loadingHab, setLoadingHab]     = useState(false)

  const [form, setForm] = useState({
    fecha_entrada: '', fecha_salida: '', hora_checkin: '14:00', hora_checkout: '12:00', num_huespedes: 1,
    origen: 'presencial', notas: '',
    descuento: false, descuento_tipo: 'pct', descuento_pct: '', descuento_motivo: '', descuento_precio_fijo: '',
    pago_ahora: false, pago_tipo: 'total', pago_metodo: 'efectivo', pago_ref: '',
  })

  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [acompanantes, setAcompanantes] = useState([]) // [{ nombre, dni, tipo }]

  // Estados para validación del código de descuento
  const [codigoAuth, setCodigoAuth]           = useState('')
  const [codigoValido, setCodigoValido]       = useState(null)   // null | true | false
  const [codigoInfo, setCodigoInfo]           = useState(null)   // { descripcion, vence, mensaje }
  const [codigoValidando, setCodigoValidando] = useState(false)

  // habSel = primera habitación (compatibilidad con Paso 3 cuando hay exactamente 1)
  const habSel = habsSel.length === 1 ? habsSel[0] : null

  const today   = todayLocal()
  const noches  = form.fecha_entrada && form.fecha_salida
    ? Math.ceil((new Date(form.fecha_salida) - new Date(form.fecha_entrada)) / 86400000) : 0
  const precioBaseTotal   = habsSel.reduce((s, h) => s + Number(h.precio), 0) * noches
  const precioBase        = precioBaseTotal   // alias para compatibilidad
  const usaPrecioFijo     = form.descuento && form.descuento_tipo === 'fijo' && habsSel.length === 1 && Number(form.descuento_precio_fijo) > 0
  const descuentoAmt      = form.descuento && form.descuento_tipo === 'pct' && form.descuento_pct && codigoValido
    ? precioBase * Number(form.descuento_pct) / 100 : 0
  const precioFinal       = usaPrecioFijo
    ? Number(form.descuento_precio_fijo) * noches
    : precioBase - descuentoAmt
  const montoPago     = form.pago_tipo === 'adelanto' ? precioFinal * 0.5 : precioFinal

  const inp = { border:'1.5px solid #E5E7EB', borderRadius:10, padding:'0.6rem 0.85rem', fontSize:'0.875rem', outline:'none', width:'100%', boxSizing:'border-box' }
  const lbl = { display:'block', fontSize:'0.75rem', fontWeight:600, color:'#374151', marginBottom:'0.3rem' }

  // Validar código de descuento en tiempo real (solo modo porcentaje)
  useEffect(() => {
    if (!form.descuento || form.descuento_tipo !== 'pct' || !codigoAuth.trim()) {
      setCodigoValido(null); setCodigoInfo(null); return
    }
    if (codigoAuth.length < 4) { setCodigoValido(null); setCodigoInfo(null); return }
    const t = setTimeout(async () => {
      setCodigoValidando(true)
      try {
        const { data } = await codigosDescuentoApi.validar(codigoAuth)
        setCodigoValido(data.valido)
        setCodigoInfo(data.valido
          ? { descripcion: data.descripcion, vence: data.vence }
          : { mensaje: data.mensaje })
      } catch { setCodigoValido(false); setCodigoInfo({ mensaje: 'Error de conexión.' }) }
      finally { setCodigoValidando(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [codigoAuth, form.descuento, form.descuento_tipo])

  // Buscar clientes
  useEffect(() => {
    if (busqCliente.length < 2) { setResultados([]); return }
    const t = setTimeout(() => {
      setBuscandoC(true)
      axiosClient.get('/recepcion/clientes', { params: { search: busqCliente } })
        .then(r => setResultados(r.data))
        .catch(() => {})
        .finally(() => setBuscandoC(false))
    }, 350)
    return () => clearTimeout(t)
  }, [busqCliente])

  // Cargar habitaciones disponibles (resetea piso al cambiar sede)
  useEffect(() => {
    if (paso !== 2) return
    setHabPiso(null)
    setLoadingHab(true)
    const params = habSede ? { sede: habSede } : {}
    axiosClient.get('/habitaciones/disponibles', { params })
      .then(r => {
        const sorted = [...r.data].sort((a, b) => a.piso - b.piso || a.numero - b.numero)
        setHabitaciones(sorted)
      })
      .catch(() => {})
      .finally(() => setLoadingHab(false))
  }, [paso, habSede])

  useEffect(() => {
    axiosClient.get('/sedes/publicas').then(r => setSedes(r.data))
  }, [])

  async function buscarDocumento() {
    const num = docNumero.replace(/\D/g,'')
    if (num.length !== 8 && num.length !== 11) return
    setBuscandoDoc(true); setDocError(''); setDocEncontrado(null)
    try {
      const { data } = await axiosClient.get(`/recepcion/documento/${num}`)
      const nombre = data.nombre ?? `${data.nombres ?? ''} ${data.apellidoPaterno ?? ''} ${data.apellidoMaterno ?? ''}`.trim()
      setDocEncontrado(nombre)
      // Pre-cargar todos los campos disponibles desde la API
      setNuevoCliente(f => ({
        ...f,
        name:     nombre || f.name,
        dni:      num.length === 8 ? num : f.dni,
        telefono: data.telefono || f.telefono,
        email:    data.email    || f.email,
      }))
      // Verificar si ya existe en el sistema (consulta rápida por DNI)
      if (num.length === 8) {
        axiosClient.get('/recepcion/clientes', { params:{ search: num } })
          .then(r => {
            const match = r.data.find(c => c.dni === num)
            if (match) setDocEncontrado(nombre + ' · ya tiene cuenta')
          }).catch(()=>{})
      }
    } catch (e) {
      setDocError(e.response?.data?.message ?? 'No se encontró el documento.')
    } finally { setBuscandoDoc(false) }
  }

  async function crearClienteRapido() {
    if (!nuevoCliente.name.trim()) return
    setBuscandoC(true); setError('')
    try {
      const res = await axiosClient.post('/recepcion/clientes', nuevoCliente)
      // 200 = cliente existente reutilizado, 201 = nuevo creado
      setCliente(res.data)
      setPaso(2)
    } catch (e) {
      const msg = e.response?.data?.message ?? e.response?.data?.errors?.email?.[0] ?? 'Error al registrar cliente.'
      setError(msg)
    } finally { setBuscandoC(false) }
  }

  async function confirmar() {
    if (habsSel.length < 1 || noches < 1) return
    setSaving(true); setError('')
    try {
      const payload = {
        ...(habsSel.length === 1 ? { habitacion_id: habsSel[0].id } : { habitaciones: habsSel.map(h => h.id) }),
        user_id:       cliente?.id,
        fecha_entrada: form.fecha_entrada,
        fecha_salida:  form.fecha_salida,
        hora_checkin:  form.hora_checkin,
        hora_checkout: form.hora_checkout,
        num_huespedes: form.num_huespedes,
        origen:        form.origen,
        notas:         form.notas || undefined,
        // Descuento modo porcentaje (con código)
        descuento_porcentaje: form.descuento && form.descuento_tipo === 'pct' && form.descuento_pct && codigoValido ? form.descuento_pct : undefined,
        descuento_motivo:     form.descuento && form.descuento_motivo ? form.descuento_motivo : undefined,
        codigo_descuento:     form.descuento && form.descuento_tipo === 'pct' && codigoValido ? codigoAuth.toUpperCase() : undefined,
        // Descuento modo precio fijo
        precio_noche_personalizado: usaPrecioFijo ? Number(form.descuento_precio_fijo) : undefined,
        pago_metodo:   form.pago_ahora ? form.pago_metodo : undefined,
        pago_tipo:     form.pago_ahora ? form.pago_tipo   : undefined,
        pago_referencia: form.pago_ref || undefined,
      }
      const res = await reservasApi.create(payload)
      const reservaId = res.data?.id ?? res.data?.reservas?.[0]?.id
      // Guardar acompañantes si hay
      const acompValidos = acompanantes.filter(a => a.nombre.trim())
      if (reservaId && acompValidos.length > 0) {
        try {
          await axiosClient.post(`/reservas/${reservaId}/huespedes`, { huespedes: acompValidos })
        } catch {}
      }
      onCreada(res.data?.codigo ?? res.data?.reservas?.[0]?.codigo)
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al crear la reserva.')
    } finally { setSaving(false) }
  }

  const StepDot = ({ n }) => (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <div style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.72rem', fontWeight:700, background: paso >= n ? '#3D1A06' : '#E5E7EB', color: paso >= n ? 'white' : '#9CA3AF' }}>{paso > n ? '✓' : n}</div>
      {n < 4 && <div style={{ width:30, height:2, background: paso > n ? '#3D1A06' : '#E5E7EB', borderRadius:9999 }}/>}
    </div>
  )

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:600, maxHeight:'94vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ position:'sticky', top:0, background:'white', zIndex:1, borderBottom:'1px solid #F3F4F6', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:'0.98rem', color:'#111827', margin:0 }}>Nueva reserva presencial</p>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:0 }}>Registro por recepción</p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            {[1,2,3,4].map(n => <StepDot key={n} n={n}/>)}
            <button onClick={onClose} style={{ marginLeft:8, background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={18}/></button>
          </div>
        </div>

        <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* ── PASO 1: CLIENTE ── */}
          {paso === 1 && (
            <div>
              <p style={{ fontWeight:700, fontSize:'0.9rem', color:'#111827', margin:'0 0 0.85rem' }}>¿Quién hace la reserva?</p>
              <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem' }}>
                {['buscar','nuevo'].map(m => (
                  <button key={m} onClick={() => setModoCliente(m)}
                    style={{ padding:'6px 16px', borderRadius:9999, border:'1.5px solid', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', borderColor:modoCliente===m?'#3D1A06':'#E5E7EB', background:modoCliente===m?'#3D1A06':'white', color:modoCliente===m?'white':'#6B7280' }}>
                    {m==='buscar'?'🔍 Buscar cliente':'➕ Registrar nuevo'}
                  </button>
                ))}
              </div>

              {modoCliente === 'buscar' ? (
                <>
                  <input style={inp} placeholder="Nombre, email, DNI o teléfono..." value={busqCliente}
                    onChange={e => setBusqCliente(e.target.value)}/>
                  {buscandoC && <p style={{ fontSize:'0.78rem', color:'#9CA3AF', margin:'4px 0' }}>Buscando...</p>}
                  {resultados.length > 0 && (
                    <div style={{ border:'1px solid #E5E7EB', borderRadius:10, marginTop:8, overflow:'hidden' }}>
                      {resultados.map(c => (
                        <div key={c.id} onClick={() => { setCliente(c); setPaso(2) }}
                          style={{ padding:'0.7rem 1rem', cursor:'pointer', borderBottom:'1px solid #F3F4F6', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                          onMouseEnter={e => e.currentTarget.style.background='#FDF6ED'}
                          onMouseLeave={e => e.currentTarget.style.background='white'}>
                          <div>
                            <p style={{ fontWeight:600, color:'#111827', fontSize:'0.85rem', margin:0 }}>{c.name}</p>
                            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:0 }}>{c.email} {c.dni&&`· DNI ${c.dni}`} {c.telefono&&`· ${c.telefono}`}</p>
                          </div>
                          <span style={{ fontSize:'0.75rem', color:'#F5922E', fontWeight:600 }}>Seleccionar →</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {busqCliente.length >= 2 && !buscandoC && resultados.length === 0 && (
                    <p style={{ fontSize:'0.78rem', color:'#9CA3AF', marginTop:6 }}>No se encontró ningún cliente. Prueba con "Registrar nuevo".</p>
                  )}
                  <button onClick={() => { setCliente(null); setPaso(2) }}
                    style={{ marginTop:'0.75rem', width:'100%', padding:'0.65rem', borderRadius:10, border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', fontSize:'0.82rem', fontWeight:600, cursor:'pointer' }}>
                    Continuar sin asociar cliente →
                  </button>
                </>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

                  {/* Búsqueda por DNI / RUC */}
                  <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:12, padding:'0.85rem 1rem' }}>
                    <label style={{ ...lbl, color:'#166534', marginBottom:'0.5rem' }}>
                      🔍 Buscar por DNI o RUC (autocompletar nombre)
                    </label>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <input
                        style={{ ...inp, flex:1, fontFamily:'monospace', letterSpacing:'0.08em' }}
                        placeholder="8 dígitos (DNI) o 11 dígitos (RUC)"
                        value={docNumero}
                        onChange={e => { setDocNumero(e.target.value.replace(/\D/g,'')); setDocEncontrado(null); setDocError('') }}
                        onKeyDown={e => e.key === 'Enter' && buscarDocumento()}
                        maxLength={11}
                      />
                      <button
                        onClick={buscarDocumento}
                        disabled={buscandoDoc || (docNumero.length !== 8 && docNumero.length !== 11)}
                        style={{ padding:'0.6rem 1rem', borderRadius:10, border:'none', background:docNumero.length===8||docNumero.length===11?'#16A34A':'#9CA3AF', color:'white', fontWeight:700, fontSize:'0.82rem', cursor:'pointer', whiteSpace:'nowrap', opacity:buscandoDoc?0.7:1 }}>
                        {buscandoDoc ? '...' : 'Consultar'}
                      </button>
                    </div>
                    {docEncontrado && (
                      <div style={{ marginTop:6, display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', color:'#166534', fontWeight:600 }}>
                        <span>✅</span> <span>Encontrado: <b>{docEncontrado}</b> — datos precargados</span>
                      </div>
                    )}
                    {docError && (
                      <p style={{ margin:'4px 0 0', fontSize:'0.75rem', color:'#DC2626' }}>{docError}</p>
                    )}
                    <p style={{ margin:'4px 0 0', fontSize:'0.68rem', color:'#9CA3AF' }}>
                      Fuente: RENIEC / SUNAT via apis.net.pe
                    </p>
                  </div>

                  {/* Separador */}
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ flex:1, height:1, background:'#E5E7EB' }}/>
                    <span style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>o ingresa manualmente</span>
                    <div style={{ flex:1, height:1, background:'#E5E7EB' }}/>
                  </div>

                  <div>
                    <label style={lbl}>Nombre completo *</label>
                    <input style={inp} placeholder="Ej: Juan Pérez" value={nuevoCliente.name}
                      onChange={e => setNuevoCliente(f => ({...f, name:e.target.value}))}/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem' }}>
                    <div>
                      <label style={lbl}>Teléfono</label>
                      <input style={inp} placeholder="999888777" value={nuevoCliente.telefono}
                        onChange={e => setNuevoCliente(f => ({...f, telefono:e.target.value}))}/>
                    </div>
                    <div>
                      <label style={lbl}>DNI</label>
                      <input style={inp} placeholder="12345678" value={nuevoCliente.dni}
                        onChange={e => setNuevoCliente(f => ({...f, dni:e.target.value}))}/>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Email (opcional)</label>
                    <input style={inp} placeholder="correo@ejemplo.com" value={nuevoCliente.email}
                      onChange={e => setNuevoCliente(f => ({...f, email:e.target.value}))}/>
                  </div>
                  {error && <p style={{ color:'#DC2626', fontSize:'0.78rem' }}>{error}</p>}
                  <button onClick={crearClienteRapido} disabled={!nuevoCliente.name.trim() || buscandoC}
                    style={{ padding:'0.75rem', borderRadius:10, border:'none', background:'#3D1A06', color:'white', fontWeight:700, cursor:'pointer', opacity:!nuevoCliente.name.trim()?0.5:1 }}>
                    {buscandoC ? 'Registrando...' : 'Registrar y continuar →'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── PASO 2: HABITACIÓN ── */}
          {paso === 2 && (() => {
            const pisos        = [...new Set(habitaciones.map(h => h.piso))].sort((a,b) => a - b)
            const habFiltradas = habPiso !== null ? habitaciones.filter(h => h.piso === habPiso) : habitaciones
            const grupos       = pisos
              .filter(p => habPiso === null || p === habPiso)
              .map(p => ({ piso: p, habs: habFiltradas.filter(h => h.piso === p) }))
              .filter(g => g.habs.length > 0)

            return (
              <div>
                {cliente && (
                  <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:10, padding:'0.6rem 1rem', marginBottom:'0.85rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#166534' }}>👤 {cliente.name}</span>
                    <button onClick={() => setPaso(1)} style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:'0.72rem', cursor:'pointer' }}>Cambiar</button>
                  </div>
                )}

                <p style={{ fontWeight:700, fontSize:'0.9rem', color:'#111827', margin:'0 0 0.65rem' }}>Selecciona la habitación</p>

                {/* Chips sede */}
                <div style={{ display:'flex', gap:'0.4rem', marginBottom:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em', marginRight:2 }}>Sede</span>
                  <button onClick={() => setHabSede('')}
                    style={{ padding:'4px 12px', borderRadius:9999, border:'1.5px solid', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', borderColor:!habSede?'#F5922E':'#E5E7EB', background:!habSede?'#FFF7ED':'white', color:!habSede?'#F5922E':'#6B7280' }}>
                    Todas
                  </button>
                  {sedes.map(s => (
                    <button key={s.id} onClick={() => setHabSede(s.slug)}
                      style={{ padding:'4px 12px', borderRadius:9999, border:'1.5px solid', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', borderColor:habSede===s.slug?'#F5922E':'#E5E7EB', background:habSede===s.slug?'#FFF7ED':'white', color:habSede===s.slug?'#F5922E':'#6B7280' }}>
                      {s.nombre}
                    </button>
                  ))}
                </div>

                {/* Chips piso — solo si hay más de 1 piso */}
                {!loadingHab && pisos.length > 1 && (
                  <div style={{ display:'flex', gap:'0.4rem', marginBottom:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
                    <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.05em', marginRight:2 }}>Piso</span>
                    <button onClick={() => setHabPiso(null)}
                      style={{ padding:'4px 12px', borderRadius:9999, border:'1.5px solid', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', borderColor:habPiso===null?'#3D1A06':'#E5E7EB', background:habPiso===null?'#3D1A06':'white', color:habPiso===null?'white':'#6B7280' }}>
                      Todos
                    </button>
                    {pisos.map(p => (
                      <button key={p} onClick={() => setHabPiso(habPiso===p ? null : p)}
                        style={{ padding:'4px 12px', borderRadius:9999, border:'1.5px solid', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', borderColor:habPiso===p?'#3D1A06':'#E5E7EB', background:habPiso===p?'#3D1A06':'white', color:habPiso===p?'white':'#6B7280', minWidth:64 }}>
                        🏢 Piso {p}
                      </button>
                    ))}
                  </div>
                )}

                {loadingHab ? (
                  <p style={{ color:'#9CA3AF', textAlign:'center', padding:'2rem' }}>Cargando habitaciones...</p>
                ) : habFiltradas.length === 0 ? (
                  <p style={{ color:'#9CA3AF', textAlign:'center', padding:'2rem' }}>No hay habitaciones disponibles.</p>
                ) : (
                  <div>
                    {grupos.map(({ piso, habs }) => (
                      <div key={piso} style={{ marginBottom:'1.25rem' }}>
                        {/* Separador de piso cuando hay más de 1 */}
                        {pisos.length > 1 && (
                          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.6rem' }}>
                            <div style={{ background:'#3D1A06', color:'white', fontSize:'0.68rem', fontWeight:800, padding:'3px 12px', borderRadius:9999, flexShrink:0 }}>
                              Piso {piso}
                            </div>
                            <div style={{ flex:1, height:1, background:'#F3F4F6' }}/>
                            <span style={{ fontSize:'0.68rem', color:'#9CA3AF', flexShrink:0 }}>
                              {habs.length} hab{habs.length!==1?'s':''}
                            </span>
                          </div>
                        )}
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'0.6rem' }}>
                          {habs.map(h => {
                              const st = statusHab(h)
                              const esSel = habsSel.some(x => x.id === h.id)
                              const ocupada = st.dot === '#DC2626'
                              return (
                                <div key={h.id}
                                  onClick={() => {
                                    if (ocupada) return
                                    setHabsSel(prev => esSel ? prev.filter(x => x.id !== h.id) : [...prev, h])
                                  }}
                                  style={{ border:`2px solid ${esSel ? '#F5922E' : ocupada ? '#FCA5A5' : '#E5E7EB'}`, borderRadius:14, overflow:'hidden', cursor: ocupada ? 'not-allowed' : 'pointer', transition:'all 0.15s', opacity: ocupada ? 0.75 : 1, position:'relative' }}
                                  onMouseEnter={e => { if(!ocupada && !esSel){ e.currentTarget.style.borderColor='#F5922E'; e.currentTarget.style.transform='translateY(-2px)' } }}
                                  onMouseLeave={e => { e.currentTarget.style.borderColor=esSel?'#F5922E':ocupada?'#FCA5A5':'#E5E7EB'; e.currentTarget.style.transform='none' }}>
                                  {esSel && (
                                    <div style={{ position:'absolute', top:6, left:6, width:22, height:22, borderRadius:'50%', background:'#F5922E', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, zIndex:1 }}>
                                      ✓
                                    </div>
                                  )}
                                  <div style={{ height:72, background:TIPO_GRADIENTS_REC[h.tipo]??TIPO_GRADIENTS_REC.matrimonial, position:'relative' }}>
                                    <span style={{ position:'absolute', top:6, right:6, background:st.bg, color:st.color, fontSize:'0.6rem', fontWeight:700, padding:'2px 7px', borderRadius:9999, border:`1px solid ${st.dot}33` }}>
                                      <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:st.dot, marginRight:3, verticalAlign:'middle' }}/>
                                      {st.label}
                                    </span>
                                  </div>
                                  <div style={{ padding:'0.55rem 0.7rem' }}>
                                    <p style={{ fontWeight:700, fontSize:'0.82rem', color:'#111827', margin:0 }}>N° {h.numero}</p>
                                    <p style={{ fontSize:'0.68rem', color:'#9CA3AF', margin:'1px 0' }}>{h.tipo_label} · Piso {h.piso}</p>
                                    <p style={{ fontWeight:800, color:'#F5922E', fontSize:'0.8rem', margin:0 }}>S/ {h.precio}/n.</p>
                                  </div>
                                </div>
                              )
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Barra resumen + botón Continuar */}
                    {habsSel.length > 0 && (
                      <div style={{ position:'sticky', bottom:0, background:'white', padding:'0.75rem 0', borderTop:'1px solid #F3F4F6', marginTop:'0.5rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                          <span style={{ fontSize:'0.82rem', color:'#6B7280' }}>
                            {habsSel.length} habitaci{habsSel.length !== 1 ? 'ones' : 'ón'} seleccionada{habsSel.length !== 1 ? 's' : ''}
                          </span>
                          <span style={{ fontWeight:700, color:'#F5922E', fontSize:'0.88rem' }}>
                            S/ {habsSel.reduce((s, h) => s + Number(h.precio), 0)}/noche
                          </span>
                        </div>
                        <button onClick={() => setPaso(3)}
                          style={{ width:'100%', padding:'0.85rem', borderRadius:12, border:'none', background:'linear-gradient(135deg,#3D1A06,#7B4019)', color:'white', fontWeight:700, fontSize:'0.9rem', cursor:'pointer' }}>
                          Continuar con {habsSel.length} habitaci{habsSel.length !== 1 ? 'ones' : 'ón'} →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── PASO 3: DETALLES + DESCUENTO ── */}
          {paso === 3 && habsSel.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
              {/* Mini cards habitaciones seleccionadas */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.45rem' }}>
                {habsSel.map(h => (
                  <div key={h.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'0.55rem 0.9rem', background:'#FFF7ED', border:'1.5px solid #F5922E', borderRadius:10 }}>
                    <div style={{ width:28, height:28, borderRadius:6, background:TIPO_GRADIENTS_REC[h.tipo]??TIPO_GRADIENTS_REC.matrimonial, flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:700, color:'#111827', margin:0, fontSize:'0.82rem' }}>Hab. N° {h.numero} — {h.tipo_label}</p>
                      <p style={{ fontSize:'0.68rem', color:'#9CA3AF', margin:0 }}>{h.sede_nombre} · Piso {h.piso} · S/ {h.precio}/noche</p>
                    </div>
                    {habsSel.length > 1 && (
                      <button onClick={() => setHabsSel(prev => prev.filter(x => x.id !== h.id))}
                        style={{ background:'none', border:'none', color:'#DC2626', fontSize:'0.72rem', cursor:'pointer', fontWeight:700 }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setPaso(2)} style={{ background:'none', border:'none', color:'#9CA3AF', fontSize:'0.72rem', cursor:'pointer', textAlign:'right' }}>Cambiar habitaciones</button>
              </div>

              {/* Fechas */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem' }}>
                <div>
                  <label style={lbl}>Entrada *</label>
                  <input type="date" min={today} style={inp} value={form.fecha_entrada}
                    onChange={e => setForm(f => ({...f, fecha_entrada:e.target.value, fecha_salida:''}))}/>
                </div>
                <div>
                  <label style={lbl}>Salida *</label>
                  <input type="date" min={form.fecha_entrada||today} style={{...inp, opacity:form.fecha_entrada?1:0.5}} disabled={!form.fecha_entrada}
                    value={form.fecha_salida} onChange={e => setForm(f => ({...f, fecha_salida:e.target.value}))}/>
                </div>
              </div>

              {/* Horas de check-in / check-out */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem' }}>
                <div>
                  <label style={lbl}>Hora Check-in</label>
                  <input type="time" style={inp} value={form.hora_checkin}
                    onChange={e => setForm(f => ({...f, hora_checkin:e.target.value}))}/>
                  <p style={{ margin:'3px 0 0', fontSize:'0.68rem', color:'#9CA3AF' }}>Hora de ingreso del huésped</p>
                </div>
                <div>
                  <label style={lbl}>Hora Check-out</label>
                  <input type="time" style={inp} value={form.hora_checkout}
                    onChange={e => setForm(f => ({...f, hora_checkout:e.target.value}))}/>
                  <p style={{ margin:'3px 0 0', fontSize:'0.68rem', color:'#9CA3AF' }}>Hora de salida del huésped</p>
                </div>
              </div>

              {/* Alerta de conflicto de fechas */}
              {form.fecha_entrada && form.fecha_salida && habsSel.some(h => hayConflicto(h.fechas_ocupadas, form.fecha_entrada, form.fecha_salida)) && (
                <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, padding:'0.7rem 1rem', display:'flex', alignItems:'flex-start', gap:8 }}>
                  <AlertCircle size={16} style={{ color:'#DC2626', flexShrink:0, marginTop:1 }}/>
                  <div>
                    <p style={{ fontWeight:700, color:'#DC2626', fontSize:'0.82rem', margin:0 }}>Conflicto de fechas detectado</p>
                    <p style={{ color:'#9CA3AF', fontSize:'0.72rem', margin:'2px 0 0' }}>
                      {habsSel.filter(h => hayConflicto(h.fechas_ocupadas, form.fecha_entrada, form.fecha_salida)).map(h => `N° ${h.numero}`).join(', ')} tiene(n) reservas que se cruzan con las fechas seleccionadas.
                    </p>
                    <button onClick={() => setPaso(2)}
                      style={{ marginTop:6, fontSize:'0.75rem', fontWeight:700, color:'#DC2626', background:'none', border:'none', cursor:'pointer', padding:0, textDecoration:'underline' }}>
                      ← Elegir otras habitaciones
                    </button>
                  </div>
                </div>
              )}

              {/* Huéspedes + Origen */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem' }}>
                <div>
                  <label style={lbl}>N° huéspedes</label>
                  <input type="number" min={1} max={habsSel.reduce((s, h) => s + (h.capacidad || 4), 0)} style={inp} value={form.num_huespedes}
                    onChange={e => setForm(f => ({...f, num_huespedes:+e.target.value}))}/>
                </div>
                <div>
                  <label style={lbl}>Origen de la reserva</label>
                  <div style={{ display:'flex', gap:'0.4rem', paddingTop:4 }}>
                    {[{v:'presencial',label:'🏨 Presencial'},{v:'llamada',label:'📞 Llamada'}].map(o => (
                      <button key={o.v} onClick={() => setForm(f => ({...f, origen:o.v}))}
                        style={{ flex:1, padding:'0.55rem', borderRadius:8, border:`1.5px solid ${form.origen===o.v?'#3D1A06':'#E5E7EB'}`, background:form.origen===o.v?'#3D1A06':'white', color:form.origen===o.v?'white':'#6B7280', fontSize:'0.75rem', fontWeight:600, cursor:'pointer' }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Acompañantes / personas adicionales ── */}
              <div style={{ border:'1.5px solid #E5E7EB', borderRadius:12, padding:'0.85rem 1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: acompanantes.length > 0 ? '0.65rem' : 0 }}>
                  <span style={{ fontWeight:600, fontSize:'0.85rem', color:'#374151' }}>👥 Acompañantes / personas adicionales</span>
                  <button onClick={() => setAcompanantes(prev => [...prev, { nombre:'', dni:'', tipo:'Acompañante' }])}
                    style={{ background:'none', border:'1.5px solid #E5E7EB', borderRadius:8, padding:'3px 10px', fontSize:'0.72rem', fontWeight:600, color:'#6B7280', cursor:'pointer' }}>
                    + Agregar
                  </button>
                </div>
                {acompanantes.map((a, i) => (
                  <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 120px 130px 28px', gap:'0.4rem', marginBottom:'0.4rem', alignItems:'center' }}>
                    <input style={{ ...inp, padding:'0.45rem 0.65rem', fontSize:'0.78rem' }} placeholder="Nombre completo"
                      value={a.nombre} onChange={e => setAcompanantes(prev => prev.map((x,j) => j===i ? {...x, nombre:e.target.value} : x))}/>
                    <input style={{ ...inp, padding:'0.45rem 0.65rem', fontSize:'0.78rem' }} placeholder="DNI"
                      value={a.dni} onChange={e => setAcompanantes(prev => prev.map((x,j) => j===i ? {...x, dni:e.target.value} : x))}/>
                    <select style={{ ...inp, padding:'0.45rem 0.5rem', fontSize:'0.72rem' }}
                      value={a.tipo} onChange={e => setAcompanantes(prev => prev.map((x,j) => j===i ? {...x, tipo:e.target.value} : x))}>
                      <option value="Acompañante">Acompañante</option>
                      <option value="Cónyuge">Cónyuge</option>
                      <option value="Hijo/Hija">Hijo/Hija</option>
                      <option value="Otro">Otro</option>
                    </select>
                    <button onClick={() => setAcompanantes(prev => prev.filter((_,j) => j!==i))}
                      style={{ background:'none', border:'none', color:'#DC2626', cursor:'pointer', fontSize:'0.85rem', fontWeight:700, padding:0, lineHeight:1 }}>✕</button>
                  </div>
                ))}
                {acompanantes.length === 0 && (
                  <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:'0.4rem 0 0' }}>Sin acompañantes registrados. Opcional.</p>
                )}
              </div>

              {/* Notas */}
              <div>
                <label style={lbl}>Notas internas</label>
                <textarea style={{...inp, minHeight:60, resize:'vertical'}} placeholder="Solicitudes especiales, observaciones..."
                  value={form.notas} onChange={e => setForm(f => ({...f, notas:e.target.value}))}/>
              </div>

              {/* ── Descuento — dos modos ── */}
              <div style={{ border:`1.5px solid ${form.descuento ? '#FDE68A' : '#E5E7EB'}`, borderRadius:12, padding:'0.85rem 1rem', background: form.descuento ? '#FFFBEB' : 'white' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom: form.descuento ? '0.75rem' : 0 }}>
                  <input type="checkbox" checked={form.descuento} onChange={e => {
                    setForm(f => ({...f, descuento:e.target.checked, descuento_pct:'', descuento_motivo:'', descuento_precio_fijo:'', descuento_tipo:'pct'}))
                    if (!e.target.checked) { setCodigoAuth(''); setCodigoValido(null); setCodigoInfo(null) }
                  }}/>
                  <span style={{ fontWeight:600, fontSize:'0.85rem', color:'#374151' }}>🏷️ Aplicar descuento</span>
                </label>
                {form.descuento && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                    {/* Selector de tipo de descuento */}
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      {[
                        { v:'fijo', label:'Precio fijo por noche', disabled: habsSel.length > 1 },
                        { v:'pct',  label:'Porcentaje %', disabled: false },
                      ].map(opt => (
                        <button key={opt.v}
                          onClick={() => {
                            if (opt.disabled) return
                            setForm(f => ({...f, descuento_tipo:opt.v, descuento_pct:'', descuento_precio_fijo:''}))
                            if (opt.v === 'fijo') { setCodigoAuth(''); setCodigoValido(null); setCodigoInfo(null) }
                          }}
                          style={{ flex:1, padding:'0.55rem', borderRadius:8, border:`1.5px solid ${form.descuento_tipo===opt.v?'#F5922E':'#E5E7EB'}`, background:form.descuento_tipo===opt.v?'#FFF7ED':'white', color: opt.disabled ? '#D1D5DB' : form.descuento_tipo===opt.v?'#F5922E':'#6B7280', fontSize:'0.75rem', fontWeight:600, cursor:opt.disabled?'not-allowed':'pointer' }}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {habsSel.length > 1 && form.descuento_tipo === 'fijo' && (
                      <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:0 }}>Precio fijo solo disponible para 1 habitación. Usa porcentaje para múltiples.</p>
                    )}

                    {/* ── Modo FIJO ── */}
                    {form.descuento_tipo === 'fijo' && habsSel.length === 1 && (
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.65rem' }}>
                        <div>
                          <label style={lbl}>Precio por noche (S/)</label>
                          <input type="number" min={1} style={inp} placeholder={`Actual: S/ ${habsSel[0].precio}`}
                            value={form.descuento_precio_fijo} onChange={e => setForm(f => ({...f, descuento_precio_fijo:e.target.value}))}/>
                        </div>
                        <div>
                          <label style={lbl}>Motivo (opcional)</label>
                          <input style={inp} placeholder="Ej: Estadía prolongada..."
                            value={form.descuento_motivo} onChange={e => setForm(f => ({...f, descuento_motivo:e.target.value}))}/>
                        </div>
                      </div>
                    )}
                    {/* Resumen modo fijo */}
                    {form.descuento_tipo === 'fijo' && habsSel.length === 1 && noches > 0 && Number(form.descuento_precio_fijo) > 0 && (
                      <div style={{ background:'#FEF9C3', border:'1px solid #FDE68A', borderRadius:8, padding:'0.6rem 0.85rem', fontSize:'0.8rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', color:'#6B7280' }}>
                          <span>Precio original:</span><span>S/ {habsSel[0].precio} × {noches}n = S/ {precioBase.toFixed(2)}</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', color:'#DC2626' }}>
                          <span>Precio fijo:</span><span>S/ {form.descuento_precio_fijo} × {noches}n = S/ {precioFinal.toFixed(2)}</span>
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, color:'#16A34A', borderTop:'1px solid #FDE68A', paddingTop:4, marginTop:4 }}>
                          <span>Ahorro:</span><span>-S/ {(precioBase - precioFinal).toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    {/* ── Modo PORCENTAJE ── */}
                    {form.descuento_tipo === 'pct' && (
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                        {/* Aviso de código requerido */}
                        <div style={{ background:'#FFF7ED', border:'1.5px solid #FDE68A', borderRadius:8, padding:'0.6rem 0.85rem', fontSize:'0.78rem', display:'flex', gap:8, alignItems:'flex-start' }}>
                          <span style={{ fontSize:'1rem', lineHeight:1 }}>🔐</span>
                          <span style={{ color:'#92400E' }}>Se requiere un <strong>código de autorización</strong> para aplicar descuento porcentual. Ingrese el código a continuación.</span>
                        </div>
                        {/* Campo código */}
                        <div>
                          <label style={lbl}>Código de autorización *</label>
                          <div style={{ position:'relative' }}>
                            <input
                              style={{ ...inp, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700, fontFamily:'monospace', paddingRight:'2.2rem',
                                borderColor: codigoValido === true ? '#16A34A' : codigoValido === false ? '#DC2626' : '#E5E7EB' }}
                              placeholder="Ej: AUTH-XK92"
                              value={codigoAuth}
                              onChange={e => { setCodigoAuth(e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g,'')); setCodigoValido(null); setCodigoInfo(null) }}
                              maxLength={20}
                            />
                            <div style={{ position:'absolute', right:'0.6rem', top:'50%', transform:'translateY(-50%)', fontSize:'1rem' }}>
                              {codigoValidando ? '⏳' : codigoValido === true ? '✅' : codigoValido === false ? '❌' : null}
                            </div>
                          </div>
                          {codigoInfo && (
                            <p style={{ margin:'4px 0 0', fontSize:'0.72rem', fontWeight:600,
                              color: codigoValido ? '#15803D' : '#DC2626' }}>
                              {codigoValido
                                ? `Código válido${codigoInfo.descripcion ? ` — ${codigoInfo.descripcion}` : ''}${codigoInfo.vence ? ` · vence ${codigoInfo.vence}` : ''}`
                                : codigoInfo.mensaje}
                            </p>
                          )}
                        </div>
                        {/* % y motivo — solo si código válido */}
                        {codigoValido === true && (
                          <div style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:'0.65rem' }}>
                            <div>
                              <label style={lbl}>Porcentaje %</label>
                              <input type="number" min={1} max={100} style={inp} placeholder="Ej: 10"
                                value={form.descuento_pct} onChange={e => setForm(f => ({...f, descuento_pct:e.target.value}))}/>
                            </div>
                            <div>
                              <label style={lbl}>Motivo (opcional)</label>
                              <input style={inp} placeholder="Ej: Cliente frecuente, cortesía..."
                                value={form.descuento_motivo} onChange={e => setForm(f => ({...f, descuento_motivo:e.target.value}))}/>
                            </div>
                          </div>
                        )}
                        {/* Resumen descuento porcentaje */}
                        {codigoValido === true && noches > 0 && form.descuento_pct && (
                          <div style={{ background:'#FEF9C3', border:'1px solid #FDE68A', borderRadius:8, padding:'0.6rem 0.85rem', fontSize:'0.8rem' }}>
                            <div style={{ display:'flex', justifyContent:'space-between', color:'#6B7280' }}>
                              <span>Precio original:</span><span>S/ {precioBase.toFixed(2)}</span>
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', color:'#DC2626' }}>
                              <span>Descuento {form.descuento_pct}%:</span><span>-S/ {descuentoAmt.toFixed(2)}</span>
                            </div>
                            <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, color:'#16A34A', borderTop:'1px solid #FDE68A', paddingTop:4, marginTop:4 }}>
                              <span>Total con descuento:</span><span>S/ {precioFinal.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resumen sin descuento */}
              {noches > 0 && !form.descuento && (
                <div style={{ background:'#FFF7ED', border:'1px solid rgba(245,146,46,0.3)', borderRadius:10, padding:'0.75rem 1rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.82rem', color:'#6B7280', marginBottom:3 }}>
                    <span>{habsSel.length} hab. × S/ {habsSel.reduce((s,h)=>s+Number(h.precio),0)} × {noches} noche{noches!==1?'s':''}</span>
                    <span>S/ {precioBase.toFixed(2)}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:'1rem', color:'#3D1A06', borderTop:'1px solid rgba(245,146,46,0.2)', paddingTop:4 }}>
                    <span>Total</span><span style={{ color:'#F5922E' }}>S/ {precioFinal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {(() => {
                const conflicto    = habsSel.some(h => hayConflicto(h.fechas_ocupadas, form.fecha_entrada, form.fecha_salida))
                const sinDescuento = form.descuento && form.descuento_tipo === 'pct' && !codigoValido
                const sinFijo      = form.descuento && form.descuento_tipo === 'fijo' && habsSel.length === 1 && !Number(form.descuento_precio_fijo)
                const bloqueado    = noches < 1 || conflicto || sinDescuento || sinFijo
                const btnLabel     = noches < 1
                  ? 'Selecciona las fechas'
                  : conflicto
                    ? '⛔ Fechas ocupadas — cambia la habitación'
                    : sinDescuento
                      ? '🔑 Ingresa un código de autorización válido'
                      : sinFijo
                        ? 'Ingresa el precio fijo por noche'
                        : 'Continuar → Pago'
                return (
                  <button
                    onClick={() => { if (!bloqueado) setPaso(4) }}
                    disabled={bloqueado}
                    style={{ padding:'0.85rem', borderRadius:12, border:'none', background:bloqueado?'#E5E7EB':'linear-gradient(135deg,#3D1A06,#7B4019)', color:bloqueado?'#9CA3AF':'white', fontWeight:700, fontSize:'0.9rem', cursor:bloqueado?'not-allowed':'pointer' }}>
                    {btnLabel}
                  </button>
                )
              })()}
            </div>
          )}

          {/* ── PASO 4: PAGO ── */}
          {paso === 4 && (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
              {/* Resumen rápido */}
              <div style={{ background:'#F9FAFB', borderRadius:12, padding:'0.75rem 1rem', fontSize:'0.82rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ color:'#6B7280' }}>Habitaci{habsSel.length!==1?'ones':'ón'}</span>
                  <span style={{ fontWeight:600 }}>{habsSel.map(h => `N° ${h.numero}`).join(', ')}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ color:'#6B7280' }}>Fechas</span>
                  <span style={{ fontWeight:600 }}>{form.fecha_entrada} → {form.fecha_salida} ({noches}n)</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ color:'#6B7280' }}>Total</span>
                  <span style={{ fontWeight:800, color:'#F5922E', fontSize:'0.95rem' }}>S/ {precioFinal.toFixed(2)}</span>
                </div>
              </div>

              {/* Toggle pago ahora */}
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'0.75rem 1rem', border:'1.5px solid #E5E7EB', borderRadius:12 }}>
                <input type="checkbox" checked={form.pago_ahora} onChange={e => setForm(f => ({...f, pago_ahora:e.target.checked}))}/>
                <div>
                  <p style={{ fontWeight:700, fontSize:'0.88rem', color:'#111827', margin:0 }}>💳 Registrar pago ahora</p>
                  <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:0 }}>El cliente paga en este momento (se verifica automáticamente)</p>
                </div>
              </label>

              {form.pago_ahora && (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem', padding:'0.85rem 1rem', border:'1px solid #E5E7EB', borderRadius:12 }}>
                  {/* Tipo */}
                  <div>
                    <label style={lbl}>Tipo de pago</label>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      {[{v:'adelanto',label:`Adelanto 50% — S/ ${(precioFinal*0.5).toFixed(2)}`},{v:'total',label:`Completo — S/ ${precioFinal.toFixed(2)}`}].map(t => (
                        <button key={t.v} onClick={() => setForm(f => ({...f, pago_tipo:t.v}))}
                          style={{ flex:1, padding:'0.6rem 0.4rem', borderRadius:8, border:`1.5px solid ${form.pago_tipo===t.v?'#F5922E':'#E5E7EB'}`, background:form.pago_tipo===t.v?'#FFF7ED':'white', color:form.pago_tipo===t.v?'#F5922E':'#6B7280', fontSize:'0.73rem', fontWeight:form.pago_tipo===t.v?700:400, cursor:'pointer' }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Método */}
                  <div>
                    <label style={lbl}>Método de pago</label>
                    <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                      {['efectivo','yape','plin','transferencia','tarjeta'].map(m => (
                        <button key={m} onClick={() => setForm(f => ({...f, pago_metodo:m}))}
                          style={{ padding:'5px 12px', borderRadius:8, border:`1.5px solid ${form.pago_metodo===m?'#3D1A06':'#E5E7EB'}`, background:form.pago_metodo===m?'#3D1A06':'white', color:form.pago_metodo===m?'white':'#6B7280', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Ref */}
                  <div>
                    <label style={lbl}>N° operación / referencia <span style={{ fontWeight:400, color:'#9CA3AF' }}>(opcional)</span></label>
                    <input style={inp} placeholder="Ej: 12345678" value={form.pago_ref}
                      onChange={e => setForm(f => ({...f, pago_ref:e.target.value}))}/>
                  </div>
                  <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, padding:'0.6rem 0.85rem', fontSize:'0.78rem', color:'#166534', fontWeight:600 }}>
                    ✅ Monto a cobrar: <span style={{ fontSize:'1rem' }}>S/ {montoPago.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {!form.pago_ahora && (
                <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10, padding:'0.65rem 1rem', fontSize:'0.78rem', color:'#92400E' }}>
                  ⏳ La reserva quedará en estado <b>Pendiente</b>. El cliente deberá pagar luego.
                </div>
              )}

              {error && <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', color:'#DC2626', borderRadius:10, padding:'0.7rem', fontSize:'0.82rem' }}>{error}</div>}

              <div style={{ display:'flex', gap:'0.5rem' }}>
                <button onClick={() => setPaso(3)} style={{ padding:'0.75rem 1.25rem', borderRadius:10, border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' }}>
                  ← Volver
                </button>
                <button onClick={confirmar} disabled={saving}
                  style={{ flex:1, padding:'0.85rem', borderRadius:12, border:'none', background:saving?'#9CA3AF':'linear-gradient(135deg,#16A34A,#15803D)', color:'white', fontWeight:700, fontSize:'0.9rem', cursor:saving?'not-allowed':'pointer' }}>
                  {saving ? 'Creando reserva...' : '✓ Confirmar reserva'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Modal detalle antes del check-in (desde la tabla) ────────
function ModalDetalleCheckin({ reserva, onClose, onCheckin }) {
  const [cochera, setCochera] = useState(null)
  const [saldoModo, setSaldoModo] = useState(false)
  const [metodoSaldo, setMetodoSaldo] = useState('efectivo')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const { verif, pend, pagado, saldo } = calcPagos(reserva.pagos ?? [], reserva.precio_total)
  const noches = Math.ceil(
    (new Date((reserva.fecha_salida || '').split('T')[0] + 'T12:00:00') -
     new Date((reserva.fecha_entrada || '').split('T')[0] + 'T12:00:00')) / 86400000
  )

  useEffect(() => {
    cocherasApi.getReservas({ reserva_id: reserva.id })
      .then(r => {
        const items = r.data.data ?? r.data
        const c = items.find(x => !['cancelada','finalizada'].includes(x.estado))
        setCochera(c ?? null)
      }).catch(() => {})
  }, [reserva.id])

  async function registrarSaldoYCheckin() {
    setGuardando(true); setError('')
    try {
      await pagosApi.registrarSaldo(reserva.id, { metodo_pago: metodoSaldo })
      onCheckin(reserva.id)
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al registrar el saldo.')
      setGuardando(false)
    }
  }

  const METODOS_S = [
    { id:'efectivo', label:'Efectivo' }, { id:'yape', label:'Yape' },
    { id:'plin', label:'Plin' }, { id:'transferencia', label:'Transferencia' },
    { id:'tarjeta', label:'Tarjeta' },
  ]

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:60, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:480, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.22)' }}>

        {/* Header */}
        <div style={{ position:'sticky', top:0, background:'white', zIndex:1, borderBottom:'1px solid #F3F4F6', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:'0.95rem', color:'#111827', margin:0 }}>Detalle de check-in</p>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:0 }}>{reserva.codigo}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={18}/></button>
        </div>

        <div style={{ padding:'1.1rem 1.5rem', display:'flex', flexDirection:'column', gap:'0.85rem' }}>

          {/* Info cliente + reserva */}
          <div style={{ background:'#F9FAFB', borderRadius:12, padding:'0.85rem 1rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.5rem' }}>
              <User size={14} style={{ color:'#9CA3AF' }}/>
              <span style={{ fontWeight:700, color:'#111827', fontSize:'0.88rem' }}>{reserva.cliente?.name}</span>
              {reserva.cliente?.telefono && <span style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>· {reserva.cliente.telefono}</span>}
              {reserva.cliente?.dni && <span style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>· DNI {reserva.cliente.dni}</span>}
            </div>
            <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.82rem', color:'#374151', flexWrap:'wrap' }}>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <MapPin size={12} style={{ color:'#9CA3AF' }}/>
                {reserva.sede?.nombre} — Hab. {reserva.habitacion?.numero}
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <Calendar size={12} style={{ color:'#9CA3AF' }}/>
                {new Date((reserva.fecha_entrada||'').split('T')[0]+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'short'})}
                {' → '}
                {new Date((reserva.fecha_salida||'').split('T')[0]+'T12:00:00').toLocaleDateString('es-PE',{day:'2-digit',month:'short'})}
                · {noches} noche{noches!==1?'s':''}
              </span>
              <span style={{ fontWeight:700, color:'#F5922E', display:'flex', alignItems:'center', gap:4 }}>
                <BedDouble size={12} style={{ color:'#9CA3AF' }}/> S/ {reserva.precio_total}
              </span>
            </div>
          </div>

          {/* Estado de pago */}
          {(() => {
            if (verif.length === 0 && pend.length === 0) return (
              <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:12, padding:'0.75rem 1rem', display:'flex', gap:8 }}>
                <AlertCircle size={16} style={{ color:'#DC2626', flexShrink:0, marginTop:1 }}/>
                <div>
                  <p style={{ fontWeight:700, color:'#DC2626', fontSize:'0.82rem', margin:0 }}>Sin pago registrado</p>
                  <p style={{ color:'#9CA3AF', fontSize:'0.72rem', margin:'2px 0 0' }}>Total a cobrar: <b>S/ {reserva.precio_total}</b></p>
                </div>
              </div>
            )
            if (pend.length > 0 && pagado === 0) return (
              <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:12, padding:'0.75rem 1rem', display:'flex', gap:8 }}>
                <AlertCircle size={16} style={{ color:'#D97706', flexShrink:0, marginTop:1 }}/>
                <div>
                  <p style={{ fontWeight:700, color:'#D97706', fontSize:'0.82rem', margin:0 }}>Pago pendiente de verificar</p>
                  <p style={{ color:'#9CA3AF', fontSize:'0.72rem', margin:'2px 0 0' }}>
                    {pend.map(p => `S/ ${Number(p.monto).toFixed(2)} (${METODO_LABEL[p.metodo_pago]??p.metodo_pago})`).join(' · ')}
                  </p>
                </div>
              </div>
            )
            if (saldo > 0) return (
              <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:12, padding:'0.75rem 1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.4rem' }}>
                  <CreditCard size={15} style={{ color:'#F5922E' }}/>
                  <p style={{ fontWeight:700, color:'#D97706', fontSize:'0.82rem', margin:0 }}>Pago parcial — saldo pendiente</p>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', marginBottom:3 }}>
                  <span style={{ color:'#6B7280' }}>Pagado</span>
                  <span style={{ fontWeight:700, color:'#16A34A' }}>S/ {pagado.toFixed(2)} ✓</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', paddingTop:4, borderTop:'1px solid #FED7AA' }}>
                  <span style={{ color:'#D97706', fontWeight:600 }}>⚠ Saldo a cobrar ahora</span>
                  <span style={{ fontWeight:800, color:'#F5922E' }}>S/ {saldo.toFixed(2)}</span>
                </div>
              </div>
            )
            return (
              <div style={{ background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:12, padding:'0.7rem 1rem', display:'flex', gap:8 }}>
                <CheckCircle size={15} style={{ color:'#16A34A', flexShrink:0 }}/>
                <p style={{ fontWeight:700, color:'#16A34A', fontSize:'0.82rem', margin:0 }}>
                  Pago completo — S/ {pagado.toFixed(2)} verificado
                </p>
              </div>
            )
          })()}

          {/* Cochera */}
          {cochera && (
            <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:12, padding:'0.75rem 1rem' }}>
              <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#D97706', textTransform:'uppercase', letterSpacing:'0.06em', margin:'0 0 0.4rem' }}>
                🚗 Cochera reservada
              </p>
              <div style={{ display:'flex', gap:'1.5rem', fontSize:'0.82rem', color:'#374151' }}>
                <span><b>Espacio</b> N° {cochera.cochera?.numero}</span>
                <span><b>Código</b> {cochera.codigo}</span>
                {cochera.placa && <span style={{ fontFamily:'monospace', fontWeight:700 }}>{cochera.placa}</span>}
              </div>
            </div>
          )}

          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', color:'#DC2626', borderRadius:10, padding:'0.7rem', fontSize:'0.82rem' }}>{error}</div>}

          {/* Acciones */}
          {saldo > 0 && !saldoModo ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
              <button onClick={() => setSaldoModo(true)}
                style={{ width:'100%', padding:'0.85rem', borderRadius:12, border:'none', background:'linear-gradient(135deg,#F5922E,#E07820)', color:'white', fontWeight:700, fontSize:'0.9rem', cursor:'pointer' }}>
                💰 Cobrar S/ {saldo.toFixed(2)} y hacer Check-in
              </button>
              <button onClick={() => onCheckin(reserva.id)}
                style={{ width:'100%', padding:'0.75rem', borderRadius:10, border:'1.5px solid #E5E7EB', background:'white', color:'#374151', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' }}>
                Hacer Check-in sin cobrar saldo
              </button>
            </div>
          ) : saldoModo ? (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
              <p style={{ fontSize:'0.78rem', fontWeight:600, color:'#374151', margin:0 }}>Método de pago del saldo:</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem' }}>
                {METODOS_S.map(m => (
                  <button key={m.id} onClick={() => setMetodoSaldo(m.id)}
                    style={{ padding:'0.55rem', borderRadius:8, border:`1.5px solid ${metodoSaldo===m.id?'#F5922E':'#E5E7EB'}`, background:metodoSaldo===m.id?'#FFF7ED':'white', fontWeight:metodoSaldo===m.id?700:400, fontSize:'0.8rem', cursor:'pointer', color:metodoSaldo===m.id?'#F5922E':'#374151' }}>
                    {m.label}
                  </button>
                ))}
              </div>
              <button onClick={registrarSaldoYCheckin} disabled={guardando}
                style={{ width:'100%', padding:'0.85rem', borderRadius:12, border:'none', background:guardando?'#9CA3AF':'linear-gradient(135deg,#16A34A,#15803D)', color:'white', fontWeight:700, fontSize:'0.9rem', cursor:guardando?'not-allowed':'pointer' }}>
                {guardando ? 'Procesando...' : `Cobrar S/ ${saldo.toFixed(2)} + Check-in`}
              </button>
            </div>
          ) : (
            <button onClick={() => onCheckin(reserva.id)}
              style={{ width:'100%', padding:'0.85rem', borderRadius:12, border:'none', background:'linear-gradient(135deg,#16A34A,#15803D)', color:'white', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              <CheckCircle size={17}/> Confirmar Check-in
            </button>
          )}

          <button onClick={onClose}
            style={{ width:'100%', padding:'0.65rem', borderRadius:10, border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal de Check-in rápido ─────────────────────────────────
function ModalCheckin({ onClose, onDone, onCheckoutRequest }) {
  const [modo, setModo]       = useState('manual') // 'camara' | 'manual' — manual por defecto (más fiable en desktop)
  const [codigo, setCodigo]   = useState('')
  const [reserva, setReserva] = useState(null)
  const [buscando, setBusc]   = useState(false)
  const [accion, setAccion]   = useState(false)
  const [error, setError]     = useState('')
  const inputRef = useRef()

  useEffect(() => {
    if (modo === 'manual') inputRef.current?.focus()
  }, [modo])

  async function buscar(cod) {
    const q = (cod ?? codigo).trim().toUpperCase()
    if (!q) return
    setBusc(true); setError(''); setReserva(null)
    try {
      const { data } = await reservasApi.getAll({ search: q })
      const r = data.data?.find(x => x.codigo.toUpperCase() === q)
      if (!r) setError('No se encontró ninguna reserva con ese código.')
      else     setReserva(r)
    } catch { setError('Error al buscar la reserva.') }
    finally  { setBusc(false) }
  }

  function handleScan(cod) {
    setCodigo(cod)
    setModo('manual')
    buscar(cod)
  }

  async function hacerAccion(fn, msg) {
    setAccion(true)
    try { await fn(reserva.id); onDone(msg) }
    catch (err) { setError(err.response?.data?.message ?? 'Error al procesar.') }
    finally { setAccion(false) }
  }

  const noches = reserva
    ? Math.ceil((new Date(reserva.fecha_salida) - new Date(reserva.fecha_entrada)) / 86400000)
    : 0

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '1rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={18} style={{ color: '#16A34A' }}/>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827' }}>Check-in rápido</p>
              <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>Escanea o escribe el código de reserva</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
            <X size={20}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          {[
            { id: 'camara', icon: Camera,   label: 'Escanear QR' },
            { id: 'manual', icon: Keyboard, label: 'Escribir código' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => { setModo(id); setReserva(null); setError('') }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                background: modo === id ? '#F0FDF4' : 'white',
                color: modo === id ? '#16A34A' : '#6B7280',
                borderBottom: modo === id ? '2px solid #16A34A' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={15}/> {label}
            </button>
          ))}
        </div>

        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Cámara */}
          {modo === 'camara' && (
            <QrCamScanner onResult={handleScan} onError={msg => setError(msg)} />
          )}

          {/* Manual */}
          {modo === 'manual' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                ref={inputRef}
                placeholder="Ej: AB12CD34"
                value={codigo}
                onChange={e => { setCodigo(e.target.value.toUpperCase()); setReserva(null); setError('') }}
                onKeyDown={e => e.key === 'Enter' && buscar()}
                style={{ flex: 1, border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.7rem 0.9rem', fontSize: '0.95rem', outline: 'none', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              />
              <button onClick={() => buscar()} disabled={buscando || !codigo.trim()}
                style={{ padding: '0.7rem 1rem', borderRadius: 10, border: 'none', background: '#3D1A06', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.85rem', opacity: !codigo.trim() ? 0.5 : 1 }}>
                <Search size={15}/> {buscando ? '...' : 'Buscar'}
              </button>
            </div>
          )}

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          {buscando && (
            <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem', padding: '0.5rem' }}>
              Buscando reserva...
            </div>
          )}

          {/* Tarjeta de reserva */}
          {reserva && (
            <div style={{ border: `2px solid ${reserva.estado === 'confirmada' ? '#16A34A' : reserva.estado === 'checkin' ? '#7C3AED' : '#E5E7EB'}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ background: reserva.estado === 'confirmada' ? 'linear-gradient(135deg,#16A34A,#15803D)' : reserva.estado === 'checkin' ? 'linear-gradient(135deg,#7C3AED,#5B21B6)' : 'linear-gradient(135deg,#6B7280,#374151)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', marginBottom: '0.15rem' }}>Código</p>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.08em', fontFamily: 'monospace' }}>{reserva.codigo}</p>
                </div>
                <EstadoBadge estado={reserva.estado}/>
              </div>

              <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', background: 'white' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', color: '#374151' }}>
                  <User size={14} style={{ color: '#9CA3AF' }}/> <b>{reserva.cliente?.name}</b> <span style={{ color: '#9CA3AF' }}>({reserva.num_huespedes} pers.)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', color: '#374151' }}>
                  <MapPin size={14} style={{ color: '#9CA3AF' }}/> {reserva.sede?.nombre} — Hab. {reserva.habitacion?.numero}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem', color: '#374151' }}>
                  <Calendar size={14} style={{ color: '#9CA3AF' }}/>
                  {new Date((reserva.fecha_entrada||'').split('T')[0] + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  {' → '}
                  {new Date((reserva.fecha_salida||'').split('T')[0] + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>({noches} noche{noches !== 1 ? 's' : ''})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.83rem' }}>
                  <BedDouble size={14} style={{ color: '#9CA3AF' }}/> <b style={{ color: '#F5922E' }}>S/ {reserva.precio_total}</b>
                </div>
                {/* Estado pago inline */}
                {(() => {
                  const { pagado, saldo, pend } = calcPagos(reserva.pagos ?? [], reserva.precio_total)
                  if (saldo > 0 && pagado > 0) return (
                    <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#16A34A', fontWeight: 700 }}>✓ Pagado: S/ {pagado.toFixed(2)}</span>
                      <span style={{ color: '#F5922E', fontWeight: 700 }}>⚠ Saldo: S/ {saldo.toFixed(2)}</span>
                    </div>
                  )
                  if (pend.length > 0 && pagado === 0) return (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#D97706', fontWeight: 600 }}>
                      ⏳ Pago pendiente de verificación
                    </div>
                  )
                  if (pagado > 0 && saldo === 0) return (
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#16A34A', fontWeight: 600 }}>
                      ✅ Pago completo verificado
                    </div>
                  )
                  return null
                })()}
              </div>

              <div style={{ padding: '0 1.25rem 1.25rem' }}>
                {reserva.estado === 'confirmada' && (
                  <button onClick={() => hacerAccion(reservasApi.checkin, 'Check-in realizado exitosamente.')} disabled={accion}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#16A34A,#15803D)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: accion ? 0.7 : 1 }}>
                    <CheckCircle size={17}/> {accion ? 'Procesando...' : 'Hacer Check-in'}
                  </button>
                )}
                {reserva.estado === 'checkin' && (
                  <button onClick={() => onCheckoutRequest?.(reserva.id)} disabled={accion}
                    style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: 'white', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: accion ? 0.7 : 1 }}>
                    <ArrowRight size={17}/> {accion ? 'Procesando...' : 'Ver Folio y Check-out'}
                  </button>
                )}
                {reserva.estado === 'pendiente' && (
                  <div style={{ background: '#FEF9C3', borderRadius: 10, padding: '0.75rem', fontSize: '0.8rem', color: '#854D0E', textAlign: 'center' }}>
                    Esta reserva aún no ha sido confirmada ni completado el pago.
                  </div>
                )}
                {['finalizada','cancelada','expirada'].includes(reserva.estado) && (
                  <div style={{ background: '#F3F4F6', borderRadius: 10, padding: '0.75rem', fontSize: '0.8rem', color: '#6B7280', textAlign: 'center' }}>
                    Esta reserva ya está {ESTADO_STYLE[reserva.estado]?.label?.toLowerCase()}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers de formato para el folio ────────────────────────────
function fmt(n)  { return 'S/ ' + Number(n ?? 0).toFixed(2) }
function fDia(d) {
  if (!d) return '—'
  return new Date(d.slice(0,10) + 'T12:00:00').toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })
}
const TIPO_LABEL = { adelanto:'Adelanto', saldo:'Saldo', total:'Total' }

// ── Modal Resumen de Check-out ───────────────────────────────────
// ── Modal de Cargos Adicionales (durante la estadía) ────────────
function ModalCargosReserva({ reserva, onClose }) {
  const [servicios, setServicios] = useState([])   // cargados en esta reserva
  const [catalogo, setCatalogo]   = useState([])   // todos los servicios activos
  const [selId, setSelId]         = useState('')
  const [cantidad, setCantidad]   = useState(1)
  const [saving, setSaving]       = useState(false)
  const [loadSvc, setLoadSvc]     = useState(true)
  const toast = useToast()

  // Carga catálogo y servicios actuales
  useEffect(() => {
    Promise.all([
      serviciosApi.getAll(),
      serviciosApi.deReserva(reserva.id),
    ]).then(([cat, svc]) => {
      setCatalogo((cat.data || []).filter(s => s.activo))
      setServicios(svc.data || [])
    }).finally(() => setLoadSvc(false))
  }, [reserva.id])

  async function agregar() {
    if (!selId) return
    setSaving(true)
    try {
      const { data } = await serviciosApi.agregar(reserva.id, { servicio_id: selId, cantidad })
      setServicios(prev => [...prev, data])
      setSelId(''); setCantidad(1)
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Error al agregar cargo.')
    } finally { setSaving(false) }
  }

  async function quitar(rsId) {
    try {
      await serviciosApi.quitar(reserva.id, rsId)
      setServicios(prev => prev.filter(s => s.id !== rsId))
    } catch { toast.error('No se pudo eliminar el cargo.') }
  }

  const totalSvc = servicios.reduce((s, x) => s + Number(x.subtotal), 0)
  const inp = { border:'1.5px solid #E5E7EB', borderRadius:9, padding:'0.55rem 0.8rem', fontSize:'0.84rem', outline:'none', background:'white' }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:65, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ position:'sticky', top:0, background:'white', zIndex:1, borderBottom:'1px solid #F3F4F6', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:'0.95rem', color:'#111827', margin:0 }}>Cargos adicionales</p>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:'2px 0 0' }}>{reserva.codigo} · {reserva.cliente?.name ?? '—'} · Hab {reserva.habitacion?.numero}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={18}/></button>
        </div>

        <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>

          {/* Formulario agregar */}
          <div style={{ background:'#F9FAFB', borderRadius:12, padding:'0.9rem 1rem', display:'flex', flexDirection:'column', gap:'0.65rem' }}>
            <p style={{ fontSize:'0.78rem', fontWeight:700, color:'#374151', margin:0 }}>Agregar cargo</p>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              <select value={selId} onChange={e => setSelId(e.target.value)}
                style={{ ...inp, flex:1, minWidth:160 }}>
                <option value="">— Selecciona servicio —</option>
                {catalogo.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} · S/ {Number(s.precio).toFixed(2)}</option>
                ))}
              </select>
              <input type="number" min={1} max={20} value={cantidad} onChange={e => setCantidad(Number(e.target.value))}
                style={{ ...inp, width:70, textAlign:'center' }} />
              <button onClick={agregar} disabled={!selId || saving}
                style={{ padding:'0.55rem 1.1rem', borderRadius:9, border:'none', background:!selId||saving?'#9CA3AF':'#3D1A06', color:'white', fontWeight:700, fontSize:'0.83rem', cursor:!selId||saving?'not-allowed':'pointer', whiteSpace:'nowrap' }}>
                {saving ? '...' : '+ Agregar'}
              </button>
            </div>
            {selId && catalogo.find(s => s.id === Number(selId)) && (
              <p style={{ fontSize:'0.72rem', color:'#6B7280', margin:0 }}>
                Subtotal: <b>S/ {(Number(catalogo.find(s => s.id === Number(selId))?.precio) * cantidad).toFixed(2)}</b>
              </p>
            )}
          </div>

          {/* Lista de cargos */}
          {loadSvc ? (
            <p style={{ textAlign:'center', color:'#9CA3AF', fontSize:'0.82rem' }}>Cargando...</p>
          ) : servicios.length === 0 ? (
            <div style={{ textAlign:'center', padding:'1.5rem', background:'#F9FAFB', borderRadius:12, color:'#9CA3AF', fontSize:'0.82rem' }}>
              Sin cargos adicionales registrados
            </div>
          ) : (
            <div style={{ border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden' }}>
              {servicios.map((s, i) => (
                <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.65rem 1rem', borderBottom: i < servicios.length-1 ? '1px solid #F3F4F6' : 'none', fontSize:'0.85rem' }}>
                  <div style={{ flex:1 }}>
                    <span style={{ fontWeight:600, color:'#111827' }}>{s.servicio?.nombre ?? 'Servicio'}</span>
                    <span style={{ color:'#9CA3AF', margin:'0 6px' }}>×</span>
                    <span style={{ color:'#6B7280' }}>{s.cantidad}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontWeight:700, color:'#374151' }}>S/ {Number(s.subtotal).toFixed(2)}</span>
                    <button onClick={() => quitar(s.id)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:2, display:'flex' }}>
                      <X size={14}/>
                    </button>
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'0.65rem 1rem', background:'#F9FAFB', borderTop:'1px solid #E5E7EB', fontWeight:800 }}>
                <span>Total servicios</span>
                <span style={{ color:'#F5922E' }}>S/ {totalSvc.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button onClick={onClose}
            style={{ width:'100%', padding:'0.65rem', borderRadius:10, border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', fontWeight:600, fontSize:'0.85rem', cursor:'pointer' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export function ModalResumenCheckout({ reservaId, onClose, onCheckout }) {
  const [res, setRes]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [saving, setSaving]     = useState(false)
  // Cargo rápido
  const [catalogo, setCatalogo] = useState([])
  const [addOpen, setAddOpen]   = useState(false)
  const [addId, setAddId]       = useState('')
  const [addQty, setAddQty]     = useState(1)
  const [addSaving, setAddSaving]   = useState(false)
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const toast = useToast()

  function recargar() {
    axiosClient.get(`/reservas/${reservaId}/resumen`).then(r => setRes(r.data))
  }

  useEffect(() => {
    axiosClient.get(`/reservas/${reservaId}/resumen`)
      .then(r => setRes(r.data))
      .catch(() => setError('No se pudo cargar el resumen.'))
      .finally(() => setLoading(false))
    serviciosApi.getAll().then(r => setCatalogo((r.data || []).filter(s => s.activo)))
  }, [reservaId])

  async function agregarCargo() {
    if (!addId) return
    setAddSaving(true)
    try {
      await serviciosApi.agregar(reservaId, { servicio_id: addId, cantidad: addQty })
      setAddId(''); setAddQty(1); setAddOpen(false)
      recargar()
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Error al agregar cargo.')
    } finally { setAddSaving(false) }
  }

  async function quitarCargo(rsId) {
    try {
      await serviciosApi.quitar(reservaId, rsId)
      recargar()
    } catch { toast.error('No se pudo eliminar el cargo.') }
  }

  async function confirmar() {
    setSaving(true)
    try {
      // Si hay saldo pendiente (incluye servicios), cobrarlo primero → queda en pagos
      if (res?.saldo_pendiente > 0) {
        await pagosApi.registrarSaldo(reservaId, { metodo_pago: metodoPago })
      }
      await reservasApi.checkout(reservaId)
      onCheckout(r?.codigo)
    } catch (e) {
      setError(e.response?.data?.message ?? 'Error al procesar el check-out.')
    } finally { setSaving(false) }
  }

  function imprimirFolio() {
    if (r?.codigo) window.open(`/folio/${r.codigo}`, '_blank')
  }

  const r   = res?.reserva
  const hay = (arr) => Array.isArray(arr) && arr.length > 0

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, zIndex:70, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'white', borderRadius:18, width:'100%', maxWidth:560, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 60px rgba(0,0,0,0.22)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ position:'sticky', top:0, background:'white', zIndex:1, borderBottom:'1px solid #F3F4F6', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <p style={{ fontWeight:800, fontSize:'1rem', color:'#111827', margin:0, display:'flex', alignItems:'center', gap:6 }}>
              <Receipt size={16} style={{ color:'#7C3AED' }}/> Folio de Salida
            </p>
            {r && <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:'2px 0 0', fontFamily:'monospace' }}>{r.codigo}</p>}
          </div>
          <button onClick={onClose} className="fp-noprint" style={{ background:'none', border:'none', cursor:'pointer', color:'#9CA3AF' }}><X size={18}/></button>
        </div>

        <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1rem' }}>

          {loading && <p style={{ textAlign:'center', color:'#6B7280', padding:'2rem 0' }}>Cargando resumen...</p>}
          {error   && <p style={{ color:'#DC2626', fontWeight:600, textAlign:'center' }}>{error}</p>}

          {res && r && (<>

            {/* Huésped + Habitación */}
            <div style={{ background:'#F9FAFB', borderRadius:12, padding:'0.9rem 1.1rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem' }}>
              <div>
                <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', margin:'0 0 3px' }}>Huésped</p>
                <p style={{ fontWeight:700, color:'#111827', margin:0 }}>{r.cliente?.name ?? '—'}</p>
                {r.cliente?.dni && <p style={{ fontSize:'0.72rem', color:'#6B7280', margin:'1px 0 0' }}>DNI {r.cliente.dni}</p>}
              </div>
              <div>
                <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', margin:'0 0 3px' }}>Habitación</p>
                <p style={{ fontWeight:700, color:'#111827', margin:0 }}>N° {r.habitacion?.numero} — {r.habitacion?.tipo}</p>
                <p style={{ fontSize:'0.72rem', color:'#6B7280', margin:'1px 0 0' }}>Piso {r.habitacion?.piso} · {r.sede?.nombre}</p>
              </div>
              <div>
                <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', margin:'0 0 3px' }}>Check-in</p>
                <p style={{ fontWeight:600, color:'#111827', margin:0 }}>{fDia(r.fecha_entrada)}</p>
              </div>
              <div>
                <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', margin:'0 0 3px' }}>Check-out</p>
                <p style={{ fontWeight:600, color:'#111827', margin:0 }}>{fDia(r.fecha_salida)}</p>
              </div>
            </div>

            {/* Detalle de cargos */}
            <div style={{ border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden' }}>
              <div style={{ background:'#F9FAFB', padding:'0.6rem 1rem', borderBottom:'1px solid #E5E7EB' }}>
                <p style={{ fontWeight:700, fontSize:'0.78rem', color:'#374151', margin:0 }}>Detalle de cargos</p>
              </div>
              <div style={{ padding:'0.5rem 0' }}>

                {/* Alojamiento */}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'0.45rem 1rem', fontSize:'0.85rem' }}>
                  <span style={{ color:'#374151' }}>
                    Alojamiento · {res.noches} {res.noches===1?'noche':'noches'} × {fmt(r.precio_noche)}
                  </span>
                  <span style={{ fontWeight:700 }}>{fmt(r.precio_original ?? r.precio_total)}</span>
                </div>

                {/* Descuento */}
                {r.descuento_porcentaje > 0 && (
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'0.45rem 1rem', fontSize:'0.85rem', background:'#FFFBEB' }}>
                    <span style={{ color:'#92400E', display:'flex', alignItems:'center', gap:6 }}>
                      🏷️ Descuento {r.descuento_porcentaje}%
                      {r.descuento_motivo && <span style={{ fontSize:'0.72rem', color:'#B45309' }}>({r.descuento_motivo})</span>}
                    </span>
                    <span style={{ fontWeight:700, color:'#D97706' }}>
                      -{fmt((r.precio_original ?? r.precio_total) - r.precio_total)}
                    </span>
                  </div>
                )}

                {/* Subtotal alojamiento */}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'0.45rem 1rem', fontSize:'0.85rem', borderTop:'1px solid #F3F4F6' }}>
                  <span style={{ color:'#6B7280' }}>Subtotal alojamiento</span>
                  <span style={{ fontWeight:700 }}>{fmt(r.precio_total)}</span>
                </div>

                {/* Servicios adicionales */}
                {hay(r.servicios) && (<>
                  <div style={{ padding:'0.45rem 1rem 0.2rem', borderTop:'1px solid #E5E7EB' }}>
                    <p style={{ fontSize:'0.72rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', margin:0 }}>Servicios adicionales</p>
                  </div>
                  {r.servicios.map(s => (
                    <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.35rem 1rem 0.35rem 1.5rem', fontSize:'0.84rem' }}>
                      <span style={{ color:'#374151', flex:1 }}>{s.servicio?.nombre ?? 'Servicio'} × {s.cantidad}</span>
                      <span style={{ fontWeight:600, marginRight:8 }}>{fmt(s.subtotal)}</span>
                      <button onClick={() => quitarCargo(s.id)} title="Eliminar"
                        style={{ background:'none', border:'none', cursor:'pointer', color:'#EF4444', padding:2, display:'flex', flexShrink:0 }}>
                        <X size={13}/>
                      </button>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'0.45rem 1rem', fontSize:'0.85rem', background:'#F9FAFB' }}>
                    <span style={{ color:'#6B7280' }}>Subtotal servicios</span>
                    <span style={{ fontWeight:700 }}>{fmt(res.total_servicios)}</span>
                  </div>
                </>)}

                {/* Gran total */}
                <div style={{ display:'flex', justifyContent:'space-between', padding:'0.65rem 1rem', borderTop:'2px solid #E5E7EB', background:'#F9FAFB' }}>
                  <span style={{ fontWeight:800, fontSize:'0.9rem', color:'#111827' }}>TOTAL</span>
                  <span style={{ fontWeight:900, fontSize:'1rem', color:'#111827' }}>{fmt(res.gran_total)}</span>
                </div>
              </div>
            </div>

            {/* Historial de pagos */}
            {hay(r.pagos) && (
              <div style={{ border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden' }}>
                <div style={{ background:'#F9FAFB', padding:'0.6rem 1rem', borderBottom:'1px solid #E5E7EB' }}>
                  <p style={{ fontWeight:700, fontSize:'0.78rem', color:'#374151', margin:0 }}>Historial de pagos</p>
                </div>
                {r.pagos.map(p => (
                  <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 1rem', borderBottom:'1px solid #F9FAFB', fontSize:'0.84rem' }}>
                    <div>
                      <span style={{ fontWeight:600, color:'#374151' }}>{TIPO_LABEL[p.tipo_pago] ?? p.tipo_pago}</span>
                      <span style={{ color:'#9CA3AF', margin:'0 6px' }}>·</span>
                      <span style={{ color:'#6B7280' }}>{METODO_LABEL[p.metodo_pago] ?? p.metodo_pago}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:700 }}>{fmt(p.monto)}</span>
                      <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'2px 8px', borderRadius:9999,
                        background: p.estado==='verificado'?'#DCFCE7':p.estado==='pendiente'?'#FEF9C3':'#FEE2E2',
                        color:      p.estado==='verificado'?'#15803D':p.estado==='pendiente'?'#854D0E':'#DC2626' }}>
                        {p.estado}
                      </span>
                    </div>
                  </div>
                ))}
                {/* Totales finales */}
                <div style={{ padding:'0.5rem 1rem', background:'#F9FAFB', display:'flex', justifyContent:'space-between', fontSize:'0.84rem', borderTop:'1px solid #E5E7EB' }}>
                  <span style={{ color:'#6B7280' }}>Total pagado</span>
                  <span style={{ fontWeight:700, color:'#16A34A' }}>{fmt(res.total_pagado)}</span>
                </div>
                {res.saldo_pendiente > 0 && (
                  <div style={{ padding:'0.5rem 1rem', background:'#FEF9C3', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.84rem' }}>
                    <span style={{ fontWeight:700, color:'#92400E' }}>⚠️ Saldo a cobrar</span>
                    <span style={{ fontWeight:900, color:'#D97706', fontSize:'0.95rem' }}>{fmt(res.saldo_pendiente)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Cargo rápido */}
            {/* Método de pago del saldo (si aplica) */}
            {res.saldo_pendiente > 0 && (
              <div style={{ border:'1.5px solid #FDE68A', borderRadius:12, padding:'0.85rem 1rem', background:'#FFFBEB', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                <p style={{ fontWeight:700, fontSize:'0.82rem', color:'#92400E', margin:0 }}>
                  💳 Cobrar saldo al hacer check-out — {fmt(res.saldo_pendiente)}
                </p>
                <p style={{ fontSize:'0.72rem', color:'#B45309', margin:0 }}>Incluye alojamiento + servicios adicionales pendientes. Se registrará en Pagos.</p>
                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                  {['efectivo','yape','plin','transferencia','tarjeta'].map(m => (
                    <button key={m} onClick={() => setMetodoPago(m)}
                      style={{ padding:'5px 12px', borderRadius:8, border:`1.5px solid ${metodoPago===m?'#3D1A06':'#E5E7EB'}`, background:metodoPago===m?'#3D1A06':'white', color:metodoPago===m?'white':'#6B7280', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden' }}>
              <button onClick={() => setAddOpen(o => !o)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.65rem 1rem', background:'#F9FAFB', border:'none', cursor:'pointer', fontSize:'0.82rem', fontWeight:700, color:'#374151' }}>
                <span>+ Agregar cargo de último momento</span>
                <span style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>{addOpen ? '▲' : '▼'}</span>
              </button>
              {addOpen && (
                <div style={{ padding:'0.75rem 1rem', display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                    <select value={addId} onChange={e => setAddId(e.target.value)}
                      style={{ flex:1, minWidth:150, border:'1.5px solid #E5E7EB', borderRadius:9, padding:'0.5rem 0.75rem', fontSize:'0.83rem', outline:'none' }}>
                      <option value="">— Selecciona servicio —</option>
                      {catalogo.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre} · S/ {Number(s.precio).toFixed(2)}</option>
                      ))}
                    </select>
                    <input type="number" min={1} max={20} value={addQty} onChange={e => setAddQty(Number(e.target.value))}
                      style={{ width:65, border:'1.5px solid #E5E7EB', borderRadius:9, padding:'0.5rem', fontSize:'0.83rem', textAlign:'center', outline:'none' }} />
                    <button onClick={agregarCargo} disabled={!addId || addSaving}
                      style={{ padding:'0.5rem 1rem', borderRadius:9, border:'none', background:!addId||addSaving?'#9CA3AF':'#3D1A06', color:'white', fontWeight:700, fontSize:'0.82rem', cursor:!addId||addSaving?'not-allowed':'pointer' }}>
                      {addSaving ? '...' : 'Agregar'}
                    </button>
                  </div>
                  {addId && catalogo.find(s => s.id === Number(addId)) && (
                    <p style={{ fontSize:'0.72rem', color:'#6B7280', margin:0 }}>
                      Subtotal: <b>S/ {(Number(catalogo.find(s => s.id === Number(addId))?.precio) * addQty).toFixed(2)}</b>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="fp-noprint" style={{ display:'flex', gap:'0.6rem', paddingTop:'0.25rem' }}>
              <button onClick={imprimirFolio}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'0.65rem 1.1rem', borderRadius:10, border:'1.5px solid #E5E7EB', background:'white', color:'#374151', fontWeight:600, fontSize:'0.84rem', cursor:'pointer' }}>
                <Printer size={14}/> Imprimir folio
              </button>
              <button onClick={confirmar} disabled={saving}
                style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'0.75rem', borderRadius:12, border:'none', background:saving?'#9CA3AF':'linear-gradient(135deg,#7C3AED,#5B21B6)', color:'white', fontWeight:700, fontSize:'0.9rem', cursor:saving?'not-allowed':'pointer' }}>
                <CheckCircle size={16}/> {saving ? 'Procesando...' : res?.saldo_pendiente > 0 ? `Cobrar ${fmt(res.saldo_pendiente)} + Check-out` : 'Confirmar Check-out'}
              </button>
            </div>

          </>)}
        </div>
      </div>
    </div>
  )
}

export default function ReservasRecepcion() {
  const [reservas, setReservas] = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [filters, setFilters]   = useState({ estado: '', search: '', fecha_desde: '', fecha_hasta: '', page: 1 })
  const [accionando, setAccionando]    = useState(null)
  const [modalCheckin, setModalCI]     = useState(false)
  const [detalleCheckin, setDetalle]   = useState(null)
  const [modalNueva, setModalNueva]    = useState(false)
  const [codigoNuevo, setCodigoNuevo]  = useState(null) // codigo de reserva recién creada → ticket check-in
  const [codigoFolio, setCodigoFolio]  = useState(null) // codigo de reserva finalizada → folio checkout
  const [modalResumen, setModalResumen] = useState(null) // id de reserva para folio checkout
  const [modalCargos, setModalCargos]   = useState(null) // reserva objeto para cargos adicionales
  const [exporting, setExporting]      = useState(false)
  const toast   = useToast()
  const { confirm, dialog } = useConfirm()

  async function exportPdf() {
    setExporting(true)
    try {
      const params = {}
      if (filters.estado) params.estado = filters.estado
      const { data } = await axiosClient.get('/export/reservas', { params, responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }))
      const a = document.createElement('a'); a.href = url; a.download = 'reservas.pdf'; a.click()
      URL.revokeObjectURL(url)
    } catch { toast.error('No se pudo generar el PDF.') }
    finally { setExporting(false) }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: filters.page }
      if (filters.estado)      params.estado      = filters.estado
      if (filters.search)      params.search      = filters.search
      if (filters.fecha_desde) params.fecha_desde = filters.fecha_desde
      if (filters.fecha_hasta) params.fecha_hasta = filters.fecha_hasta
      const { data } = await reservasApi.getAll(params)
      setReservas(data.data); setMeta(data)
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { load() }, [load])

  async function accion(fn, id, successMsg) {
    setAccionando(id)
    try { await fn(id); load(); toast.success(successMsg ?? 'Acción completada.') }
    catch (err) { toast.error(err.response?.data?.message ?? 'Error al procesar.') }
    finally { setAccionando(null) }
  }

  const cell = { padding: '0.85rem 1rem', fontSize: '0.855rem', color: '#374151', borderBottom: '1px solid #F3F4F6', verticalAlign: 'middle' }
  const head = { padding: '0.7rem 1rem', fontSize: '0.7rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      {dialog}
      {modalCheckin && (
        <ModalCheckin
          onClose={() => setModalCI(false)}
          onDone={(msg) => { setModalCI(false); load(); if (msg) toast.success(msg) }}
          onCheckoutRequest={(id) => { setModalCI(false); setModalResumen(id) }}
        />
      )}
      {modalCargos && (
        <ModalCargosReserva
          reserva={modalCargos}
          onClose={() => setModalCargos(null)}
        />
      )}
      {modalResumen && (
        <ModalResumenCheckout
          reservaId={modalResumen}
          onClose={() => setModalResumen(null)}
          onCheckout={(codigo) => { setModalResumen(null); load(); toast.success('Check-out realizado exitosamente.'); if (codigo) setCodigoFolio(codigo) }}
        />
      )}
      {detalleCheckin && (
        <ModalDetalleCheckin
          reserva={detalleCheckin}
          onClose={() => setDetalle(null)}
          onCheckin={(id) => {
            setDetalle(null)
            accion(reservasApi.checkin, id, 'Check-in realizado.')
          }}
        />
      )}
      {modalNueva && (
        <ModalNuevaReserva
          onClose={() => setModalNueva(false)}
          onCreada={(codigo) => { setModalNueva(false); load(); toast.success('Reserva creada exitosamente.'); if (codigo) setCodigoNuevo(codigo) }}
        />
      )}

      {/* Banner ticket check-in */}
      {codigoNuevo && (
        <div style={{ position: 'fixed', bottom: '5rem', right: '1.5rem', zIndex: 500, background: '#16A34A', color: 'white', borderRadius: 14, padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.22)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>✅ Reserva creada</span>
          <button onClick={() => { window.open(`/ticket/${codigoNuevo}`, '_blank'); setCodigoNuevo(null) }}
            style={{ padding: '4px 14px', borderRadius: 8, border: 'none', background: 'white', color: '#16A34A', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            🖨 Ver ticket
          </button>
          <button onClick={() => setCodigoNuevo(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, opacity: 0.8 }}><X size={14}/></button>
        </div>
      )}

      {/* Banner folio checkout */}
      {codigoFolio && (
        <div style={{ position: 'fixed', bottom: codigoNuevo ? '8.5rem' : '5rem', right: '1.5rem', zIndex: 500, background: '#7C3AED', color: 'white', borderRadius: 14, padding: '0.85rem 1.1rem', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 6px 24px rgba(0,0,0,0.22)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>✅ Check-out completado</span>
          <button onClick={() => { window.open(`/folio/${codigoFolio}`, '_blank'); setCodigoFolio(null) }}
            style={{ padding: '4px 14px', borderRadius: 8, border: 'none', background: 'white', color: '#7C3AED', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            🖨 Ver folio
          </button>
          <button onClick={() => setCodigoFolio(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, opacity: 0.8 }}><X size={14}/></button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111', marginBottom: '0.15rem' }}>Reservas</h1>
          <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Gestión y seguimiento de reservaciones</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={exportPdf} disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', borderRadius: 12, border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#15803D', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
            <FileDown size={16}/> {exporting ? 'Generando...' : 'PDF'}
          </button>
          <button onClick={() => setModalNueva(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#F5922E,#E07820)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(245,146,46,0.3)' }}>
            <User size={16}/> Nueva Reserva
          </button>
          <button onClick={() => setModalCI(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.1rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#16A34A,#15803D)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
            <QrCode size={16}/> Check-in Rápido
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="Buscar código o cliente..." value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          style={{ flex: '1 1 180px', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none' }}/>
        <select value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value, page: 1 }))}
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none' }}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_STYLE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <input type="date" value={filters.fecha_desde} onChange={e => setFilters(f => ({ ...f, fecha_desde: e.target.value, page: 1 }))}
          title="Entrada desde"
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none', color: filters.fecha_desde ? '#374151' : '#9CA3AF' }}/>
        <input type="date" value={filters.fecha_hasta} onChange={e => setFilters(f => ({ ...f, fecha_hasta: e.target.value, page: 1 }))}
          title="Entrada hasta"
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none', color: filters.fecha_hasta ? '#374151' : '#9CA3AF' }}/>
        {(filters.fecha_desde || filters.fecha_hasta) && (
          <button onClick={() => setFilters(f => ({ ...f, fecha_desde: '', fecha_hasta: '', page: 1 }))}
            style={{ padding: '0.55rem 0.85rem', borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            × Fechas
          </button>
        )}
      </div>

      <div className="table-scroll" style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
          <thead>
            <tr>
              <th style={head}>Código</th>
              <th style={head}>Cliente</th>
              <th style={head}>Sede / Hab.</th>
              <th style={head}>Entrada</th>
              <th style={head}>Salida</th>
              <th style={head}>Noches</th>
              <th style={head}>Total</th>
              <th style={head}>Estado</th>
              <th style={{ ...head, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ ...cell, textAlign: 'center', color: '#9CA3AF' }}>Cargando...</td></tr>
            ) : reservas.length === 0 ? (
              <tr><td colSpan={9} style={{ ...cell, textAlign: 'center', color: '#9CA3AF', padding: '2.5rem' }}>No hay reservas</td></tr>
            ) : reservas.map(r => {
              const noches = Math.ceil((new Date(r.fecha_salida) - new Date(r.fecha_entrada)) / 86400000)
              const busy   = accionando === r.id
              return (
                <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                  <td style={cell}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3D1A06', fontSize: '0.8rem' }}>{r.codigo}</span>
                    {r.origen && r.origen !== 'online' && (
                      <div style={{ marginTop:2 }}>
                        <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'1px 7px', borderRadius:9999, background:r.origen==='presencial'?'#DBEAFE':'#EDE9FE', color:r.origen==='presencial'?'#1E40AF':'#5B21B6' }}>
                          {r.origen==='presencial'?'🏨 Presencial':'📞 Llamada'}
                        </span>
                      </div>
                    )}
                    {r.descuento_porcentaje > 0 && (
                      <div style={{ marginTop:2 }}>
                        <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'1px 7px', borderRadius:9999, background:'#FEF9C3', color:'#854D0E' }}>
                          🏷️ -{r.descuento_porcentaje}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={cell}>
                    <div style={{ fontWeight: 600 }}>{r.cliente?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{r.cliente?.email}</div>
                  </td>
                  <td style={cell}>
                    <div style={{ fontWeight: 500 }}>{r.sede?.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Hab. {r.habitacion?.numero}</div>
                  </td>
                  <td style={cell}>{new Date((r.fecha_entrada||'').slice(0,10)+'T12:00:00').toLocaleDateString('es-PE')}</td>
                  <td style={cell}>{new Date((r.fecha_salida||'').slice(0,10)+'T12:00:00').toLocaleDateString('es-PE')}</td>
                  <td style={{ ...cell, textAlign: 'center' }}>{noches}</td>
                  <td style={cell}><b>S/ {r.precio_total}</b></td>
                  <td style={cell}><EstadoBadge estado={r.estado}/></td>
                  <td style={{ ...cell, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {r.estado === 'pendiente' && (
                        <AccionBtn label={busy ? '...' : '✓ Confirmar'} color="white" bg="#2563EB" border="#2563EB"
                          onClick={() => accion(reservasApi.confirmar, r.id, 'Reserva confirmada.')}/>
                      )}
                      {r.estado === 'confirmada' && (
                        <AccionBtn label={busy ? '...' : '↓ Check-in'} color="white" bg="#059669" border="#059669"
                          onClick={() => setDetalle(r)}/>
                      )}
                      {r.estado === 'finalizada' && (
                        <AccionBtn label="🖨 Folio" color="#374151" bg="#F3F4F6" border="#E5E7EB"
                          onClick={() => window.open(`/folio/${r.codigo}`, '_blank')}/>
                      )}
                      {r.estado === 'checkin' && (<>
                        <AccionBtn label="📦 Servicios" color="#374151" bg="#F3F4F6" border="#E5E7EB"
                          onClick={() => setModalCargos(r)}/>
                        <AccionBtn label={busy ? '...' : '↑ Check-out'} color="white" bg="#7C3AED" border="#7C3AED"
                          onClick={() => setModalResumen(r.id)}/>
                      </>)}
                      {['pendiente','confirmada','checkin'].includes(r.estado) && (
                        <AccionBtn label="Cancelar" color="#DC2626" bg="#FEF2F2" border="#FEE2E2"
                          onClick={async () => {
                            const ok = await confirm({ title: 'Cancelar reserva', message: `¿Estás seguro de cancelar la reserva ${r.codigo}?`, confirmLabel: 'Sí, cancelar', danger: true })
                            if (ok) accion(reservasApi.cancelar, r.id, 'Reserva cancelada.')
                          }}/>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {meta?.last_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E5E7EB', cursor: 'pointer', fontWeight: filters.page === p ? 700 : 400, background: filters.page === p ? '#F5922E' : 'white', color: filters.page === p ? 'white' : '#374151' }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
