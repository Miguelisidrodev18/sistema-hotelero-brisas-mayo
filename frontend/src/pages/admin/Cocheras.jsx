import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Car, Bike, Accessibility, RefreshCw } from 'lucide-react'
import { cocherasApi } from '../../api/cocheras'
import { sedesApi } from '../../api/sedes'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'

const TIPO_META = {
  auto:          { label: 'Auto',          icon: Car,          color: '#1D4ED8', bg: '#EFF6FF' },
  moto:          { label: 'Moto',          icon: Bike,         color: '#7C3AED', bg: '#F5F3FF' },
  discapacitado: { label: 'Discapacitado', icon: Accessibility, color: '#0F766E', bg: '#F0FDFA' },
}

const ESTADO_META = {
  disponible:    { label: 'Disponible',    color: '#16A34A', bg: '#DCFCE7' },
  reservada:     { label: 'Reservada',     color: '#2563EB', bg: '#DBEAFE' },
  ocupada:       { label: 'Ocupada',       color: '#DC2626', bg: '#FEE2E2' },
  mantenimiento: { label: 'Mantenimiento', color: '#D97706', bg: '#FEF3C7' },
}

function Badge({ tipo, estado }) {
  const m = tipo ? TIPO_META[tipo] : ESTADO_META[estado]
  if (!m) return null
  const Icon = m.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: m.bg, color: m.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
      {Icon && <Icon size={11}/>} {m.label}
    </span>
  )
}

const MODAL_INIT = { sede_id: '', numero: '', tipo: 'auto', precio_noche: '0', descripcion: '' }

function Modal({ inicial, sedes, onSave, onClose }) {
  const [form, setForm] = useState(inicial ?? MODAL_INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const edit = !!inicial?.id

  const inp = { border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.65rem 0.9rem', fontSize: '0.875rem', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lbl = { fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem', display: 'block' }

  async function handleSave() {
    setSaving(true); setError('')
    try {
      if (edit) await cocherasApi.update(inicial.id, form)
      else       await cocherasApi.create(form)
      onSave()
    } catch (err) {
      setError(err.response?.data?.message ?? Object.values(err.response?.data?.errors ?? {})[0]?.[0] ?? 'Error al guardar.')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 440, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', marginBottom: '1.25rem' }}>
          {edit ? 'Editar espacio' : 'Nuevo espacio de cochera'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={lbl}>Sede *</label>
            <select style={inp} value={form.sede_id} onChange={e => setForm(f => ({ ...f, sede_id: e.target.value }))} disabled={edit}>
              <option value="">Selecciona una sede</option>
              {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>Número / Código *</label>
              <input style={inp} value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} placeholder="Ej: A-01"/>
            </div>
            <div>
              <label style={lbl}>Tipo *</label>
              <select style={inp} value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="auto">Auto</option>
                <option value="moto">Moto</option>
                <option value="discapacitado">Discapacitado</option>
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Precio por noche (S/)</label>
            <input type="number" min="0" style={inp} value={form.precio_noche} onChange={e => setForm(f => ({ ...f, precio_noche: e.target.value }))}/>
            <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.2rem' }}>Usa 0 si está incluido en la reserva</p>
          </div>
          {edit && (
            <div>
              <label style={lbl}>Estado</label>
              <select style={inp} value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
                {Object.entries(ESTADO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={lbl}>Descripción <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(opcional)</span></label>
            <input style={inp} value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej: Espacio techado, lado norte"/>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 10, padding: '0.7rem 1rem', fontSize: '0.82rem', marginTop: '0.9rem' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.25rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.75rem', border: '1.5px solid #E5E7EB', borderRadius: 10, background: 'white', cursor: 'pointer', fontWeight: 600, color: '#374151' }}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || !form.sede_id || !form.numero}
            style={{ flex: 2, padding: '0.75rem', border: 'none', borderRadius: 10, background: saving ? '#E5E7EB' : 'linear-gradient(135deg,#F5922E,#E07820)', color: saving ? '#9CA3AF' : 'white', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Guardando...' : edit ? 'Guardar cambios' : 'Crear espacio'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Cocheras() {
  const [cocheras, setCocheras] = useState([])
  const [sedes, setSedes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [filters, setFilters]   = useState({ sede_id: '', estado: '', tipo: '' })
  const toast = useToast()
  const { confirm, dialog } = useConfirm()

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (filters.sede_id) params.sede_id = filters.sede_id
    if (filters.estado)  params.estado  = filters.estado
    if (filters.tipo)    params.tipo    = filters.tipo
    cocherasApi.getAll(params)
      .then(r => setCocheras(r.data))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load() }, [load])
  useEffect(() => { sedesApi.getAll().then(r => setSedes(r.data)).catch(() => {}) }, [])

  async function eliminar(c) {
    const ok = await confirm({ title: 'Eliminar espacio', message: `¿Eliminar el espacio ${c.numero} de ${c.sede?.nombre}?`, confirmLabel: 'Eliminar', danger: true })
    if (!ok) return
    try { await cocherasApi.destroy(c.id); toast.success('Espacio eliminado.'); load() }
    catch { toast.error('No se puede eliminar este espacio.') }
  }

  const inp = { border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '0.55rem 0.9rem', fontSize: '0.85rem', outline: 'none', background: 'white' }

  // Conteos por estado
  const counts = cocheras.reduce((a, c) => { a[c.estado] = (a[c.estado] || 0) + 1; return a }, {})

  return (
    <div>
      {dialog}
      {modal && (
        <Modal
          inicial={modal === 'nuevo' ? null : modal}
          sedes={sedes}
          onSave={() => { setModal(null); load() }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827' }}>Cocheras</h1>
          <p style={{ fontSize: '0.82rem', color: '#9CA3AF' }}>Gestión de espacios de estacionamiento</p>
        </div>
        <button onClick={() => setModal('nuevo')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.65rem 1.1rem', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg,#F5922E,#E07820)', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
          <Plus size={16}/> Nuevo espacio
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {Object.entries(ESTADO_META).map(([k, v]) => (
          <div key={k} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: v.color }}>{counts[k] ?? 0}</span>
            <span style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>{v.label}</span>
          </div>
        ))}
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '0.85rem 1rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3D1A06' }}>{cocheras.length}</span>
          <p style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>Total</p>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select style={inp} value={filters.sede_id} onChange={e => setFilters(f => ({ ...f, sede_id: e.target.value }))}>
          <option value="">Todas las sedes</option>
          {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </select>
        <select style={inp} value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={inp} value={filters.tipo} onChange={e => setFilters(f => ({ ...f, tipo: e.target.value }))}>
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={load} style={{ ...inp, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#6B7280' }}>
          <RefreshCw size={13}/> Actualizar
        </button>
      </div>

      {/* Grid de espacios */}
      {loading ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '3rem' }}>Cargando...</p>
      ) : cocheras.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚗</p>
          <p style={{ color: '#6B7280', fontWeight: 600 }}>No hay espacios registrados</p>
          <p style={{ color: '#9CA3AF', fontSize: '0.82rem' }}>Crea el primer espacio de cochera</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {cocheras.map(c => {
            const tipoM  = TIPO_META[c.tipo]
            const estM   = ESTADO_META[c.estado]
            const TipoIcon = tipoM?.icon ?? Car
            return (
              <div key={c.id} style={{ background: 'white', borderRadius: 16, border: `2px solid ${estM?.bg ?? '#E5E7EB'}`, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: tipoM?.bg ?? '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TipoIcon size={22} style={{ color: tipoM?.color ?? '#6B7280' }}/>
                  </div>
                  <Badge estado={c.estado}/>
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111827' }}>Espacio {c.numero}</p>
                  <p style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>{c.sede?.nombre}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Badge tipo={c.tipo}/>
                  <span style={{ fontWeight: 700, color: '#F5922E', fontSize: '0.9rem' }}>
                    {c.precio_noche > 0 ? `S/ ${c.precio_noche}/noche` : 'Incluido'}
                  </span>
                </div>
                {c.descripcion && <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{c.descripcion}</p>}
                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #F3F4F6', paddingTop: '0.75rem' }}>
                  <button onClick={() => setModal(c)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>
                    <Pencil size={12}/> Editar
                  </button>
                  <button onClick={() => eliminar(c)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '0.5rem', border: '1.5px solid #FEE2E2', borderRadius: 8, background: '#FEF2F2', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, color: '#DC2626' }}>
                    <Trash2 size={12}/> Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
