import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { User, Mail, Phone, CreditCard, Lock, Save, Eye, EyeOff } from 'lucide-react'
import axiosClient from '../../api/axiosClient'

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon size={12} style={{ color: '#9CA3AF' }}/> {label}
      </label>
      {children}
    </div>
  )
}

export default function MiPerfil() {
  const { user, refreshUser } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({
    name:     user?.name     ?? '',
    telefono: user?.telefono ?? '',
    dni:      user?.dni      ?? '',
  })
  const [pw, setPw] = useState({ current: '', password: '', password_confirmation: '' })
  const [showPw, setShowPw] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPw,   setSavingPw]   = useState(false)
  const [errInfo, setErrInfo] = useState({})
  const [errPw,   setErrPw]   = useState({})

  function set(f, v) { setForm(p => ({ ...p, [f]: v })) }

  async function handleInfo(e) {
    e.preventDefault()
    setSavingInfo(true); setErrInfo({})
    try {
      await axiosClient.put('/profile', form)
      await refreshUser()
      toast.success('Perfil actualizado correctamente.')
    } catch (err) {
      if (err.response?.status === 422) setErrInfo(err.response.data.errors ?? {})
      else toast.error('No se pudo actualizar el perfil.')
    } finally { setSavingInfo(false) }
  }

  async function handlePw(e) {
    e.preventDefault()
    setSavingPw(true); setErrPw({})
    try {
      await axiosClient.put('/profile/password', pw)
      setPw({ current: '', password: '', password_confirmation: '' })
      toast.success('Contraseña actualizada correctamente.')
    } catch (err) {
      if (err.response?.status === 422) setErrPw(err.response.data.errors ?? {})
      else toast.error(err.response?.data?.message ?? 'No se pudo cambiar la contraseña.')
    } finally { setSavingPw(false) }
  }

  const errMsg = (errs, f) => errs[f]?.[0]
    ? <p style={{ color: '#DC2626', fontSize: '0.72rem', marginTop: '0.2rem' }}>{errs[f][0]}</p>
    : null

  return (
    <div className="page-pad" style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginBottom: '0.15rem' }}>Mi Perfil</h1>
        <p style={{ fontSize: '0.85rem', color: '#6B7280' }}>Administra tu información personal</p>
      </div>

      {/* Avatar + email */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#F5922E,#E07820)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '1.4rem', fontWeight: 800 }}>{user?.name?.charAt(0)?.toUpperCase()}</span>
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{user?.name}</p>
          <p style={{ fontSize: '0.82rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Mail size={12}/> {user?.email}
          </p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ background: '#FFF7ED', color: '#F5922E', fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 9999 }}>
            Cliente
          </span>
        </div>
      </div>

      {/* Datos personales */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={16} style={{ color: '#F5922E' }}/> Datos personales
        </h2>
        <form onSubmit={handleInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Nombre completo" icon={User}>
            <input className="field-input" value={form.name} onChange={e => set('name', e.target.value)} required/>
            {errMsg(errInfo, 'name')}
          </Field>

          <Field label="Correo electrónico" icon={Mail}>
            <input className="field-input" value={user?.email} disabled style={{ background: '#F9FAFB', color: '#9CA3AF', cursor: 'not-allowed' }}/>
            <p style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '0.2rem' }}>El correo no se puede cambiar.</p>
          </Field>

          <div className="grid-responsive-2">
            <Field label="Teléfono" icon={Phone}>
              <input className="field-input" value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+51 999 000 000"/>
              {errMsg(errInfo, 'telefono')}
            </Field>
            <Field label="DNI / Documento" icon={CreditCard}>
              <input className="field-input" value={form.dni} onChange={e => set('dni', e.target.value)} placeholder="12345678" maxLength={20}/>
              {errMsg(errInfo, 'dni')}
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={savingInfo} className="btn-primary">
              <Save size={15}/> {savingInfo ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={16} style={{ color: '#F5922E' }}/> Cambiar contraseña
        </h2>
        <form onSubmit={handlePw} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field label="Contraseña actual" icon={Lock}>
            <div style={{ position: 'relative' }}>
              <input className="field-input" type={showPw ? 'text' : 'password'} value={pw.current}
                onChange={e => setPw(p => ({ ...p, current: e.target.value }))} required style={{ paddingRight: '2.5rem' }}/>
              <button type="button" onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 0 }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {errMsg(errPw, 'current')}
          </Field>

          <div className="grid-responsive-2">
            <Field label="Nueva contraseña" icon={Lock}>
              <input className="field-input" type="password" value={pw.password}
                onChange={e => setPw(p => ({ ...p, password: e.target.value }))} required minLength={8}/>
              {errMsg(errPw, 'password')}
            </Field>
            <Field label="Confirmar contraseña" icon={Lock}>
              <input className="field-input" type="password" value={pw.password_confirmation}
                onChange={e => setPw(p => ({ ...p, password_confirmation: e.target.value }))} required/>
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={savingPw} className="btn-primary">
              <Lock size={15}/> {savingPw ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
