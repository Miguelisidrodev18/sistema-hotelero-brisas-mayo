import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../hooks/useConfirm'
import { codigosDescuentoApi } from '../../api/codigosDescuento'
import { BadgePercent, Plus, Trash2, Eye, RefreshCw, X } from 'lucide-react'

function fmt(date) {
  if (!date) return 'Sin vencimiento'
  return new Date(date + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtFecha(fecha) {
  if (!fecha) return '—'
  return new Date((fecha + '').slice(0, 10) + 'T12:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function EstadoBadge({ estado }) {
  const cfg = {
    activo:   { bg: '#DCFCE7', color: '#15803D', label: 'Activo'   },
    inactivo: { bg: '#F3F4F6', color: '#6B7280', label: 'Inactivo' },
    vencido:  { bg: '#FEE2E2', color: '#DC2626', label: 'Vencido'  },
  }[estado] ?? { bg: '#F3F4F6', color: '#6B7280', label: estado }
  return (
    <span style={{ background: cfg.bg, color: cfg.color, fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 9999 }}>
      {cfg.label}
    </span>
  )
}

function generarCodigo() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${part()}-${part()}`
}

function NuevoCodigoModal({ onSave, onClose, saving }) {
  const [form, setForm] = useState({ codigo: '', descripcion: '', fecha_vencimiento: '' })
  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Nuevo código de autorización</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="field-label">Código de autorización *</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                className="field-input"
                style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, fontFamily: 'monospace' }}
                value={form.codigo}
                onChange={e => set('codigo', e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''))}
                placeholder="Ej: AUTH-XK92"
                maxLength={20}
              />
              <button
                type="button"
                onClick={() => set('codigo', generarCodigo())}
                style={{ padding: '0.55rem 0.9rem', borderRadius: 8, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#374151', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Generar
              </button>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#9CA3AF' }}>Solo mayúsculas, números y guiones (ej: VERANO-2026)</p>
          </div>
          <div>
            <label className="field-label">Descripción (opcional)</label>
            <input className="field-input" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Ej: Para clientes VIP, Promoción julio..." maxLength={255} />
          </div>
          <div>
            <label className="field-label">Fecha de vencimiento (opcional)</label>
            <input className="field-input" type="date" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)} />
            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#9CA3AF' }}>Si no se define, el código no vence hasta desactivarlo manualmente.</p>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid #F3F4F6' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.codigo.trim()}
            style={{ padding: '0.6rem 1.4rem', borderRadius: 8, border: 'none', background: saving || !form.codigo.trim() ? '#D1D5DB' : '#3D1A06', color: 'white', fontWeight: 700, cursor: saving || !form.codigo.trim() ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Guardando...' : 'Crear código'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReservasModal({ codigo, onClose }) {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    codigosDescuentoApi.getReservas(codigo.id)
      .then(r => setReservas(r.data))
      .catch(() => setReservas([]))
      .finally(() => setLoading(false))
  }, [codigo.id])

  const cell = { padding: '0.75rem 1rem', borderBottom: '1px solid #F3F4F6', fontSize: '0.82rem', color: '#374151' }
  const head = { ...cell, fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: '#9CA3AF', background: '#F9FAFB' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>Reservas con código <span style={{ fontFamily: 'monospace', color: '#3D1A06' }}>{codigo.codigo}</span></h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#9CA3AF' }}>{codigo.reservas_count} uso{codigo.reservas_count !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>Cargando...</p>
          ) : reservas.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>Ninguna reserva ha usado este código aún.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Código reserva', 'Cliente', 'Habitación', 'Descuento', 'Registrado por', 'Fecha'].map(h => (
                    <th key={h} style={head}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservas.map(r => (
                  <tr key={r.id}>
                    <td style={cell}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#3D1A06' }}>{r.codigo}</span></td>
                    <td style={cell}><div style={{ fontWeight: 600 }}>{r.cliente?.name ?? '—'}</div><div style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{r.cliente?.email}</div></td>
                    <td style={cell}>Hab. {r.habitacion?.numero} — {r.habitacion?.tipo?.replace(/_/g, ' ')}</td>
                    <td style={cell}>
                      {r.descuento_porcentaje
                        ? <span style={{ background: '#FEF9C3', color: '#854D0E', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, fontSize: '0.78rem' }}>-{r.descuento_porcentaje}%</span>
                        : '—'}
                    </td>
                    <td style={cell}>{r.created_por?.name ?? '—'}</td>
                    <td style={cell}>{fmtFecha(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CodigosDescuento() {
  const [codigos, setCodigos]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal,   setModal]     = useState(false)
  const [detalle, setDetalle]   = useState(null)
  const [saving,  setSaving]    = useState(false)
  const { showToast }           = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const cargar = useCallback(() => {
    setLoading(true)
    codigosDescuentoApi.getAll()
      .then(r => setCodigos(r.data))
      .catch(() => showToast('Error al cargar códigos.', 'error'))
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => { cargar() }, [cargar])

  async function handleCrear(form) {
    setSaving(true)
    try {
      const payload = {
        codigo:            form.codigo.trim().toUpperCase(),
        descripcion:       form.descripcion || undefined,
        fecha_vencimiento: form.fecha_vencimiento || undefined,
      }
      await codigosDescuentoApi.create(payload)
      showToast('Código creado correctamente.', 'success')
      setModal(false)
      cargar()
    } catch (e) {
      const msg = e.response?.data?.errors?.codigo?.[0]
              ?? e.response?.data?.message
              ?? 'Error al crear el código.'
      showToast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(codigo) {
    try {
      const { data } = await codigosDescuentoApi.toggle(codigo.id)
      setCodigos(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c))
      showToast(`Código ${data.activo ? 'activado' : 'desactivado'}.`, 'success')
    } catch {
      showToast('Error al cambiar el estado.', 'error')
    }
  }

  async function handleEliminar(codigo) {
    const ok = await confirm(`¿Eliminar el código "${codigo.codigo}"? Esta acción no se puede deshacer.`)
    if (!ok) return
    try {
      await codigosDescuentoApi.destroy(codigo.id)
      setCodigos(prev => prev.filter(c => c.id !== codigo.id))
      showToast('Código eliminado.', 'success')
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Error al eliminar.', 'error')
    }
  }

  const th = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }
  const td = { padding: '0.85rem 1rem', borderBottom: '1px solid #F9FAFB', fontSize: '0.83rem', color: '#374151', verticalAlign: 'middle' }

  return (
    <div style={{ padding: '1.5rem 2rem', fontFamily: 'system-ui, sans-serif' }}>
      {ConfirmDialog}
      {modal    && <NuevoCodigoModal onSave={handleCrear} onClose={() => setModal(false)} saving={saving} />}
      {detalle  && <ReservasModal codigo={detalle} onClose={() => setDetalle(null)} />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#111827' }}>Códigos de Descuento</h1>
          <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: '0.85rem' }}>Gestiona los códigos de autorización para aplicar descuentos en reservas</p>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0.65rem 1.25rem', borderRadius: 10, border: 'none', background: '#3D1A06', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
          <Plus size={15} /> Nuevo código
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total códigos',  value: codigos.length },
          { label: 'Activos',        value: codigos.filter(c => c.estado === 'activo').length,   color: '#15803D' },
          { label: 'Inactivos',      value: codigos.filter(c => c.estado === 'inactivo').length, color: '#6B7280' },
          { label: 'Vencidos',       value: codigos.filter(c => c.estado === 'vencido').length,  color: '#DC2626' },
          { label: 'Usos totales',   value: codigos.reduce((s, c) => s + (c.reservas_count ?? 0), 0) },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'white', borderRadius: 12, padding: '1rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: color ?? '#111827' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF' }}>Cargando códigos...</div>
        ) : codigos.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <BadgePercent size={40} style={{ color: '#E5E7EB', margin: '0 auto 1rem', display: 'block' }} />
            <p style={{ color: '#9CA3AF', margin: 0 }}>No hay códigos de descuento. Crea el primero.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Código', 'Descripción', 'Vencimiento', 'Estado', 'Usos', 'Creado por', 'Acciones'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codigos.map(c => (
                  <tr key={c.id} onMouseEnter={e => e.currentTarget.style.background = '#FAFAFA'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={td}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.95rem', color: '#3D1A06', letterSpacing: '0.04em' }}>{c.codigo}</span>
                    </td>
                    <td style={td}><span style={{ color: c.descripcion ? '#374151' : '#D1D5DB' }}>{c.descripcion || 'Sin descripción'}</span></td>
                    <td style={td}>{fmt(c.fecha_vencimiento)}</td>
                    <td style={td}><EstadoBadge estado={c.estado} /></td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {c.reservas_count > 0 ? (
                        <button onClick={() => setDetalle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}>
                          <Eye size={13} /> {c.reservas_count}
                        </button>
                      ) : (
                        <span style={{ color: '#D1D5DB' }}>0</span>
                      )}
                    </td>
                    <td style={td}>{c.creado_por?.name ?? '—'}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          onClick={() => handleToggle(c)}
                          title={c.activo ? 'Desactivar' : 'Activar'}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', borderColor: c.activo ? '#BBF7D0' : '#E5E7EB', background: c.activo ? '#F0FDF4' : '#F9FAFB', color: c.activo ? '#15803D' : '#6B7280', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}>
                          {c.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleEliminar(c)}
                          disabled={c.reservas_count > 0}
                          title={c.reservas_count > 0 ? 'No se puede eliminar: tiene reservas asociadas' : 'Eliminar'}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #FEE2E2', background: c.reservas_count > 0 ? '#F9FAFB' : '#FFF1F2', color: c.reservas_count > 0 ? '#D1D5DB' : '#DC2626', cursor: c.reservas_count > 0 ? 'not-allowed' : 'pointer' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nota informativa */}
      <div style={{ marginTop: '1rem', padding: '0.9rem 1.1rem', background: '#FEF9C3', borderRadius: 10, border: '1px solid #FDE68A', fontSize: '0.8rem', color: '#92400E' }}>
        <strong>¿Cómo funciona?</strong> El recepcionista debe ingresar un código activo al crear una reserva presencial con descuento. Si el código está vencido o desactivado, el sistema rechaza el descuento. Los códigos con reservas asociadas no pueden eliminarse.
      </div>
    </div>
  )
}
