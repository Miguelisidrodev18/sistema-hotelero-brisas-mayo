import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'
import axiosClient from '../../api/axiosClient'
import { Plus, Edit2, Trash2, Coffee, Car, Shirt, Package } from 'lucide-react'

const CATEGORIAS = [
  { id: 'desayuno',   label: 'Desayuno',   icon: Coffee },
  { id: 'lavanderia', label: 'Lavandería',  icon: Shirt  },
  { id: 'transporte', label: 'Transporte',  icon: Car    },
  { id: 'otros',      label: 'Otros',       icon: Package},
]

const CAT_META = Object.fromEntries(CATEGORIAS.map(c => [c.id, c]))

function CatBadge({ categoria }) {
  const meta = CAT_META[categoria] ?? { label: categoria, icon: Package }
  const Icon = meta.icon
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F3F4F6', color: '#374151', fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 9999 }}>
      <Icon size={11}/> {meta.label}
    </span>
  )
}

function ServicioModal({ servicio, sedes, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    nombre:      servicio?.nombre      ?? '',
    categoria:   servicio?.categoria   ?? 'otros',
    descripcion: servicio?.descripcion ?? '',
    precio:      servicio?.precio      ?? '',
    activo:      servicio?.activo      ?? true,
  })

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{servicio ? 'Editar servicio' : 'Nuevo servicio'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="field-label">Nombre del servicio *</label>
            <input className="field-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Desayuno buffet"/>
          </div>
          <div className="grid-responsive-2">
            <div>
              <label className="field-label">Categoría *</label>
              <select className="field-input" value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Precio (S/) *</label>
              <input className="field-input" type="number" min="0" step="0.50" value={form.precio} onChange={e => set('precio', e.target.value)} required/>
            </div>
          </div>
          <div>
            <label className="field-label">Descripción</label>
            <textarea className="field-input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ minHeight: 60, resize: 'vertical' }} placeholder="Descripción opcional..."/>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" id="activo" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }}/>
            <label htmlFor="activo" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>Servicio activo</label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={() => onSave(form)} disabled={saving || !form.nombre || !form.precio} className="btn-primary">
              {saving ? 'Guardando...' : servicio ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Servicios() {
  const toast = useToast()
  const { confirm, dialog } = useConfirm()
  const [servicios, setServicios] = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null) // null | 'nuevo' | servicio
  const [saving, setSaving]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axiosClient.get('/servicios')
      setServicios(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    setSaving(true)
    try {
      if (modal === 'nuevo') {
        await axiosClient.post('/servicios', form)
        toast.success('Servicio creado correctamente.')
      } else {
        await axiosClient.put(`/servicios/${modal.id}`, form)
        toast.success('Servicio actualizado.')
      }
      setModal(null); load()
    } catch { toast.error('No se pudo guardar el servicio.') }
    finally { setSaving(false) }
  }

  async function handleDelete(s) {
    const ok = await confirm({ title: 'Eliminar servicio', message: `¿Eliminar "${s.nombre}"? Los registros históricos no se verán afectados.`, confirmLabel: 'Eliminar', danger: true })
    if (!ok) return
    try { await axiosClient.delete(`/servicios/${s.id}`); toast.success('Servicio eliminado.'); load() }
    catch { toast.error('No se pudo eliminar.') }
  }

  const grupos = CATEGORIAS.map(c => ({
    ...c,
    items: servicios.filter(s => s.categoria === c.id),
  })).filter(g => g.items.length > 0)

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Servicios adicionales</h1>
          <p className="section-subtitle">Catálogo de servicios que se pueden agregar a una reserva</p>
        </div>
        <button onClick={() => setModal('nuevo')} className="btn-primary">
          <Plus size={15}/> Nuevo servicio
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem' }}>Cargando...</div>
      ) : servicios.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛎️</p>
          <p style={{ fontWeight: 600, color: '#374151' }}>No hay servicios aún</p>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: 4 }}>Crea el primer servicio del catálogo</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {grupos.map(grupo => {
            const Icon = grupo.icon
            return (
              <div key={grupo.id} className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1.25rem', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={15} style={{ color: '#6B7280' }}/><span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#374151' }}>{grupo.label}</span>
                  <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>({grupo.items.length})</span>
                </div>
                <div className="table-scroll">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr>
                        {['Nombre', 'Descripción', 'Precio', 'Estado', 'Acciones'].map(h => (
                          <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.items.map((s, i) => (
                        <tr key={s.id} style={{ borderBottom: i < grupo.items.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{s.nombre}</td>
                          <td style={{ padding: '0.75rem 1rem', color: '#9CA3AF', fontSize: '0.82rem' }}>{s.descripcion || '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#F5922E' }}>S/ {Number(s.precio).toFixed(2)}</td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ background: s.activo ? '#D1FAE5' : '#F3F4F6', color: s.activo ? '#065F46' : '#6B7280', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
                              {s.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => setModal(s)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
                                <Edit2 size={12}/> Editar
                              </button>
                              <button onClick={() => handleDelete(s)} className="btn-danger">
                                <Trash2 size={12}/> Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <ServicioModal
          servicio={modal === 'nuevo' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
      {dialog}
    </div>
  )
}
