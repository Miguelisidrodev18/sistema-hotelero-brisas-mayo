import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import RevealSection from '../ui/RevealSection'

const SocialIcons = {
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
}

const LINKS = {
  Hotel: [
    { label: 'Habitaciones',   href: '#habitaciones' },
    { label: 'Servicios',      href: '#beneficios' },
    { label: 'Promociones',    href: '#' },
    { label: 'Nosotros',       href: '#metricas' },
  ],
  Reservas: [
    { label: 'Reservar ahora', href: '/register' },
    { label: 'Iniciar sesión', href: '/login' },
    { label: 'Cancelaciones',  href: '#' },
    { label: 'FAQ',            href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer id="footer" style={{
      width: '100%',
      background: 'linear-gradient(135deg, #1E0D03 0%, #0f0702 100%)',
      color: 'rgba(255,255,255,0.5)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 1.5rem 32px' }}>

        <RevealSection>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: 32,
            paddingBottom: 48,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}>

            {/* Brand con logo */}
            <div>
              <img src="/images/Logo-hotel.jpeg" alt="Brisas de Mayo"
                style={{
                  height: 56,
                  width: 'auto',
                  objectFit: 'contain',
                  marginBottom: 16,
                  borderRadius: 8,
                  opacity: 0.9,
                  filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                }} />
              <p style={{
                fontSize: '0.85rem',
                lineHeight: 1.7,
                marginBottom: 20,
              }}>
                Experiencias únicas frente a la naturaleza. Tu descanso es nuestra prioridad.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[SocialIcons.Facebook, SocialIcons.Instagram, SocialIcons.X].map((Icon, i) => (
                  <a key={i} href="#"
                    style={{
                      width: 36, height: 36,
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'rgba(255,255,255,0.5)',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(245,146,46,0.2)'
                      e.currentTarget.style.color = '#F5922E'
                      e.currentTarget.style.borderColor = 'rgba(245,146,46,0.3)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {Object.entries(LINKS).map(([section, links]) => (
              <div key={section}>
                <h4 style={{
                  color: 'white',
                  fontWeight: 600,
                  marginBottom: 20,
                  fontSize: '0.8rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>{section}</h4>
                <ul style={{
                  listStyle: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: 0,
                  margin: 0,
                }}>
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      {href.startsWith('/') ? (
                        <Link to={href}
                          style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            transition: 'color 0.2s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#F5922E'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                        >{label}</Link>
                      ) : (
                        <a href={href}
                          style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: '0.85rem',
                            textDecoration: 'none',
                            transition: 'color 0.2s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#F5922E'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                        >{label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contacto */}
            <div>
              <h4 style={{
                color: 'white',
                fontWeight: 600,
                marginBottom: 20,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}>Contacto</h4>
              <ul style={{
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                fontSize: '0.85rem',
                padding: 0,
                margin: 0,
              }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <MapPin size={15} style={{ color: '#F5922E', marginTop: 2, flexShrink: 0 }} />
                  Huancaya, Yauyos — Frente a las cascadas y laguna
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Phone size={15} style={{ color: '#F5922E', flexShrink: 0 }} />
                  +51 999 123 456
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Mail size={15} style={{ color: '#F5922E', flexShrink: 0 }} />
                  contacto@brisasdmayo.com
                </li>
              </ul>
            </div>
          </div>
        </RevealSection>

        <div style={{
          paddingTop: 24,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.25)',
        }}>
          <p>© {new Date().getFullYear()} Hotel Brisas de Mayo. Todos los derechos reservados.</p>
          <p>Desarrollado con React + Laravel</p>
        </div>
      </div>
    </footer>
  )
}
