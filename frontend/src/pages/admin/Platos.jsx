import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Pencil, Trash2, UtensilsCrossed, Tag, ToggleLeft, ToggleRight, X, QrCode, Printer, Download, ImagePlus, Loader2, Minus } from 'lucide-react'
import { QRCode } from 'react-qr-code'
import { restauranteApi } from '../../api/restaurante'
import { useToast } from '../../context/ToastContext'

/* ── QR Modal ─────────────────────────────────────────── */
function QrModal({ onClose }) {
  const qrRef = useRef(null)
  const [cantidad, setCantidad] = useState(4)
  const restaurantUrl = `${window.location.origin}/restaurant`
  const logoUrl = `${window.location.origin}${import.meta.env.BASE_URL}images/Logo-hotel.jpeg`

  function tarjetaHTML(qrSvg, logoSrc) {
    return `
      <div class="ticket">
        <div class="ticket-head">
          <img class="logo" src="${logoSrc}" alt="Logo"/>
          <p class="logo-line">BRISAS DE MAYO</p>
          <p class="sub-line">Restaurante</p>
        </div>
        <div class="qr-frame">
          <div class="qr-wrap">${qrSvg}</div>
        </div>
        <p class="scan-line">Escanea para ver el menú</p>
        <p class="url-line">${restaurantUrl}</p>
        <hr class="divider"/>
        <p class="footer">Huancaya, Yauyos · Perú</p>
      </div>
    `
  }

  // Convierte la imagen a data URL para que quede embebida en el HTML de la
  // ventana de impresión — así no depende de una descarga de red que podría
  // no terminar a tiempo antes de imprimir.
  async function logoComoDataUrl() {
    try {
      const res = await fetch(logoUrl)
      const blob = await res.blob()
      return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch {
      return logoUrl
    }
  }

  async function handlePrint() {
    const svg = qrRef.current?.innerHTML
    if (!svg) return
    // window.open debe llamarse de inmediato (gesto síncrono del clic) para
    // que el navegador no lo bloquee como popup — el resto puede ser async.
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    const logoSrc = await logoComoDataUrl()
    const tarjetas = Array.from({ length: cantidad }, () => tarjetaHTML(svg, logoSrc)).join('')
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Restaurante — Brisas de Mayo</title>
        <style>
          * {
            margin: 0; padding: 0; box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: white; }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8mm;
          }
          .ticket {
            border: 2px dashed #D4A843;
            border-radius: 14px;
            overflow: hidden;
            text-align: center;
            break-inside: avoid;
            background: #FFFDF9;
          }
          .ticket-head {
            background: linear-gradient(135deg,#3D1A06,#7B4019);
            padding: 14px 14px 12px;
          }
          .logo { height: 40px; width: 40px; object-fit: cover; border-radius: 50%; border: 2px solid #D4A843; display: block; margin: 0 auto 6px; background: white; }
          .logo-line { font-size: 13px; font-weight: 900; color: white; letter-spacing: 0.05em; margin-bottom: 2px; }
          .sub-line   { font-size: 10px; color: #D4A843; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
          .qr-frame   { padding: 16px 16px 4px; }
          .qr-wrap    { display: flex; justify-content: center; padding: 10px; background: white; border-radius: 10px; border: 1px solid #F3E3C6; }
          .scan-line  { font-size: 11px; font-weight: 800; color: #3D1A06; text-transform: uppercase; letter-spacing: 0.08em; margin: 10px 0 4px; }
          .url-line   { font-size: 8px; color: #9CA3AF; word-break: break-all; padding: 0 10px; }
          .divider    { border: none; border-top: 1px dashed #E4D6C3; margin: 12px 14px 8px; }
          .footer     { font-size: 9px; color: #7B4019; font-weight: 600; padding-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="grid">${tarjetas}</div>
      </body>
      </html>
    `)
    win.document.close()
    // El logo ya va embebido como data URL, así que onload resuelve casi de
    // inmediato — más confiable que un temporizador fijo.
    win.onload = () => {
      win.focus()
      win.print()
      win.close()
    }
  }

  function handleDownload() {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 512
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 512, 512)
      ctx.drawImage(img, 0, 0, 512, 512)
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = 'qr-restaurante-brisas.png'
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 24, width: '100%', maxWidth: 440, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#3D1A06,#7B4019)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={20} style={{ color: '#D4A843' }}/>
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>QR del Restaurante</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', margin: 0 }}>Para imprimir y pegar en las mesas</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}>
            <X size={16}/>
          </button>
        </div>

        {/* QR preview — aspecto de tarjeta de mesa */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ border: '2px dashed #D4A843', borderRadius: 16, overflow: 'hidden', textAlign: 'center', background: '#FFFDF9', width: '100%', maxWidth: 280 }}>
            <div style={{ background: 'linear-gradient(135deg,#3D1A06,#7B4019)', padding: '1.1rem 1rem 0.9rem' }}>
              <img src="/images/Logo-hotel.jpeg" alt="Logo"
                style={{ height: 44, width: 44, objectFit: 'cover', borderRadius: '50%', border: '2px solid #D4A843', display: 'block', margin: '0 auto 6px', background: 'white' }}
                onError={e => { e.currentTarget.style.display = 'none' }}/>
              <p style={{ fontWeight: 900, fontSize: '0.95rem', color: 'white', letterSpacing: '0.04em', margin: '0 0 2px' }}>BRISAS DE MAYO</p>
              <p style={{ fontSize: '0.68rem', color: '#D4A843', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Restaurante</p>
            </div>
            <div style={{ padding: '1.25rem 1.5rem 0.25rem' }}>
              <div ref={qrRef} style={{ display: 'flex', justifyContent: 'center', padding: 10, background: 'white', borderRadius: 10, border: '1px solid #F3E3C6' }}>
                <QRCode
                  value={restaurantUrl}
                  size={170}
                  style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  viewBox="0 0 256 256"
                  fgColor="#3D1A06"
                />
              </div>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3D1A06', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0.75rem 0 4px' }}>Escanea para ver el menú</p>
              <p style={{ fontSize: '0.65rem', color: '#9CA3AF', wordBreak: 'break-all', margin: '0 0 1rem' }}>{restaurantUrl}</p>
            </div>
          </div>

          {/* Cantidad a imprimir */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '1.25rem', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '0.6rem 0.9rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#7B4019' }}>Tarjetas a imprimir</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => setCantidad(c => Math.max(1, c - 1))}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3D1A06' }}>
                <Minus size={13}/>
              </button>
              <input type="number" min="1" max="60" value={cantidad}
                onChange={e => setCantidad(Math.min(60, Math.max(1, Number(e.target.value) || 1)))}
                style={{ width: 40, textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', color: '#3D1A06', border: 'none', background: 'transparent', fontFamily: 'inherit' }}/>
              <button type="button" onClick={() => setCantidad(c => Math.min(60, c + 1))}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: '#F5922E', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Plus size={13}/>
              </button>
            </div>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.85rem', textAlign: 'center' }}>
            Una tarjeta por mesa · Soporta cualquier app de cámara
          </p>

          {/* Acciones */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', width: '100%' }}>
            <button onClick={handlePrint}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '0.8rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#3D1A06,#7B4019)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(61,26,6,0.3)' }}>
              <Printer size={16}/> Imprimir {cantidad}
            </button>
            <button onClick={handleDownload}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '0.8rem', borderRadius: 12, border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              <Download size={16}/> Descargar PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ModalPlato({ plato, categorias, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    categoria_id: plato?.categoria_id ?? (categorias[0]?.id ?? ''),
    nombre:       plato?.nombre       ?? '',
    descripcion:  plato?.descripcion  ?? '',
    precio:       plato?.precio       ?? '',
    imagen_url:   plato?.imagen_url   ?? '',
    disponible:   plato?.disponible   ?? true,
  })
  const [saving, setSaving]       = useState(false)
  const [errs, setErrs]           = useState({})
  const [uploading, setUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState(null)
  const fileRef = useRef(null)

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  // Libera el blob temporal cuando se reemplaza por otro o por la URL final del servidor
  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview) }, [localPreview])

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLocalPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await restauranteApi.subirImagenPlato(fd)
      set('imagen_url', data.url)
      setLocalPreview(null)
    } catch {
      toast.error('No se pudo subir la imagen.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true); setErrs({})
    try {
      const payload = { ...form, categoria_id: Number(form.categoria_id), precio: Number(form.precio) }
      if (plato?.id) await restauranteApi.updatePlato(plato.id, payload)
      else           await restauranteApi.storePlato(payload)
      toast.success(plato?.id ? 'Plato actualizado.' : 'Plato creado.')
      onSaved()
    } catch (err) {
      if (err.response?.status === 422) setErrs(err.response.data.errors ?? {})
      else toast.error('No se pudo guardar el plato.')
    } finally { setSaving(false) }
  }

  const ErrMsg = ({ f }) => errs[f]?.[0] ? <p style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: 2 }}>{errs[f][0]}</p> : null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: 0 }}>{plato?.id ? 'Editar plato' : 'Nuevo plato'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="field-label">Categoría</label>
            <select className="field-input" value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)} required>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <ErrMsg f="categoria_id"/>
          </div>
          <div>
            <label className="field-label">Nombre del plato</label>
            <input className="field-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} required maxLength={120}/>
            <ErrMsg f="nombre"/>
          </div>
          <div>
            <label className="field-label">Descripción (opcional)</label>
            <textarea className="field-input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} rows={3} style={{ resize: 'vertical' }}/>
          </div>
          <div className="grid-responsive-2">
            <div>
              <label className="field-label">Precio (S/)</label>
              <input className="field-input" type="number" step="0.01" min="0" value={form.precio} onChange={e => set('precio', e.target.value)} required/>
              <ErrMsg f="precio"/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <label className="field-label">Disponible</label>
              <button type="button" onClick={() => set('disponible', !form.disponible)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', cursor: 'pointer', padding: '0.7rem 0', color: form.disponible ? '#15803D' : '#9CA3AF', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                {form.disponible ? <ToggleRight size={24} style={{ color: '#15803D' }}/> : <ToggleLeft size={24}/>}
                {form.disponible ? 'Disponible' : 'No disponible'}
              </button>
            </div>
          </div>
          <div>
            <label className="field-label">Foto del plato (opcional)</label>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <div style={{ position: 'relative', width: 84, height: 84, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB' }}>
                {(localPreview || form.imagen_url) ? (
                  <img src={localPreview || form.imagen_url} alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.currentTarget.style.display = 'none' }}/>
                ) : (
                  <UtensilsCrossed size={22} style={{ color: '#D1D5DB' }}/>
                )}
                {uploading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={18} style={{ color: '#F5922E', animation: 'spin 1s linear infinite' }}/>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
                <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} style={{ display: 'none' }}/>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '0.6rem', borderRadius: 10, border: '2px dashed #D1D5DB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.82rem', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1, fontFamily: 'inherit' }}>
                  {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }}/> : <ImagePlus size={14}/>}
                  {uploading ? 'Subiendo...' : 'Subir foto'}
                </button>
                <input className="field-input" type="url" value={form.imagen_url} onChange={e => set('imagen_url', e.target.value)} placeholder="...o pega una URL de imagen" style={{ fontSize: '0.78rem' }}/>
              </div>
            </div>
            <ErrMsg f="imagen_url"/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving || uploading} className="btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalCategoria({ cat, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({ nombre: cat?.nombre ?? '', descripcion: cat?.descripcion ?? '', orden: cat?.orden ?? 0, activo: cat?.activo ?? true })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (cat?.id) await restauranteApi.updateCat(cat.id, form)
      else         await restauranteApi.storeCat(form)
      toast.success(cat?.id ? 'Categoría actualizada.' : 'Categoría creada.')
      onSaved()
    } catch { toast.error('No se pudo guardar.') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontWeight: 800, margin: 0, fontSize: '0.95rem' }}>{cat?.id ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div>
            <label className="field-label">Nombre</label>
            <input className="field-input" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required/>
          </div>
          <div>
            <label className="field-label">Descripción (opcional)</label>
            <input className="field-input" value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}/>
          </div>
          <div>
            <label className="field-label">Orden</label>
            <input className="field-input" type="number" min="0" value={form.orden} onChange={e => setForm(p => ({ ...p, orden: Number(e.target.value) }))}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Platos() {
  const toast = useToast()
  const [menu, setMenu]           = useState([])
  const [categorias, setCats]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [modalPlato, setMPlato]   = useState(null)
  const [showQr,    setShowQr]    = useState(false)
  const [modalCat, setMCat]       = useState(null)
  const [showCats, setShowCats]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [menuR, catsR] = await Promise.all([restauranteApi.platos(), restauranteApi.categorias()])
      setMenu(menuR.data)
      setCats(catsR.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleDisponible(plato) {
    try {
      await restauranteApi.updatePlato(plato.id, { disponible: !plato.disponible })
      load()
    } catch { toast.error('Error al cambiar disponibilidad.') }
  }

  async function deletePlato(plato) {
    if (!confirm(`¿Eliminar "${plato.nombre}"?`)) return
    try {
      await restauranteApi.deletePlato(plato.id)
      toast.success('Plato eliminado.')
      load()
    } catch { toast.error('No se pudo eliminar.') }
  }

  async function deleteCat(cat) {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"? Los platos asociados también se eliminarán.`)) return
    try {
      await restauranteApi.deleteCat(cat.id)
      toast.success('Categoría eliminada.')
      load()
    } catch (err) { toast.error(err.response?.data?.message ?? 'No se pudo eliminar.') }
  }

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Platos del Restaurante</h1>
          <p className="section-subtitle">Gestiona el menú por categorías</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowQr(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#D4A843', color: '#7B4019' }}>
            <QrCode size={15}/> QR de mesas
          </button>
          <button onClick={() => setShowCats(v => !v)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tag size={15}/> {showCats ? 'Ocultar categorías' : 'Categorías'}
          </button>
          <button onClick={() => setMPlato({})} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }} disabled={categorias.length === 0}>
            <Plus size={15}/> Nuevo plato
          </button>
        </div>
      </div>

      {categorias.length === 0 && !loading && (
        <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Tag size={16} style={{ color: '#EA580C' }}/>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400E' }}>Debes crear al menos una <strong>categoría</strong> antes de agregar platos.</p>
          <button onClick={() => { setShowCats(true); setMCat({}) }} className="btn-primary" style={{ marginLeft: 'auto', padding: '5px 14px', fontSize: '0.8rem' }}>
            Crear categoría
          </button>
        </div>
      )}

      {/* Panel de categorías */}
      {showCats && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', margin: 0 }}>Categorías</h2>
            <button onClick={() => setMCat({})} className="btn-primary" style={{ padding: '5px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Plus size={13}/> Nueva
            </button>
          </div>
          {categorias.length === 0 ? (
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>Sin categorías aún</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {categorias.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: cat.activo ? '#F0FDF4' : '#F9FAFB', border: `1px solid ${cat.activo ? '#BBF7D0' : '#E5E7EB'}`, borderRadius: 10, padding: '6px 12px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.82rem', color: cat.activo ? '#15803D' : '#9CA3AF' }}>{cat.nombre}</span>
                  {cat.orden > 0 && <span style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>#{cat.orden}</span>}
                  <button onClick={() => setMCat(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2 }}><Pencil size={12}/></button>
                  <button onClick={() => deleteCat(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: 2 }}><Trash2 size={12}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista de platos por categoría */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#9CA3AF' }}>Cargando...</div>
      ) : menu.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <UtensilsCrossed size={40} style={{ color: '#D1D5DB', margin: '0 auto 0.75rem' }}/>
          <p style={{ fontWeight: 600, color: '#374151' }}>Sin platos aún</p>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Crea una categoría y agrega tu primer plato</p>
        </div>
      ) : (
        menu.map(cat => (
          <div key={cat.id} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#374151', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 18, background: '#F5922E', borderRadius: 2, display: 'inline-block' }}/>
              {cat.nombre}
              <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 400 }}>({cat.platos?.length ?? 0} platos)</span>
            </h2>
            <div className="card" style={{ overflow: 'hidden' }}>
              {cat.platos?.length === 0 ? (
                <p style={{ padding: '1.5rem', textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>Sin platos en esta categoría</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                      {['Plato', 'Descripción', 'Precio', 'Estado', 'Acciones'].map(h => (
                        <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cat.platos.map(plato => (
                      <tr key={plato.id} style={{ borderBottom: '1px solid #F9FAFB' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {plato.imagen_url ? (
                              <img src={plato.imagen_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.style.display = 'none' }}/>
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <UtensilsCrossed size={16} style={{ color: '#D1D5DB' }}/>
                              </div>
                            )}
                            <span style={{ fontWeight: 600, color: '#111827' }}>{plato.nombre}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#6B7280', maxWidth: 200 }}>
                          <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.78rem' }}>
                            {plato.descripcion || '—'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#F5922E', whiteSpace: 'nowrap' }}>
                          S/ {Number(plato.precio).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <button onClick={() => toggleDisponible(plato)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.78rem', color: plato.disponible ? '#15803D' : '#9CA3AF', padding: 0 }}>
                            {plato.disponible ? <ToggleRight size={20} style={{ color: '#15803D' }}/> : <ToggleLeft size={20}/>}
                            {plato.disponible ? 'Disponible' : 'No disp.'}
                          </button>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => setMPlato(plato)}
                              style={{ padding: '5px 10px', borderRadius: 8, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#374151' }}>
                              <Pencil size={12}/> Editar
                            </button>
                            <button onClick={() => deletePlato(plato)} className="btn-danger">
                              <Trash2 size={12}/> Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ))
      )}

      {/* Modales */}
      {modalPlato !== null && (
        <ModalPlato plato={modalPlato} categorias={categorias} onClose={() => setMPlato(null)} onSaved={() => { setMPlato(null); load() }}/>
      )}
      {modalCat !== null && (
        <ModalCategoria cat={modalCat} onClose={() => setMCat(null)} onSaved={() => { setMCat(null); load() }}/>
      )}
      {showQr && <QrModal onClose={() => setShowQr(false)}/>}
    </div>
  )
}
