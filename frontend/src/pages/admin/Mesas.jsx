import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'
import { mesasApi } from '../../api/mesas'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'

const ESTADO_LABEL = {
  libre:      { label: 'Libre',      bg: '#D1FAE5', color: '#065F46' },
  ocupada:    { label: 'Ocupada',    bg: '#FFEDD5', color: '#9A3412' },
  por_cobrar: { label: 'Por cobrar', bg: '#FEE2E2', color: '#991B1B' },
}

function MesaModal({ mesa, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    numero:    mesa?.numero    ?? '',
    capacidad: mesa?.capacidad ?? '',
  })

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{mesa ? 'Editar mesa' : 'Nueva mesa'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="field-label">Número de mesa *</label>
            <input className="field-input" type="number" min="1" value={form.numero} onChange={e => set('numero', e.target.value)} required placeholder="Ej: 5"/>
          </div>
          <div>
            <label className="field-label">Capacidad (personas)</label>
            <input className="field-input" type="number" min="1" value={form.capacidad} onChange={e => set('capacidad', e.target.value)} placeholder="Ej: 4"/>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={() => onSave(form)} disabled={saving || !form.numero} className="btn-primary">
              {saving ? 'Guardando...' : mesa ? 'Guardar cambios' : 'Crear mesa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Mesas() {
  const toast = useToast()
  const { confirm, dialog } = useConfirm()
  const [mesas, setMesas]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]   = useState(null) // null | 'nuevo' | mesa
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await mesasApi.index()
      setMesas(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    setSaving(true)
    try {
      const data = { numero: Number(form.numero), capacidad: form.capacidad ? Number(form.capacidad) : null }
      if (modal === 'nuevo') {
        await mesasApi.store(data)
        toast.success('Mesa creada correctamente.')
      } else {
        await mesasApi.update(modal.id, data)
        toast.success('Mesa actualizada.')
      }
      setModal(null); load()
    } catch (err) { toast.error(err.response?.data?.message ?? 'No se pudo guardar la mesa.') }
    finally { setSaving(false) }
  }

  async function handleDelete(m) {
    const ok = await confirm({ title: 'Eliminar mesa', message: `¿Eliminar la Mesa ${m.numero}?`, confirmLabel: 'Eliminar', danger: true })
    if (!ok) return
    try { await mesasApi.destroy(m.id); toast.success('Mesa eliminada.'); load() }
    catch (err) { toast.error(err.response?.data?.message ?? 'No se pudo eliminar.') }
  }

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Mesas del restaurante</h1>
          <p className="section-subtitle">Administra las mesas del salón que usa el mozo para tomar pedidos</p>
        </div>
        <button onClick={() => setModal('nuevo')} className="btn-primary">
          <Plus size={15}/> Nueva mesa
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem' }}>Cargando...</div>
      ) : mesas.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }}/>
          <p style={{ fontWeight: 600, color: '#374151' }}>No hay mesas aún</p>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: 4 }}>Crea la primera mesa del salón</p>
        </div>
      ) : (
        <div className="card table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr>
                {['Mesa', 'Capacidad', 'Estado', 'Acciones'].map(h => (
                  <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mesas.map((m, i) => {
                const est = ESTADO_LABEL[m.estado] ?? ESTADO_LABEL.libre
                return (
                  <tr key={m.id} style={{ borderBottom: i < mesas.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Mesa {m.numero}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#9CA3AF' }}>{m.capacidad ? `${m.capacidad} personas` : '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: est.bg, color: est.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
                        {est.label}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setModal(m)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
                          <Edit2 size={12}/> Editar
                        </button>
                        <button onClick={() => handleDelete(m)} className="btn-danger">
                          <Trash2 size={12}/> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <MesaModal
          mesa={modal === 'nuevo' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
      {dialog}
    </div>
  )
}
