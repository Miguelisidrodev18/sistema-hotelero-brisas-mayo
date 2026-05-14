import { useState, useEffect, useCallback } from 'react'
import { sedesApi } from '../../api/sedes'

const EMPTY = { nombre: '', descripcion: '', direccion: '', ciudad: '', telefono: '', email: '', logo_url: '', vista_principal: '', activo: true }

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  )
}

function SedeForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    try {
      await onSave(form)
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors ?? {})
    }
  }

  const inp = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: '0.875rem', outline: 'none' }
  const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }
  const err = (f) => errors[f]?.[0] ? <p style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors[f][0]}</p> : null

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={lbl}>Nombre de la sede *</label>
        <input style={inp} value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Brisas I — Laguna"/>
        {err('nombre')}
      </div>
      <div>
        <label style={lbl}>Descripción</label>
        <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción breve de la sede..."/>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={lbl}>Ciudad</label>
          <input style={inp} value={form.ciudad} onChange={e => set('ciudad', e.target.value)} placeholder="Huancaya"/>
        </div>
        <div>
          <label style={lbl}>Teléfono</label>
          <input style={inp} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="999888777"/>
        </div>
      </div>
      <div>
        <label style={lbl}>Dirección</label>
        <input style={inp} value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Jr. Las Cascadas 123"/>
      </div>
      <div>
        <label style={lbl}>Email de contacto</label>
        <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="sede@brisasdemayo.com"/>
        {err('email')}
      </div>
      <div>
        <label style={lbl}>URL del logo</label>
        <input style={inp} value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..."/>
      </div>
      <div>
        <label style={lbl}>URL imagen principal</label>
        <input style={inp} value={form.vista_principal} onChange={e => set('vista_principal', e.target.value)} placeholder="https://..."/>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)}/>
        Sede activa
      </label>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none', background: '#F5922E', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Guardando...' : initial.id ? 'Actualizar' : 'Crear sede'}
        </button>
      </div>
    </form>
  )
}

function SedeCard({ sede, onEdit, onDelete }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Imagen */}
      <div style={{ height: 140, background: 'linear-gradient(135deg, #3D1A06, #7B4019)', position: 'relative', overflow: 'hidden' }}>
        {sede.vista_principal && (
          <img src={sede.vista_principal} alt={sede.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => e.target.style.display = 'none'}/>
        )}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span style={{
            padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
            background: sede.activo ? '#D1FAE5' : '#FEE2E2',
            color:      sede.activo ? '#065F46' : '#991B1B',
          }}>
            {sede.activo ? 'Activa' : 'Inactiva'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '1rem', flex: 1 }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111', marginBottom: '0.25rem' }}>{sede.nombre}</h3>
        {sede.ciudad && <p style={{ fontSize: '0.8rem', color: '#6B7280', marginBottom: '0.5rem' }}>📍 {sede.ciudad}</p>}
        {sede.descripcion && (
          <p style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.5, marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {sede.descripcion}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: '#9CA3AF', flexWrap: 'wrap' }}>
          {sede.telefono && <span>📞 {sede.telefono}</span>}
          <span>🛏 {sede.habitaciones_count ?? 0} habitaciones</span>
        </div>
      </div>

      {/* Acciones */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #F3F4F6', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button onClick={() => onEdit(sede)}
          style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          ✏️ Editar
        </button>
        <button onClick={() => onDelete(sede)}
          style={{ padding: '5px 14px', borderRadius: 7, border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#DC2626' }}>
          🗑️ Eliminar
        </button>
      </div>
    </div>
  )
}

export default function Sedes() {
  const [sedes, setSedes]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [modal, setModal]       = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [delError, setDelError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await sedesApi.getAll()
      setSedes(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    setSaving(true)
    try {
      if (modal === 'create') {
        await sedesApi.create(form)
      } else {
        await sedesApi.update(modal.id, form)
      }
      setModal(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDelError('')
    try {
      await sedesApi.remove(confirmDel.id)
      setConfirmDel(null)
      load()
    } catch (err) {
      setDelError(err.response?.data?.message ?? 'Error al eliminar.')
    }
  }

  return (
    <div style={{ padding: '1.5rem 2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111', marginBottom: '0.15rem' }}>Sedes</h1>
          <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Gestión de las ubicaciones del hotel</p>
        </div>
        <button onClick={() => setModal('create')}
          style={{ padding: '0.6rem 1.25rem', background: '#F5922E', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          + Nueva sede
        </button>
      </div>

      {/* Grid de tarjetas */}
      {loading ? (
        <p style={{ color: '#9CA3AF', textAlign: 'center', padding: '3rem' }}>Cargando sedes...</p>
      ) : sedes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9CA3AF' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏨</p>
          <p>No hay sedes registradas aún.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {sedes.map(s => (
            <SedeCard key={s.id} sede={s} onEdit={s => setModal(s)} onDelete={s => { setDelError(''); setConfirmDel(s) }}/>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <Modal title={modal === 'create' ? 'Nueva sede' : `Editar: ${modal.nombre}`} onClose={() => setModal(null)}>
          <SedeForm
            initial={modal === 'create' ? EMPTY : modal}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}

      {/* Confirm eliminar */}
      {confirmDel && (
        <Modal title="Eliminar sede" onClose={() => setConfirmDel(null)}>
          <p style={{ color: '#374151', marginBottom: '0.75rem' }}>
            ¿Eliminar la sede <strong>{confirmDel.nombre}</strong>?
          </p>
          {confirmDel.habitaciones_count > 0 && (
            <p style={{ color: '#D97706', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              ⚠️ Esta sede tiene {confirmDel.habitaciones_count} habitaciones registradas y no puede eliminarse.
            </p>
          )}
          {delError && <p style={{ color: '#DC2626', fontSize: '0.85rem', marginBottom: '0.75rem' }}>⚠️ {delError}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmDel(null)}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleDelete} disabled={confirmDel.habitaciones_count > 0}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontWeight: 600, cursor: 'pointer', opacity: confirmDel.habitaciones_count > 0 ? 0.5 : 1 }}>
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
