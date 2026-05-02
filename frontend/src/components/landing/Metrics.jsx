import { useState, useEffect, useRef } from 'react'
import { BedDouble, Users, Star, MapPin } from 'lucide-react'
import RevealSection from '../ui/RevealSection'
import FloatingParticles from '../ui/FloatingParticles'

const METRICS = [
  { icon: BedDouble, value: '40+',    label: 'Habitaciones' },
  { icon: Users,     value: '5000+',  label: 'Huéspedes satisfechos' },
  { icon: Star,      value: '4.8',    label: 'Calificación promedio' },
  { icon: MapPin,    value: '2',      label: 'Sedes en Huancaya' },
]

const TESTIMONIALS = [
  {
    name: 'Patricia Ríos', origen: 'Lima', initials: 'PR',
    bg: 'linear-gradient(135deg, #99f6e4, #5eead4)',
    color: '#0f766e',
    texto: 'La vista a la laguna es increíble. El desayuno estuvo delicioso y el agua caliente a cualquier hora. Volveremos pronto.',
    rating: 5,
  },
  {
    name: 'Jorge Menacho', origen: 'Huancaya', initials: 'JM',
    bg: 'linear-gradient(135deg, #fed7aa, #fdba74)',
    color: '#c2410c',
    texto: 'Fui a las cascadas de Cabracancha y me alojé en Brisas II. La habitación KIN con vista a las cascadas es espectacular.',
    rating: 5,
  },
  {
    name: 'Lucia Vargas', origen: 'Tingo María', initials: 'LV',
    bg: 'linear-gradient(135deg, #bbf7d0, #86efac)',
    color: '#15803d',
    texto: 'Excelente atención, pantuflas y termo de agua incluidos. Súper cómodo para visitar las cascadas con la familia.',
    rating: 5,
  },
]

/**
 * Animated number counter — triggers on scroll into view
 */
function AnimatedCounter({ value }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(value)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true
        // Extract numeric part
        const num = parseFloat(value.replace(/[^0-9.]/g, ''))
        const suffix = value.replace(/[0-9.]/g, '')
        if (isNaN(num)) { setDisplay(value); return }

        const isDecimal = value.includes('.')
        const duration = 1500
        const start = performance.now()

        const animate = (now) => {
          const elapsed = now - start
          const progress = Math.min(elapsed / duration, 1)
          // easeOutExpo
          const eased = 1 - Math.pow(2, -10 * progress)
          const current = eased * num

          setDisplay(
            isDecimal
              ? current.toFixed(1) + suffix
              : Math.floor(current) + suffix
          )

          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.3 })

    observer.observe(el)
    return () => observer.disconnect()
  }, [value])

  return <span ref={ref}>{display}</span>
}

export default function Metrics() {
  return (
    <>
      {/* ─── Metrics section ─── */}
      <section id="metricas" style={{
        width: '100%',
        padding: '64px 0',
        background: 'linear-gradient(135deg, #3D1A06 0%, #1E0D03 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Floating particles */}
        <FloatingParticles count={12} color="rgba(245,146,46,0.08)" />

        {/* Pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }} />

        <div style={{
          position: 'relative',
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 1.5rem',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
            gap: 24,
          }}>
            {METRICS.map(({ icon: Icon, value, label }, i) => (
              <RevealSection key={label}
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 12,
                }}>
                  <div style={{
                    width: 56, height: 56,
                    borderRadius: 16,
                    background: 'rgba(245,146,46,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(245,146,46,0.15)',
                  }}>
                    <Icon size={26} style={{ color: '#F5922E' }} />
                  </div>
                  <p style={{
                    fontSize: 'clamp(2rem, 4vw, 2.8rem)',
                    fontWeight: 800,
                    color: 'white',
                    margin: 0,
                    lineHeight: 1,
                  }}>
                    <AnimatedCounter value={value} />
                  </p>
                  <p style={{
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.8rem',
                    margin: 0,
                  }}>{label}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section style={{
        width: '100%',
        padding: '64px 0',
        background: '#FDF6ED',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>

          <RevealSection style={{ textAlign: 'center', marginBottom: 64 }}>
            <p style={{
              color: '#F5922E',
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}>Testimonios</p>
            <h2 style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 800,
              color: '#3D1A06',
              margin: 0,
            }}>Lo que dicen nuestros huéspedes</h2>
            <div className="section-divider" />
          </RevealSection>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: 24,
          }}>
            {TESTIMONIALS.map((t, i) => (
              <RevealSection key={t.name}
                direction="scale"
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div className="card-hover" style={{
                  background: 'white',
                  borderRadius: 20,
                  padding: 28,
                  border: '1px solid rgba(245,146,46,0.08)',
                  boxShadow: '0 4px 24px rgba(61,26,6,0.04)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                  {/* Quote mark */}
                  <p style={{
                    fontSize: '3.5rem',
                    lineHeight: 0.8,
                    margin: 0,
                    marginBottom: 4,
                    background: 'linear-gradient(135deg, #F5922E, #D4A843)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontFamily: 'Georgia, serif',
                    opacity: 0.3,
                  }}>"</p>

                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} size={14} fill="#F5922E" style={{ color: '#F5922E' }} />
                    ))}
                  </div>

                  {/* Text */}
                  <p style={{
                    color: '#4b5563',
                    fontSize: '0.9rem',
                    lineHeight: 1.7,
                    marginBottom: 24,
                    fontStyle: 'italic',
                    flex: 1,
                  }}>{t.texto}</p>

                  {/* Author */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    paddingTop: 16,
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <div style={{
                      width: 42, height: 42,
                      borderRadius: '50%',
                      background: t.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: t.color,
                      flexShrink: 0,
                    }}>
                      {t.initials}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: '#3D1A06', fontSize: '0.85rem', margin: 0 }}>{t.name}</p>
                      <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: 0 }}>{t.origen}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
