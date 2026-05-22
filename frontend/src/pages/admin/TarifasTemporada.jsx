import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'
import { tarifasApi } from '../../api/tarifas'
import { sedesApi } from '../../api/sedes'
import { Plus, Edit2, Trash2, Tag, Calendar, Percent } from 'lucide-react'

function fmt(date) {
  if (!date) return '—'
  return new Date(date + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function FactorBadge({ factor }) {
  const pct = Math.round((factor - 1) * 100)
  const color = factor > 1 ? '#15803D' : factor < 1 ? '#B91C1C' : '#374151'
  const bg    = factor > 1 ? '#DCFCE7' : factor < 1 ? '#FEE2E2' : '#F3F4F6'
  return (
    <span style={{ background: bg, color, fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
      ×{Number(factor).toFixed(2)}
      {pct !== 0 && ` (${pct > 0 ? '+' : ''}${pct}%)`}
    </span>
  )
}

function TarifaModal({ tarifa, sedes, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    nombre:      tarifa?.nombre      ?? '',
    sede_id:     tarifa?.sede_id     ?? '',
    fecha_inicio:tarifa?.fecha_inicio ?? '',
    fecha_fin:   tarifa?.fecha_fin   ?? '',
    factor:      tarifa?.factor      ?? '1.00',
    descripcion: tarifa?.descripcion ?? '',
    activo:      tarifa?.activo      ?? true,
  })

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  const pct = form.factor ? Math.round((Number(form.factor) - 1) * 100) : 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{tarifa ? 'Editar tarifa' : 'Nueva tarifa de temporada'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>

        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="field-label">Nombre de la temporada *</label>
            <input className="field-input" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej: Semana Santa 2026" required />
          </div>

          <div className="grid-responsive-2">
            <div>
              <label className="field-label">Sede (opcional)</label>
              <select className="field-input" value={form.sede_id} onChange={e => set('sede_id', e.target.value)}>
                <option value="">Todas las sedes</option>
                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Estado</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <input type="checkbox" id="activo_t" checked={form.activo} onChange={e => set('activo', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                <label htmlFor="activo_t" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>Tarifa activa</label>
              </div>
            </div>
          </div>

          <div className="grid-responsive-2">
            <div>
              <label className="field-label">Fecha inicio *</label>
              <input className="field-input" type="date" value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Fecha fin *</label>
              <input className="field-input" type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="field-label">Factor de precio *</label>
            <input
              className="field-input"
              type="number" min="0.10" max="5.00" step="0.05"
              value={form.factor}
              onChange={e => set('factor', e.target.value)}
              required
            />
            {form.factor && (
              <p style={{ fontSize: '0.78rem', color: pct > 0 ? '#15803D' : pct < 0 ? '#DC2626' : '#9CA3AF', marginTop: 4 }}>
                {pct === 0 ? 'Sin cambio respecto al precio base' :
                 pct > 0  ? `+${pct}% sobre el precio base de la habitación` :
                            `${pct}% descuento sobre el precio base`}
              </p>
            )}
          </div>

          <div>
            <label className="field-label">Descripción</label>
            <textarea className="field-input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} style={{ minHeight: 60, resize: 'vertical' }} placeholder="Descripción opcional..." />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button
              onClick={() => onSave(form)}
              disabled={saving || !form.nombre || !form.fecha_inicio || !form.fecha_fin || !form.factor}
              className="btn-primary"
            >
              {saving ? 'Guardando...' : tarifa ? 'Guardar cambios' : 'Crear tarifa'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TarifasTemporada() {
  const toast = useToast()
  const { confirm, dialog } = useConfirm()
  const [tarifas, setTarifas] = useState([])
  const [sedes,   setSedes]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null)
  const [saving,  setSaving]  = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: t }, { data: s }] = await Promise.all([tarifasApi.getAll(), sedesApi.getAll()])
      setTarifas(t)
      setSedes(s)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    setSaving(true)
    try {
      if (modal === 'nuevo') {
        await tarifasApi.create(form)
        toast.success('Tarifa creada.')
      } else {
        await tarifasApi.update(modal.id, form)
        toast.success('Tarifa actualizada.')
      }
      setModal(null); load()
    } catch { toast.error('No se pudo guardar la tarifa.') }
    finally { setSaving(false) }
  }

  async function handleDelete(t) {
    const ok = await confirm({ title: 'Eliminar tarifa', message: `¿Eliminar la tarifa "${t.nombre}"?`, confirmLabel: 'Eliminar', danger: true })
    if (!ok) return
    try { await tarifasApi.destroy(t.id); toast.success('Tarifa eliminada.'); load() }
    catch { toast.error('No se pudo eliminar.') }
  }

  const today = new Date().toISOString().slice(0, 10)

  function estadoTarifa(t) {
    if (!t.activo) return { label: 'Inactiva', bg: '#F3F4F6', color: '#9CA3AF' }
    if (t.fecha_fin < today)    return { label: 'Vencida',  bg: '#FEE2E2', color: '#DC2626' }
    if (t.fecha_inicio > today) return { label: 'Próxima',  bg: '#DBEAFE', color: '#1D4ED8' }
    return { label: 'Vigente', bg: '#DCFCE7', color: '#15803D' }
  }

  const sedeNombre = id => sedes.find(s => s.id === id)?.nombre ?? 'Todas las sedes'

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Tarifas por temporada</h1>
          <p className="section-subtitle">Multiplicadores de precio por fechas especiales o temporada alta</p>
        </div>
        <button onClick={() => setModal('nuevo')} className="btn-primary">
          <Plus size={15} /> Nueva tarifa
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '3rem' }}>Cargando...</div>
      ) : tarifas.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</p>
          <p style={{ fontWeight: 600, color: '#374151' }}>No hay tarifas configuradas</p>
          <p style={{ color: '#9CA3AF', fontSize: '0.85rem', marginTop: 4 }}>Crea tarifas para temporada alta, feriados o eventos especiales</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr>
                  {['Nombre', 'Sede', 'Período', 'Factor', 'Estado', 'Descripción', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tarifas.map((t, i) => {
                  const est = estadoTarifa(t)
                  return (
                    <tr key={t.id} style={{ borderBottom: i < tarifas.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Tag size={13} style={{ color: '#F5922E', flexShrink: 0 }} />
                          {t.nombre}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#6B7280', fontSize: '0.82rem' }}>{sedeNombre(t.sede_id)}</td>
                      <td style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#374151', fontSize: '0.82rem' }}>
                          <Calendar size={12} style={{ color: '#9CA3AF' }} />
                          {fmt(t.fecha_inicio)} — {fmt(t.fecha_fin)}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <FactorBadge factor={t.factor} />
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: est.bg, color: est.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>{est.label}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: '#9CA3AF', fontSize: '0.82rem', maxWidth: 200 }}>
                        <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {t.descripcion || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setModal(t)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem' }}>
                            <Edit2 size={12} /> Editar
                          </button>
                          <button onClick={() => handleDelete(t)} className="btn-danger">
                            <Trash2 size={12} /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <TarifaModal
          tarifa={modal === 'nuevo' ? null : modal}
          sedes={sedes}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
      {dialog}
    </div>
  )
}
