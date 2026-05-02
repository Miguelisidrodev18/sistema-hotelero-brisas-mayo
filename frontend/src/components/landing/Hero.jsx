import { Link } from 'react-router-dom'
import { Calendar, MapPin, ChevronDown } from 'lucide-react'
import FloatingParticles from '../ui/FloatingParticles'

export default function Hero() {
  return (
    <section
      id="inicio"
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: 560,
      }}
    >
      {/* ─── Video de fondo con zoom suave ─── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
      }}>
        <video
          autoPlay muted loop playsInline
          poster="/images/Logo-hotel.jpeg"
          className="hero-video-zoom"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/images/video-hotel.mp4" type="video/mp4" />
        </video>

        {/* Overlay oscuro con gradiente radial para centrado */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center 40%, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.65) 100%)',
        }} />
        {/* Gradiente inferior suave */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 220,
          background: 'linear-gradient(to top, rgba(30,13,3,0.7) 0%, transparent 100%)',
        }} />
      </div>

      {/* ─── Partículas flotantes — ocultas en móvil para performance ─── */}
      <div className="hidden sm:block">
        <FloatingParticles count={15} color="rgba(245,146,46,0.12)" />
      </div>

      {/* ─── Contenido principal centrado ─── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Contenido centrado vertical y horizontalmente
            paddingTop reducido para subir el contenido */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 40,
          paddingBottom: 16,
        }}>
          <div style={{
            width: '100%',
            maxWidth: 900,
            margin: '0 auto',
            padding: '0 1.25rem',
            textAlign: 'center',
          }}>

            {/* Ubicación con glass pill */}
            <div className="anim-hero-text hidden sm:inline-flex" style={{
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
              padding: '7px 18px',
              borderRadius: 9999,
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}>
              <MapPin size={14} style={{ color: '#F5922E', flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', fontWeight: 500, letterSpacing: '0.02em' }}>
                Huancaya, Yauyos — 2 sedes frente a la naturaleza
              </span>
            </div>

            {/* Ubicación móvil — más compacta */}
            <div className="anim-hero-text flex sm:hidden" style={{
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 14,
            }}>
              <MapPin size={12} style={{ color: '#F5922E', flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem', fontWeight: 500 }}>
                Huancaya, Yauyos
              </span>
            </div>

            {/* Título — responsive clamp */}
            <h1 className="anim-hero-text delay-200" style={{
              fontSize: 'clamp(2rem, 7vw, 5rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.08,
              marginBottom: '0.75rem',
              letterSpacing: '-0.02em',
            }}>
              Hotel{' '}
              <span className="gradient-text" style={{
                fontStyle: 'italic',
                display: 'inline-block',
              }}>
                Brisas de Mayo
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="anim-hero-text delay-300" style={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: 'clamp(0.85rem, 1.5vw, 1.15rem)',
              maxWidth: 560,
              lineHeight: 1.7,
              margin: '0 auto 1.5rem',
              padding: '0 0.5rem',
            }}>
              Vista panorámica a las{' '}
              <strong style={{ color: 'white' }}>Cascadas de Cabracancha</strong> y la{' '}
              <strong style={{ color: 'white' }}>Laguna de Mayo</strong>.
              <span className="hidden sm:inline"> Desayuno incluido, confort y naturaleza.</span>
            </p>

            {/* CTAs */}
            <div className="anim-hero-text delay-400" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.75rem',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}>
              <Link
                to="/register"
                className="btn-glow"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #F5922E, #E07820)',
                  color: 'white',
                  fontWeight: 700, fontSize: 'clamp(0.8rem, 1.2vw, 0.9rem)',
                  padding: '0.75rem 1.5rem', borderRadius: 9999,
                  textDecoration: 'none',
                  boxShadow: '0 4px 24px rgba(245,146,46,0.35)',
                }}
              >
                <Calendar size={16} /> Reservar ahora
              </Link>

              <a
                href="#habitaciones"
                className="glass"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  color: 'white', fontWeight: 600, fontSize: 'clamp(0.8rem, 1.2vw, 0.9rem)',
                  padding: '0.75rem 1.5rem', borderRadius: 9999,
                  textDecoration: 'none',
                  transition: 'all .3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(245,146,46,0.2)'
                  e.currentTarget.style.borderColor = 'rgba(245,146,46,0.5)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
                }}
              >
                Ver habitaciones
              </a>
            </div>

            {/* Stats rápidas — 2x2 en móvil, 4 en desktop */}
            <div className="anim-hero-text delay-500" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.5rem',
              maxWidth: 560,
              margin: '0 auto',
            }}>
              {[
                ['2', 'Sedes'],
                ['40+', 'Habitaciones'],
                ['S/ 100', 'Desde / noche'],
                ['★ 4.8', 'Calificación'],
              ].map(([v, l]) => (
                <div key={l} className="glass" style={{
                  padding: '10px 8px',
                  borderRadius: 12,
                  textAlign: 'center',
                }}>
                  <p style={{ color: '#F5922E', fontWeight: 700, fontSize: 'clamp(0.85rem, 1.3vw, 1.1rem)', lineHeight: 1, margin: 0 }}>{v}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 3 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator — oculto en móvil */}
        <div className="anim-fade-in delay-800 hidden md:flex" style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          zIndex: 15,
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Descubrir
          </span>
          <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.4)' }} className="anim-float" />
        </div>


      </div>
    </section>
  )
}
