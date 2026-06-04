import { useState, useEffect, useRef } from 'react'
import { habitacionesApi } from '../../api/habitaciones'
import { sedesApi } from '../../api/sedes'
import { useAuth } from '../../context/AuthContext'
import { BedDouble, Users, Loader2, ChevronDown, Filter, Image, X, Plus, Trash2 } from 'lucide-react'

const ESTADOS = [
  { value: '',              label: 'Todos los estados' },
  { value: 'disponible',   label: 'Disponible' },
  { value: 'ocupada',      label: 'Ocupada' },
  { value: 'reservada',    label: 'Reservada' },
  { value: 'limpieza',     label: 'Limpieza' },
  { value: 'mantenimiento',label: 'Mantenimiento' },
]

const STATUS_STYLE = {
  disponible:    { label: 'Disponible',    bg: '#DCFCE7', color: '#15803D', dot: '#16A34A' },
  ocupada:       { label: 'Ocupada',       bg: '#FEE2E2', color: '#B91C1C', dot: '#DC2626' },
  reservada:     { label: 'Reservada',     bg: '#DBEAFE', color: '#1D4ED8', dot: '#2563EB' },
  limpieza:      { label: 'Limpieza',      bg: '#FEF3C7', color: '#B45309', dot: '#D97706' },
  mantenimiento: { label: 'Mantenimiento', bg: '#F3F4F6', color: '#4B5563', dot: '#6B7280' },
}

const TIPO_LABEL = {
  matrimonial:          'Matrimonial',
  matrimonial_king:     'King',
  matrimonial_queen:    'Queen',
  matrimonial_adicional:'Mat. Adicional',
  doble:                'Doble',
  triple:               'Triple',
}

const CAN_CHANGE_STATUS = ['administrador', 'recepcionista']

function StatusDropdown({ habitacion, onUpdate }) {
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)
  const s = STATUS_STYLE[habitacion.estado] || STATUS_STYLE.disponible

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  async function cambiar(nuevoEstado) {
    if (nuevoEstado === habitacion.estado) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    try {
      const { data } = await habitacionesApi.update(habitacion.id, { estado: nuevoEstado })
      onUpdate(data)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '4px 8px 4px 6px', borderRadius: 6, border: 'none',
          backgroundColor: s.bg, cursor: 'pointer',
          fontSize: 11, fontWeight: 600, color: s.color,
          whiteSpace: 'nowrap',
        }}
      >
        {loading ? (
          <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: s.dot, flexShrink: 0 }} />
        )}
        {s.label}
        <ChevronDown size={10} style={{ opacity: 0.7, marginLeft: 1 }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, zIndex: 50,
          backgroundColor: 'white', borderRadius: 10,
          border: '1px solid #E5E7EB',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          minWidth: 160, overflow: 'hidden',
        }}>
          {ESTADOS.slice(1).map(({ value, label }) => {
            const ss = STATUS_STYLE[value]
            return (
              <button
                key={value}
                onClick={() => cambiar(value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '9px 12px', border: 'none',
                  backgroundColor: value === habitacion.estado ? '#F9FAFB' : 'white',
                  cursor: 'pointer', fontSize: 12,
                  fontWeight: value === habitacion.estado ? 700 : 400,
                  color: ss.color,
                  borderLeft: value === habitacion.estado ? `3px solid ${ss.dot}` : '3px solid transparent',
                  textAlign: 'left',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: ss.dot, flexShrink: 0 }} />
                {label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ModalImagenes({ hab, onClose, onUpdated }) {
  const [imagenes, setImagenes] = useState(hab.imagenes ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const fileRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('image', file)
      const { data } = await habitacionesApi.subirImagen(hab.id, fd)
      const nuevas = [...imagenes, data]
      setImagenes(nuevas)
      onUpdated(hab.id, nuevas)
    } catch {
      setError('No se pudo subir la imagen.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleEliminar(img) {
    try {
      await habitacionesApi.eliminarImagen(hab.id, img.id)
      const nuevas = imagenes.filter(i => i.id !== img.id)
      setImagenes(nuevas)
      onUpdated(hab.id, nuevas)
    } catch {
      setError('No se pudo eliminar la imagen.')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '85vh', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid #F3F4F6' }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: '#111827', margin: 0 }}>Fotos — Hab. N° {hab.numero}</p>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '2px 0 0' }}>{imagenes.length} foto{imagenes.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={15} style={{ color: '#6B7280' }}/>
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ overflowY: 'auto', padding: '1.25rem', flex: 1 }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.82rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          {imagenes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9CA3AF' }}>
              <Image size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }}/>
              <p style={{ fontSize: '0.85rem' }}>Sin fotos todavía</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {imagenes.map(img => (
                <div key={img.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#F3F4F6' }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  <button
                    onClick={() => handleEliminar(img)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(220,38,38,0.9)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Trash2 size={11} style={{ color: 'white' }}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          <input type="file" accept="image/*" ref={fileRef} onChange={handleFile} style={{ display: 'none' }}/>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '0.75rem', borderRadius: 12, border: '2px dashed #D1D5DB', background: 'white', color: '#374151', fontWeight: 600, fontSize: '0.88rem', cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.7 : 1 }}>
            {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }}/> : <Plus size={15}/>}
            {uploading ? 'Subiendo...' : 'Subir foto'}
          </button>
        </div>
      </div>
    </div>
  )
}

function HabitacionCard({ hab, canChange, onUpdate, onOpenImagenes }) {
  const s = STATUS_STYLE[hab.estado] || STATUS_STYLE.disponible

  return (
    <div style={{
      backgroundColor: 'white', borderRadius: 12,
      border: `1px solid ${hab.estado === 'disponible' ? '#E5E7EB' : s.bg}`,
      padding: '14px 14px 12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'box-shadow 0.15s',
    }}>
      {/* Room number + floor */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1 }}>
          {hab.numero}
        </p>
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#6B7280',
          backgroundColor: '#F3F4F6', borderRadius: 4,
          padding: '2px 6px',
        }}>
          Piso {hab.piso}
        </span>
      </div>

      {/* Tipo */}
      <p style={{ fontSize: 12, color: '#6B7280', marginTop: -4 }}>
        {TIPO_LABEL[hab.tipo] || hab.tipo}
      </p>

      {/* Capacity + price */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9CA3AF' }}>
          <Users size={12} />
          <span style={{ fontSize: 11 }}>{hab.capacidad}</span>
        </div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#3D1A06' }}>
          S/ {Number(hab.precio).toLocaleString()}
        </p>
      </div>

      {/* Status */}
      {canChange ? (
        <StatusDropdown habitacion={hab} onUpdate={onUpdate} />
      ) : (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 8px 4px 6px', borderRadius: 6,
          backgroundColor: s.bg, fontSize: 11, fontWeight: 600, color: s.color,
          alignSelf: 'flex-start',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: s.dot }} />
          {s.label}
        </div>
      )}

      {/* Botón fotos */}
      {canChange && (
        <button
          onClick={() => onOpenImagenes(hab)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6, border: '1px solid #E5E7EB', background: 'white', color: '#6B7280', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 2 }}>
          <Image size={11}/>
          {hab.imagenes?.length > 0 ? `${hab.imagenes.length} foto${hab.imagenes.length > 1 ? 's' : ''}` : 'Sin fotos'}
        </button>
      )}
    </div>
  )
}

export default function Habitaciones() {
  const { user }           = useAuth()
  const [sedes,      setSedes]      = useState([])
  const [habs,       setHabs]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [sedeId,     setSedeId]     = useState('')
  const [pisoFiltro, setPisoFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')

  const [modalImagenes, setModalImagenes] = useState(null)
  const canChange = CAN_CHANGE_STATUS.includes(user?.role)

  useEffect(() => {
    sedesApi.getAll()
      .then(({ data }) => setSedes(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (sedeId)      params.sede_id = sedeId
    if (estadoFiltro) params.estado = estadoFiltro
    habitacionesApi.getAll(params)
      .then(({ data }) => setHabs(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sedeId, estadoFiltro])

  function handleUpdate(updated) {
    setHabs(prev => prev.map(h => (h.id === updated.id ? { ...h, estado: updated.estado } : h)))
  }

  function handleImagenesUpdated(habId, nuevasImagenes) {
    setHabs(prev => prev.map(h => h.id === habId ? { ...h, imagenes: nuevasImagenes } : h))
    if (modalImagenes?.id === habId) {
      setModalImagenes(hab => ({ ...hab, imagenes: nuevasImagenes }))
    }
  }

  // Derive floors from current results
  const pisos = [...new Set(habs.map(h => h.piso))].sort((a, b) => a - b)

  const filtered = pisoFiltro ? habs.filter(h => h.piso === Number(pisoFiltro)) : habs

  // Group by sede_nombre
  const grouped = filtered.reduce((acc, h) => {
    const key = h.sede_nombre
    if (!acc[key]) acc[key] = []
    acc[key].push(h)
    return acc
  }, {})

  const counts = habs.reduce((acc, h) => { acc[h.estado] = (acc[h.estado] || 0) + 1; return acc }, {})

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>Habitaciones</h2>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
          {habs.length} habitaciones en total
        </p>
      </div>

      {/* Status summary chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {Object.entries(STATUS_STYLE).map(([key, s]) => (
          <button
            key={key}
            onClick={() => setEstadoFiltro(estadoFiltro === key ? '' : key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20,
              border: estadoFiltro === key ? `2px solid ${s.dot}` : '2px solid transparent',
              backgroundColor: s.bg, color: s.color,
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.dot }} />
            {s.label} ({counts[key] || 0})
          </button>
        ))}
        {estadoFiltro && (
          <button
            onClick={() => setEstadoFiltro('')}
            style={{
              padding: '5px 12px', borderRadius: 20,
              border: '1px dashed #D1D5DB', backgroundColor: 'white',
              fontSize: 12, color: '#9CA3AF', cursor: 'pointer',
            }}
          >
            × Limpiar filtro
          </button>
        )}
      </div>

      {/* Filters row */}
      <div style={{
        display: 'flex', gap: 10, flexWrap: 'wrap',
        backgroundColor: 'white', borderRadius: 12,
        border: '1px solid #E5E7EB', padding: '12px 16px',
        marginBottom: 20, alignItems: 'center',
      }}>
        <Filter size={15} style={{ color: '#9CA3AF' }} />

        {/* Sede tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setSedeId(''); setPisoFiltro('') }}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              border: 'none',
              backgroundColor: !sedeId ? '#3D1A06' : '#F3F4F6',
              color: !sedeId ? 'white' : '#374151',
              fontWeight: !sedeId ? 700 : 400,
            }}
          >
            Todas
          </button>
          {sedes.map(s => (
            <button
              key={s.id}
              onClick={() => { setSedeId(sedeId === s.id ? '' : s.id); setPisoFiltro('') }}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                border: 'none',
                backgroundColor: sedeId === s.id ? '#3D1A06' : '#F3F4F6',
                color: sedeId === s.id ? 'white' : '#374151',
                fontWeight: sedeId === s.id ? 700 : 400,
              }}
            >
              {s.nombre}
            </button>
          ))}
        </div>

        {/* Divider */}
        {pisos.length > 1 && <div style={{ width: 1, height: 24, backgroundColor: '#E5E7EB' }} />}

        {/* Floor tabs */}
        {pisos.length > 1 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setPisoFiltro('')}
              style={{
                padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                border: '1px solid',
                borderColor: !pisoFiltro ? '#F5922E' : '#E5E7EB',
                backgroundColor: !pisoFiltro ? '#FDF6ED' : 'white',
                color: !pisoFiltro ? '#C96010' : '#6B7280',
                fontWeight: !pisoFiltro ? 600 : 400,
              }}
            >
              Todos los pisos
            </button>
            {pisos.map(p => (
              <button
                key={p}
                onClick={() => setPisoFiltro(pisoFiltro === p ? '' : p)}
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  border: '1px solid',
                  borderColor: pisoFiltro === p ? '#F5922E' : '#E5E7EB',
                  backgroundColor: pisoFiltro === p ? '#FDF6ED' : 'white',
                  color: pisoFiltro === p ? '#C96010' : '#6B7280',
                  fontWeight: pisoFiltro === p ? 600 : 400,
                }}
              >
                Piso {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* Grouped grid */}
      {!loading && Object.entries(grouped).map(([sedeNombre, rooms]) => (
        <div key={sedeNombre} style={{ marginBottom: 28 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 6,
              background: 'linear-gradient(135deg,#F5922E,#D4A843)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BedDouble size={14} color="white" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{sedeNombre}</h3>
            <span style={{
              fontSize: 11, color: '#9CA3AF', backgroundColor: '#F3F4F6',
              borderRadius: 10, padding: '2px 8px',
            }}>
              {rooms.length} hab.
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 10,
          }}>
            {rooms.map(hab => (
              <HabitacionCard
                key={hab.id}
                hab={hab}
                canChange={canChange}
                onUpdate={handleUpdate}
                onOpenImagenes={setModalImagenes}
              />
            ))}
          </div>
        </div>
      ))}

      {!loading && filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: '#9CA3AF',
        }}>
          <BedDouble size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>No hay habitaciones con los filtros aplicados.</p>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {modalImagenes && (
        <ModalImagenes
          hab={modalImagenes}
          onClose={() => setModalImagenes(null)}
          onUpdated={handleImagenesUpdated}
        />
      )}
    </div>
  )
}
