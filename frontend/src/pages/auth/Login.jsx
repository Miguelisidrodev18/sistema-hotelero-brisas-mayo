import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROLE_HOME = {
  administrador: '/admin',
  recepcionista: '/recepcion',
  contador:      '/dashboard',
  gerente:       '/dashboard',
  cliente:       '/reservas',
}

const BRAND = {
  dark:   '#1E0D03',
  brown:  '#3D1A06',
  wood:   '#7B4019',
  orange: '#F5922E',
  amber:  '#E07820',
  gold:   '#D4A843',
  cream:  '#FDF6ED',
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${BRAND.gold})` }}/>
      {/* Icono de cascada/montaña */}
      <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
        <path d="M1 14 L6 5 L11 10 L14 6 L21 14" stroke={BRAND.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M8 14 Q9 10 10 14" stroke={BRAND.gold} strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.5"/>
      </svg>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${BRAND.gold})` }}/>
    </div>
  )
}

export default function Login() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(ROLE_HOME[user.role] ?? '/reservas', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Credenciales incorrectas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  function addFocus(e)    { e.target.style.boxShadow = '0 0 0 3px rgba(212,168,67,0.28)' }
  function removeFocus(e) { e.target.style.boxShadow = 'none' }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Panel izquierdo – branding ───────────── */}
      <div
        className="hidden lg:flex"
        style={{
          width: '58%',
          height: '100%',
          position: 'relative',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: `linear-gradient(145deg, ${BRAND.dark} 0%, ${BRAND.brown} 40%, ${BRAND.wood} 75%, #5C3D1A 100%)`,
        }}
      >
        {/* Hero image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url('/src/assets/hero.png')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.30,
        }}/>
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(to bottom, rgba(30,13,3,0.70) 0%, rgba(61,26,6,0.40) 50%, rgba(30,13,3,0.78) 100%)`,
        }}/>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 3.5rem', maxWidth: 480 }}>

          {/* Logo circular */}
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `3px solid ${BRAND.gold}`,
            background: 'rgba(212,168,67,0.12)',
            backdropFilter: 'blur(6px)',
            margin: '0 auto 2rem',
            overflow: 'hidden',
            boxShadow: `0 0 32px rgba(212,168,67,0.35)`,
          }}>
            <img src="/images/Logo-hotel.jpeg" alt="Brisas de Mayo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>

          <h1 style={{
            fontSize: '3rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem',
            fontFamily: 'Georgia, "Times New Roman", serif',
            textShadow: '0 2px 24px rgba(0,0,0,0.55)',
            letterSpacing: '-0.5px',
          }}>
            Brisas de Mayo
          </h1>

          <div style={{
            height: 2, width: 140, margin: '0 auto 1.25rem',
            background: `linear-gradient(to right, transparent, ${BRAND.gold}, transparent)`,
            borderRadius: 9999,
          }}/>

          {/* Ubicación */}
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Huancaya · Yauyos · Lima
          </p>

          <p style={{ color: '#F5C87A', fontSize: '1.05rem', fontStyle: 'italic', marginBottom: '3rem' }}>
            Entre cascadas y lagunas turquesa
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start', maxWidth: 270, margin: '0 auto' }}>
            {[
              { icon: '🏔️', text: 'Cascadas y lagunas turquesa' },
              { icon: '✨', text: 'Servicio de primera clase'    },
              { icon: '🌿', text: 'Naturaleza andina en estado puro' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.82)', fontSize: '0.875rem' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decoración inferior – silueta de montañas */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <svg viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ height: 65, width: '100%', opacity: 0.18 }}>
            <path d="M0,70 L160,30 L320,60 L480,10 L640,50 L800,20 L960,55 L1120,15 L1280,45 L1440,25 L1440,90 L0,90 Z" fill={BRAND.gold}/>
          </svg>
        </div>
      </div>

      {/* ── Panel derecho – formulario ───────────── */}
      <div style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        background: BRAND.cream,
      }}>

        {/* Logo móvil */}
        <div className="lg:hidden" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
            border: `2px solid ${BRAND.gold}`,
            marginBottom: '0.5rem',
            boxShadow: `0 0 16px rgba(212,168,67,0.3)`,
          }}>
            <img src="/images/Logo-hotel.jpeg" alt="Brisas de Mayo" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: BRAND.brown, fontFamily: 'Georgia, serif' }}>
            Brisas de Mayo
          </span>
        </div>

        <div style={{ width: '100%', maxWidth: 420 }}>

          <div style={{ marginBottom: '2.25rem' }}>
            <h2 style={{
              fontSize: '2rem', fontWeight: 800, color: BRAND.dark,
              fontFamily: 'Georgia, "Times New Roman", serif',
              marginBottom: '0.35rem',
            }}>
              Bienvenido
            </h2>
            <p style={{ fontSize: '0.875rem', color: BRAND.wood }}>
              Inicia sesión en tu cuenta para continuar
            </p>
          </div>

          {error && (
            <div style={{
              marginBottom: '1.25rem', borderRadius: 12,
              padding: '0.75rem 1rem', fontSize: '0.875rem',
              background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: BRAND.wood, marginBottom: '0.5rem' }}>
                Correo electrónico
              </label>
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                required autoComplete="email"
                placeholder="correo@ejemplo.com"
                style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${BRAND.gold}`, borderRadius: 12, padding: '0.8rem 1rem', fontSize: '0.9rem', background: 'white', color: BRAND.dark, outline: 'none' }}
                onFocus={addFocus} onBlur={removeFocus}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: BRAND.wood, marginBottom: '0.5rem' }}>
                Contraseña
              </label>
              <input
                type="password" name="password" value={form.password} onChange={handleChange}
                required autoComplete="current-password"
                placeholder="••••••••"
                style={{ width: '100%', boxSizing: 'border-box', border: `1.5px solid ${BRAND.gold}`, borderRadius: 12, padding: '0.8rem 1rem', fontSize: '0.9rem', background: 'white', color: BRAND.dark, outline: 'none' }}
                onFocus={addFocus} onBlur={removeFocus}
              />
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
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem', color: BRAND.wood }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ color: BRAND.orange, fontWeight: 700, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Regístrate aquí
            </Link>
          </p>

          <Divider/>
        </div>
      </div>
    </div>
  )
}
