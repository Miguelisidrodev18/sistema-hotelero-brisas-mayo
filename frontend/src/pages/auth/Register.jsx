import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const BRAND = {
  dark:   '#1E0D03',
  brown:  '#3D1A06',
  wood:   '#7B4019',
  orange: '#F5922E',
  amber:  '#E07820',
  gold:   '#D4A843',
  cream:  '#FDF6ED',
}

function WaveLogo({ size = 44 }) {
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 44 29" fill="none">
      <path d="M3 8  Q11 1  19 8  Q27 15 35 8  Q39 5  43 8"  stroke={BRAND.gold}   strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      <path d="M3 15 Q11 8  19 15 Q27 22 35 15 Q39 12 43 15" stroke={BRAND.orange} strokeWidth="2"   strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M3 22 Q11 15 19 22 Q27 29 35 22 Q39 19 43 22" stroke={BRAND.gold}   strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  )
}

function BottomWave() {
  return (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ height: 50, width: '100%', opacity: 0.14 }}>
      <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill={BRAND.gold}/>
    </svg>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${BRAND.gold})` }}/>
      <WaveLogo size={20}/>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${BRAND.gold})` }}/>
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', password: '', password_confirmation: '', dni: '', telefono: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await register(form)
      navigate('/reservas', { replace: true })
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {})
      } else {
        setErrors({ general: err.response?.data?.message ?? 'Error al registrarse.' })
      }
    } finally {
      setLoading(false)
    }
  }

  function fieldError(field) {
    const msg = errors[field]?.[0]
    return msg
      ? <p style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.25rem' }}>{msg}</p>
      : null
  }

  const baseInput = {
    width: '100%', boxSizing: 'border-box',
    border: `1.5px solid ${BRAND.gold}`,
    borderRadius: 12, padding: '0.75rem 1rem',
    fontSize: '0.875rem', color: BRAND.dark,
    background: 'white', outline: 'none',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.68rem', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    color: BRAND.wood, marginBottom: '0.4rem',
  }
  function addFocus(e)    { e.target.style.boxShadow = '0 0 0 3px rgba(212,168,67,0.28)' }
  function removeFocus(e) { e.target.style.boxShadow = 'none' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Panel izquierdo – branding ───────────── */}
      <div
        className="hidden lg:flex"
        style={{
          width: '40%',
          position: 'relative',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: `linear-gradient(160deg, ${BRAND.dark} 0%, ${BRAND.brown} 50%, ${BRAND.wood} 100%)`,
        }}
      >
        {/* Hero image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('/src/assets/hero.png')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.22,
        }}/>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, rgba(30,13,3,0.68), rgba(61,26,6,0.40), rgba(30,13,3,0.75))`,
        }}/>

        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 2.75rem', maxWidth: 380 }}>

          <div style={{
            width: 110, height: 110, borderRadius: '50%', overflow: 'hidden',
            border: `3px solid ${BRAND.gold}`,
            background: 'rgba(212,168,67,0.12)',
            backdropFilter: 'blur(6px)',
            margin: '0 auto 1.75rem',
            boxShadow: `0 0 28px rgba(212,168,67,0.35)`,
          }}>
            <img src="/images/Logo-hotel.jpeg" alt="Brisas de Mayo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>

          <h1 style={{
            fontSize: '2.25rem', fontWeight: 800, color: 'white', marginBottom: '0.4rem',
            fontFamily: 'Georgia, "Times New Roman", serif',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)',
          }}>
            Brisas de Mayo
          </h1>

          <div style={{
            height: 2, width: 120, margin: '0 auto 1rem',
            background: `linear-gradient(to right, transparent, ${BRAND.gold}, transparent)`,
            borderRadius: 9999,
          }}/>

          <p style={{ color: '#F5C87A', fontSize: '1rem', fontStyle: 'italic', marginBottom: '2.5rem' }}>
            Tu paraíso te espera
          </p>

          {/* Info card */}
          <div style={{
            borderRadius: 16,
            padding: '1.25rem 1.5rem',
            background: 'rgba(255,255,255,0.07)',
            border: `1px solid rgba(212,168,67,0.3)`,
            backdropFilter: 'blur(4px)',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.85rem', lineHeight: 1.65 }}>
              Crea tu cuenta y accede a reservaciones exclusivas, ofertas especiales y una experiencia de lujo personalizada.
            </p>
          </div>

          {/* Beneficios */}
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { icon: '🏖️', text: 'Reserva en segundos' },
              { icon: '💎', text: 'Tarifas exclusivas para miembros' },
              { icon: '🔔', text: 'Notificaciones de disponibilidad' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.82rem' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <BottomWave/>
        </div>
      </div>

      {/* ── Panel derecho – formulario ───────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 2rem',
        background: BRAND.cream,
        overflowY: 'auto',
      }}>

        {/* Logo móvil */}
        <div className="lg:hidden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%', overflow: 'hidden',
            border: `2px solid ${BRAND.gold}`,
            marginBottom: '0.5rem',
            boxShadow: `0 0 16px rgba(212,168,67,0.3)`,
          }}>
            <img src="/images/Logo-hotel.jpeg" alt="Brisas de Mayo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: BRAND.brown, fontFamily: 'Georgia, serif' }}>
            Brisas de Mayo
          </span>
        </div>

        <div style={{ width: '100%', maxWidth: 440 }}>

          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{
              fontSize: '1.85rem', fontWeight: 800, color: BRAND.dark,
              fontFamily: 'Georgia, "Times New Roman", serif',
              marginBottom: '0.3rem',
            }}>
              Crear cuenta
            </h2>
            <p style={{ fontSize: '0.875rem', color: BRAND.wood }}>
              Completa los datos para unirte a nosotros
            </p>
          </div>

          {errors.general && (
            <div style={{
              marginBottom: '1.25rem', borderRadius: 12,
              padding: '0.75rem 1rem', fontSize: '0.875rem',
              background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626',
            }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div>
              <label style={labelStyle}>Nombre completo</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required
                style={baseInput} onFocus={addFocus} onBlur={removeFocus}
                placeholder="Juan Pérez"/>
              {fieldError('name')}
            </div>

            <div>
              <label style={labelStyle}>Correo electrónico</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} required
                style={baseInput} onFocus={addFocus} onBlur={removeFocus}
                placeholder="correo@ejemplo.com"/>
              {fieldError('email')}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>DNI</label>
                <input type="text" name="dni" value={form.dni} onChange={handleChange}
                  style={baseInput} onFocus={addFocus} onBlur={removeFocus}
                  placeholder="12345678"/>
                {fieldError('dni')}
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input type="text" name="telefono" value={form.telefono} onChange={handleChange}
                  style={baseInput} onFocus={addFocus} onBlur={removeFocus}
                  placeholder="999888777"/>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Contraseña</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} required
                style={baseInput} onFocus={addFocus} onBlur={removeFocus}
                placeholder="Mínimo 8 caracteres"/>
              {fieldError('password')}
            </div>

            <div>
              <label style={labelStyle}>Confirmar contraseña</label>
              <input type="password" name="password_confirmation" value={form.password_confirmation} onChange={handleChange} required
                style={baseInput} onFocus={addFocus} onBlur={removeFocus}
                placeholder="Repite tu contraseña"/>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '0.9rem',
                background: loading ? BRAND.gold : `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.amber})`,
                color: 'white', fontWeight: 700, fontSize: '0.95rem',
                border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(245,146,46,0.45)',
                transition: 'box-shadow 0.2s, opacity 0.2s',
                opacity: loading ? 0.72 : 1,
                marginTop: '0.25rem',
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,146,46,0.65)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 18px rgba(245,146,46,0.45)' }}
            >
              {loading ? 'Creando cuenta…' : 'Crear cuenta'}
            </button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: BRAND.wood }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login"
              style={{ color: BRAND.orange, fontWeight: 700, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Inicia sesión
            </Link>
          </p>

          <Divider/>
        </div>
      </div>
    </div>
  )
}
