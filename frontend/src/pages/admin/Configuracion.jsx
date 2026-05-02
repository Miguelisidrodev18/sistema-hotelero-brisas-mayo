import { useState, useEffect } from 'react'
import { configuracionApi } from '../../api/configuracion'
import { perfilApi } from '../../api/perfil'
import { useAuth } from '../../context/AuthContext'
import {
  Building2, UserCircle, Search, Save, Eye, EyeOff,
  Loader2, CheckCircle2, AlertCircle, KeyRound,
} from 'lucide-react'

const TABS = [
  { id: 'empresa', icon: Building2,   label: 'Empresa' },
  { id: 'perfil',  icon: UserCircle,  label: 'Mi Perfil' },
]

function Alert({ type, text }) {
  if (!text) return null
  const isOk = type === 'success'
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 14px', borderRadius: 8, marginBottom: 16,
      backgroundColor: isOk ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${isOk ? '#BBF7D0' : '#FECACA'}`,
      color: isOk ? '#15803D' : '#B91C1C',
      fontSize: 13,
    }}>
      {isOk ? <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
      {text}
    </div>
  )
}

function FieldGroup({ label, children, note }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {note && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{note}</p>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #D1D5DB', fontSize: 14, color: '#111827',
  backgroundColor: 'white', outline: 'none',
  boxSizing: 'border-box',
}

function Section({ title, children }) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: 14,
      border: '1px solid #E5E7EB', padding: '22px 24px',
      marginBottom: 18,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#3D1A06', marginBottom: 18, paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>
        {title}
      </h3>
      {children}
    </div>
  )
}

function SaveButton({ loading, onClick, label = 'Guardar cambios' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 22px', borderRadius: 10, border: 'none',
        backgroundColor: loading ? '#9CA3AF' : '#3D1A06',
        color: 'white', fontSize: 14, fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.15s',
      }}
    >
      {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
      {label}
    </button>
  )
}

/* ──────────────── TAB: EMPRESA ──────────────── */
function EmpresaTab() {
  const [configs, setConfigs]   = useState({})
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [msg,     setMsg]       = useState(null)
  const [rucBusy, setRucBusy]   = useState(false)

  useEffect(() => {
    configuracionApi.getAll()
      .then(({ data }) => setConfigs(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(key, val) {
    setConfigs(prev => ({ ...prev, [key]: val }))
  }

  async function buscarRuc() {
    const ruc = (configs.empresa_ruc || '').replace(/\D/g, '')
    if (ruc.length !== 11) {
      setMsg({ type: 'error', text: 'El RUC debe tener 11 dígitos.' })
      setTimeout(() => setMsg(null), 3500)
      return
    }
    setRucBusy(true)
    try {
      const { data } = await configuracionApi.buscarRuc(ruc)
      setConfigs(prev => ({
        ...prev,
        empresa_nombre:    data.razonSocial    || prev.empresa_nombre,
        empresa_direccion: data.direccion      || prev.empresa_direccion,
      }))
      setMsg({ type: 'success', text: 'Datos obtenidos de SUNAT correctamente.' })
    } catch {
      setMsg({ type: 'error', text: 'No se encontraron datos para ese RUC.' })
    } finally {
      setRucBusy(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      await configuracionApi.update(configs)
      setMsg({ type: 'success', text: 'Configuración guardada correctamente.' })
    } catch {
      setMsg({ type: 'error', text: 'Error al guardar la configuración.' })
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 4000)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48, color: '#9CA3AF' }}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  return (
    <>
      <Alert type={msg?.type} text={msg?.text} />

      <Section title="Datos del Negocio">
        {/* Logo preview + URL */}
        <FieldGroup label="Logo del hotel (URL)">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 10, flexShrink: 0,
              border: '2px dashed #E5E7EB', overflow: 'hidden',
              backgroundColor: '#F9FAFB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {configs.empresa_logo ? (
                <img src={configs.empresa_logo} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <Building2 size={24} style={{ color: '#D1D5DB' }} />
              )}
            </div>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={configs.empresa_logo || ''}
              onChange={e => set('empresa_logo', e.target.value)}
              placeholder="https://..."
            />
          </div>
        </FieldGroup>

        {/* RUC with SUNAT search */}
        <FieldGroup label="RUC" note="Ingresa el RUC y presiona Buscar para autocompletar desde SUNAT">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={configs.empresa_ruc || ''}
              onChange={e => set('empresa_ruc', e.target.value)}
              placeholder="20123456789"
              maxLength={11}
            />
            <button
              onClick={buscarRuc}
              disabled={rucBusy}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '9px 16px', borderRadius: 8, border: 'none',
                backgroundColor: rucBusy ? '#9CA3AF' : '#F5922E',
                color: 'white', fontSize: 13, fontWeight: 600,
                cursor: rucBusy ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {rucBusy
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <Search size={14} />}
              Buscar
            </button>
          </div>
        </FieldGroup>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <FieldGroup label="Razón Social">
            <input style={inputStyle} value={configs.empresa_nombre || ''} onChange={e => set('empresa_nombre', e.target.value)} placeholder="Hotel Brisas de Mayo" />
          </FieldGroup>
          <FieldGroup label="Teléfono">
            <input style={inputStyle} value={configs.empresa_telefono || ''} onChange={e => set('empresa_telefono', e.target.value)} placeholder="01 234 5678" />
          </FieldGroup>
          <FieldGroup label="Email">
            <input style={inputStyle} type="email" value={configs.empresa_email || ''} onChange={e => set('empresa_email', e.target.value)} placeholder="info@hotel.com" />
          </FieldGroup>
          <FieldGroup label="Dirección">
            <input style={inputStyle} value={configs.empresa_direccion || ''} onChange={e => set('empresa_direccion', e.target.value)} placeholder="Huancaya, Yauyos, Lima" />
          </FieldGroup>
        </div>
      </Section>

      <Section title="Configuración Operativa">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          <FieldGroup label="Hora Check-in">
            <input style={inputStyle} type="time" value={configs.check_in_hora || '14:00'} onChange={e => set('check_in_hora', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Hora Check-out">
            <input style={inputStyle} type="time" value={configs.check_out_hora || '12:00'} onChange={e => set('check_out_hora', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Moneda">
            <input style={inputStyle} value={configs.moneda_simbolo || 'S/'} onChange={e => set('moneda_simbolo', e.target.value)} />
          </FieldGroup>
          <FieldGroup label="Tipo de cambio (USD)">
            <input style={inputStyle} type="number" step="0.01" value={configs.tipo_cambio_dolar || ''} onChange={e => set('tipo_cambio_dolar', e.target.value)} placeholder="3.75" />
          </FieldGroup>
        </div>
      </Section>

      <SaveButton loading={saving} onClick={save} />
    </>
  )
}

function PwdInput({ value, onChange, placeholder, show, onToggle }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        style={{ ...inputStyle, paddingRight: 40 }}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={onToggle}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9CA3AF',
        }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

/* ──────────────── TAB: PERFIL ──────────────── */
function PerfilTab() {
  const { user, refreshUser } = useAuth()

  const [form,        setForm]        = useState({ name: '', email: '', dni: '', telefono: '' })
  const [savingInfo,  setSavingInfo]  = useState(false)
  const [infoMsg,     setInfoMsg]     = useState(null)

  const [pwd,         setPwd]         = useState({ password_actual: '', password: '', password_confirmation: '' })
  const [savingPwd,   setSavingPwd]   = useState(false)
  const [pwdMsg,      setPwdMsg]      = useState(null)
  const [showPwd,     setShowPwd]     = useState({ actual: false, nuevo: false, confirm: false })

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', dni: user.dni || '', telefono: user.telefono || '' })
  }, [user])

  function setF(key, val) { setForm(p => ({ ...p, [key]: val })) }
  function setP(key, val) { setPwd(p => ({ ...p, [key]: val })) }

  async function saveInfo(e) {
    e.preventDefault()
    setSavingInfo(true); setInfoMsg(null)
    try {
      await perfilApi.update(form)
      await refreshUser()
      setInfoMsg({ type: 'success', text: 'Perfil actualizado correctamente.' })
    } catch (err) {
      setInfoMsg({ type: 'error', text: err.response?.data?.message || 'Error al actualizar el perfil.' })
    } finally {
      setSavingInfo(false)
      setTimeout(() => setInfoMsg(null), 4000)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (pwd.password !== pwd.password_confirmation) {
      setPwdMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' })
      setTimeout(() => setPwdMsg(null), 3500)
      return
    }
    setSavingPwd(true); setPwdMsg(null)
    try {
      await perfilApi.changePassword(pwd)
      setPwdMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' })
      setPwd({ password_actual: '', password: '', password_confirmation: '' })
    } catch (err) {
      setPwdMsg({ type: 'error', text: err.response?.data?.message || 'Error al cambiar la contraseña.' })
    } finally {
      setSavingPwd(false)
      setTimeout(() => setPwdMsg(null), 4000)
    }
  }

  return (
    <>
      {/* Info section */}
      <Section title="Información Personal">
        <Alert type={infoMsg?.type} text={infoMsg?.text} />

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg,#F5922E,#D4A843)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'white', fontSize: 22, fontWeight: 700 }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{user?.name}</p>
            <p style={{ fontSize: 12, color: '#9CA3AF' }}>{user?.email}</p>
          </div>
        </div>

        <form onSubmit={saveInfo}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FieldGroup label="Nombre completo">
              <input style={inputStyle} value={form.name} onChange={e => setF('name', e.target.value)} required />
            </FieldGroup>
            <FieldGroup label="Email">
              <input style={inputStyle} type="email" value={form.email} onChange={e => setF('email', e.target.value)} required />
            </FieldGroup>
            <FieldGroup label="DNI">
              <input style={inputStyle} value={form.dni} onChange={e => setF('dni', e.target.value)} maxLength={8} placeholder="12345678" />
            </FieldGroup>
            <FieldGroup label="Teléfono">
              <input style={inputStyle} value={form.telefono} onChange={e => setF('telefono', e.target.value)} placeholder="987 654 321" />
            </FieldGroup>
          </div>
          <div style={{ marginTop: 4 }}>
            <SaveButton loading={savingInfo} label="Actualizar perfil" onClick={null} />
          </div>
        </form>
      </Section>

      {/* Password section */}
      <Section title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KeyRound size={15} /> Cambiar Contraseña
        </span>
      }>
        <Alert type={pwdMsg?.type} text={pwdMsg?.text} />
        <form onSubmit={savePassword}>
          <div style={{ maxWidth: 420 }}>
            <FieldGroup label="Contraseña actual">
              <PwdInput value={pwd.password_actual} onChange={v => setP('password_actual', v)} placeholder="••••••••" show={showPwd.actual} onToggle={() => setShowPwd(p => ({ ...p, actual: !p.actual }))} />
            </FieldGroup>
            <FieldGroup label="Nueva contraseña" note="Mínimo 8 caracteres">
              <PwdInput value={pwd.password} onChange={v => setP('password', v)} placeholder="••••••••" show={showPwd.nuevo} onToggle={() => setShowPwd(p => ({ ...p, nuevo: !p.nuevo }))} />
            </FieldGroup>
            <FieldGroup label="Confirmar nueva contraseña">
              <PwdInput value={pwd.password_confirmation} onChange={v => setP('password_confirmation', v)} placeholder="••••••••" show={showPwd.confirm} onToggle={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))} />
            </FieldGroup>
          </div>
          <SaveButton loading={savingPwd} label="Cambiar contraseña" onClick={null} />
        </form>
      </Section>
    </>
  )
}

/* ──────────────── Main page ──────────────── */
export default function Configuracion() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'administrador'
  const visibleTabs = isAdmin ? TABS : TABS.filter(t => t.id === 'perfil')
  const [tab, setTab] = useState(() => isAdmin ? 'empresa' : 'perfil')

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 22,
        backgroundColor: 'white', borderRadius: 12,
        border: '1px solid #E5E7EB', padding: 6,
        width: 'fit-content',
      }}>
        {visibleTabs.map(({ id, icon: Icon, label }) => {
          const active = tab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 20px', borderRadius: 8, border: 'none',
                backgroundColor: active ? '#3D1A06' : 'transparent',
                color: active ? 'white' : '#6B7280',
                fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </div>

      {tab === 'empresa' && <EmpresaTab />}
      {tab === 'perfil'  && <PerfilTab />}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
