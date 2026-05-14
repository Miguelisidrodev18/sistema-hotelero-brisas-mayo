import { useState, useEffect, useCallback } from 'react'
import { usuariosApi } from '../../api/usuarios'

const ROLES = ['cliente', 'recepcionista', 'administrador', 'contador', 'gerente']
const ROLE_COLORS = {
  administrador: { bg: '#FEF3C7', color: '#92400E' },
  recepcionista: { bg: '#DBEAFE', color: '#1E40AF' },
  contador:      { bg: '#D1FAE5', color: '#065F46' },
  gerente:       { bg: '#EDE9FE', color: '#5B21B6' },
  cliente:       { bg: '#F3F4F6', color: '#374151' },
}

const EMPTY = { name: '', email: '', dni: '', telefono: '', role: 'cliente', password: '', activo: true }

function Badge({ role }) {
  const s = ROLE_COLORS[role] ?? ROLE_COLORS.cliente
  return (
    <span style={{ ...s, padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>
      {role}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  )
}

function UsuarioForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState({})
  const isEdit = !!initial.id

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

  const inp = {
    width: '100%', boxSizing: 'border-box', border: '1.5px solid #E5E7EB',
    borderRadius: 8, padding: '0.6rem 0.8rem', fontSize: '0.875rem', outline: 'none',
  }
  const lbl = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#374151', marginBottom: '0.3rem' }
  const err = (f) => errors[f]?.[0] ? <p style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errors[f][0]}</p> : null

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={lbl}>Nombre completo *</label>
        <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Juan Pérez"/>
        {err('name')}
      </div>
      <div>
        <label style={lbl}>Correo electrónico *</label>
        <input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="correo@ejemplo.com"/>
        {err('email')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={lbl}>DNI</label>
          <input style={inp} value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="12345678"/>
          {err('dni')}
        </div>
        <div>
          <label style={lbl}>Teléfono</label>
          <input style={inp} value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="999888777"/>
        </div>
      </div>
      <div>
        <label style={lbl}>Rol *</label>
        <select style={inp} value={form.role} onChange={e => set('role', e.target.value)}>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label style={lbl}>{isEdit ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}</label>
        <input style={inp} type="password" value={form.password} onChange={e => set('password', e.target.value)}
          required={!isEdit} placeholder={isEdit ? 'Sin cambios' : 'Mínimo 8 caracteres'}/>
        {err('password')}
      </div>
      {isEdit && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.activo} onChange={e => set('activo', e.target.checked)}/>
          Usuario activo
        </label>
      )}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}
          style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '0.875rem' }}>
          Cancelar
        </button>
        <button type="submit" disabled={loading}
          style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none', background: '#F5922E', color: 'white', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear usuario'}
        </button>
      </div>
    </form>
  )
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [modal, setModal]       = useState(null) // null | 'create' | usuario
  const [confirmDel, setConfirmDel] = useState(null)
  const [filters, setFilters]   = useState({ search: '', role: '', page: 1 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.search) params.search = filters.search
      if (filters.role)   params.role   = filters.role
      params.page = filters.page
      const { data } = await usuariosApi.getAll(params)
      setUsuarios(data.data)
      setMeta(data)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    setSaving(true)
    try {
      if (modal === 'create') {
        await usuariosApi.create(form)
      } else {
        await usuariosApi.update(modal.id, form)
      }
      setModal(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(u) {
    await usuariosApi.toggleActivo(u.id)
    load()
  }

  async function handleDelete() {
    await usuariosApi.remove(confirmDel.id)
    setConfirmDel(null)
    load()
  }

  const cell = { padding: '0.9rem 1rem', fontSize: '0.875rem', color: '#374151', borderBottom: '1px solid #F3F4F6' }
  const head = { padding: '0.75rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }

  return (
    <div style={{ padding: '1.5rem 2rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111', marginBottom: '0.15rem' }}>Usuarios</h1>
          <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Gestión de cuentas y roles</p>
        </div>
        <button onClick={() => setModal('create')}
          style={{ padding: '0.6rem 1.25rem', background: '#F5922E', color: 'white', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
          + Nuevo usuario
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Buscar nombre, email o DNI..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          style={{ flex: 1, minWidth: 200, border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none' }}
        />
        <select value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value, page: 1 }))}
          style={{ border: '1.5px solid #E5E7EB', borderRadius: 8, padding: '0.55rem 0.85rem', fontSize: '0.875rem', outline: 'none' }}>
          <option value="">Todos los roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={head}>Nombre</th>
              <th style={head}>Email</th>
              <th style={head}>DNI</th>
              <th style={head}>Rol</th>
              <th style={head}>Estado</th>
              <th style={{ ...head, textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ ...cell, textAlign: 'center', color: '#9CA3AF' }}>Cargando...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={6} style={{ ...cell, textAlign: 'center', color: '#9CA3AF' }}>No hay usuarios</td></tr>
            ) : usuarios.map(u => (
              <tr key={u.id} style={{ transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <td style={cell}>
                  <div style={{ fontWeight: 600, color: '#111' }}>{u.name}</div>
                  {u.telefono && <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{u.telefono}</div>}
                </td>
                <td style={cell}>{u.email}</td>
                <td style={cell}>{u.dni ?? '—'}</td>
                <td style={cell}><Badge role={u.role}/></td>
                <td style={cell}>
                  <span style={{
                    padding: '2px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600,
                    background: u.activo ? '#D1FAE5' : '#FEE2E2',
                    color:      u.activo ? '#065F46' : '#991B1B',
                  }}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ ...cell, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button onClick={() => setModal(u)} title="Editar"
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>
                      ✏️
                    </button>
                    <button onClick={() => handleToggle(u)} title={u.activo ? 'Desactivar' : 'Activar'}
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>
                      {u.activo ? '🔒' : '🔓'}
                    </button>
                    <button onClick={() => setConfirmDel(u)} title="Eliminar"
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #FEE2E2', background: '#FEF2F2', cursor: 'pointer', fontSize: '0.8rem' }}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {meta && meta.last_page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setFilters(f => ({ ...f, page: p }))}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E5E7EB', cursor: 'pointer', fontWeight: filters.page === p ? 700 : 400, background: filters.page === p ? '#F5922E' : 'white', color: filters.page === p ? 'white' : '#374151' }}>
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <Modal
          title={modal === 'create' ? 'Nuevo usuario' : `Editar: ${modal.name}`}
          onClose={() => setModal(null)}
        >
          <UsuarioForm
            initial={modal === 'create' ? EMPTY : { ...modal, password: '' }}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            loading={saving}
          />
        </Modal>
      )}

      {/* Confirm eliminar */}
      {confirmDel && (
        <Modal title="Eliminar usuario" onClose={() => setConfirmDel(null)}>
          <p style={{ color: '#374151', marginBottom: '1.5rem' }}>
            ¿Eliminar a <strong>{confirmDel.name}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button onClick={() => setConfirmDel(null)}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleDelete}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 8, border: 'none', background: '#DC2626', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
              Eliminar
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
