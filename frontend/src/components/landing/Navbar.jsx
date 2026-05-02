import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Phone } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Inicio',       href: '#inicio' },
  { label: 'Habitaciones', href: '#habitaciones' },
  { label: 'Servicios',    href: '#beneficios' },
  { label: 'Nosotros',     href: '#metricas' },
  { label: 'Contacto',     href: '#footer' },
]

export default function Navbar() {
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 768) setOpen(false) }
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 50,
      transition: 'all 0.4s cubic-bezier(.22,1,.36,1)',
      background: scrolled || open
        ? 'rgba(61,26,6,0.95)'
        : 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
      backdropFilter: scrolled || open ? 'blur(20px) saturate(1.4)' : 'none',
      WebkitBackdropFilter: scrolled || open ? 'blur(20px) saturate(1.4)' : 'none',
      boxShadow: scrolled ? '0 4px 30px rgba(30,13,3,0.3)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(245,146,46,0.1)' : '1px solid transparent',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 1rem',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>

          {/* Logo */}
          <a href="#inicio" style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            flexShrink: 0,
          }}>
            <img
              src="/images/Logo-hotel.jpeg"
              alt="Hotel Brisas de Mayo"
              style={{
                height: 42,
                width: 'auto',
                objectFit: 'contain',
                borderRadius: 6,
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
              }}
            />
          </a>

          {/* Desktop links — hidden on mobile */}
          <nav className="hidden md:flex" style={{
            alignItems: 'center',
            gap: 28,
          }}>
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                  position: 'relative',
                  paddingBottom: 2,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#F5922E'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop actions — hidden on mobile */}
          <div className="hidden md:flex" style={{
            alignItems: 'center',
            gap: 14,
          }}>
            <a href="tel:+51999123456"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.8rem',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#F5922E'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            >
              <Phone size={13} />
              +51 999 123 456
            </a>
            <Link to="/login"
              className="btn-glow"
              style={{
                background: 'linear-gradient(135deg, #F5922E, #E07820)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.8rem',
                padding: '0.5rem 1.15rem',
                borderRadius: 9999,
                textDecoration: 'none',
                boxShadow: '0 2px 12px rgba(245,146,46,0.25)',
              }}
            >
              Iniciar sesión
            </Link>
          </div>

          {/* Mobile toggle — visible only on mobile */}
          <button
            onClick={() => setOpen(!open)}
            className="md:!hidden"
            style={{
              color: 'white',
              padding: 8,
              borderRadius: 8,
              background: open ? 'rgba(255,255,255,0.1)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menú — full width dropdown */}
      <div
        className="md:hidden"
        style={{
          maxHeight: open ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div style={{
          padding: '8px 1rem 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          borderTop: open ? '1px solid rgba(245,146,46,0.12)' : 'none',
        }}>
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}
              style={{
                color: 'rgba(255,255,255,0.85)',
                fontSize: '0.9rem',
                fontWeight: 500,
                textDecoration: 'none',
                padding: '10px 12px',
                borderRadius: 10,
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {l.label}
            </a>
          ))}

          {/* Phone */}
          <a href="tel:+51999123456"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.85rem',
              textDecoration: 'none',
              padding: '10px 12px',
              borderRadius: 10,
            }}
          >
            <Phone size={14} />
            +51 999 123 456
          </a>

          {/* CTA */}
          <Link to="/login" onClick={() => setOpen(false)}
            style={{
              marginTop: 4,
              background: 'linear-gradient(135deg, #F5922E, #E07820)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.875rem',
              padding: '0.7rem 1.5rem',
              borderRadius: 9999,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  )
}
