import { Waves, Coffee, Droplets, ShieldCheck } from 'lucide-react'
import RevealSection from '../ui/RevealSection'

const BENEFITS = [
  {
    icon: Waves,
    gradient: 'linear-gradient(135deg, #e0f7f3 0%, #b2dfdb 100%)',
    iconColor: '#0d9488',
    glow: 'rgba(13,148,136,0.1)',
    title: 'Vista a cascadas y laguna',
    desc: 'Habitaciones con vista directa a las Cascadas de Cabracancha o la Laguna de Mayo.',
  },
  {
    icon: Coffee,
    gradient: 'linear-gradient(135deg, #fef3e2 0%, #fde68a 100%)',
    iconColor: '#d97706',
    glow: 'rgba(217,119,6,0.1)',
    title: 'Desayuno incluido',
    desc: 'Todas las habitaciones incluyen desayuno. Empieza el día con energía en medio de la naturaleza.',
  },
  {
    icon: Droplets,
    gradient: 'linear-gradient(135deg, #e0f2fe 0%, #93c5fd 100%)',
    iconColor: '#3b82f6',
    glow: 'rgba(59,130,246,0.1)',
    title: 'Baño privado agua caliente',
    desc: 'Agua tibia caliente disponible las 24 horas en tu baño privado.',
  },
  {
    icon: ShieldCheck,
    gradient: 'linear-gradient(135deg, #dcfce7 0%, #86efac 100%)',
    iconColor: '#16a34a',
    glow: 'rgba(22,163,74,0.1)',
    title: 'Reserva segura',
    desc: 'Confirmación inmediata online. Aceptamos pago en soles y dólares al tipo de cambio del día.',
  },
]

export default function Benefits() {
  return (
    <section id="beneficios" style={{
      width: '100%',
      padding: '96px 0',
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
          }}>¿Por qué elegirnos?</p>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: '#3D1A06',
            margin: 0,
          }}>
            Todo lo que necesitas para descansar
          </h2>
          <div className="section-divider" />
        </RevealSection>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
          gap: 24,
        }}>
          {BENEFITS.map(({ icon: Icon, gradient, iconColor, glow, title, desc }, i) => (
            <RevealSection key={title} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="card-hover" style={{
                background: 'white',
                borderRadius: 20,
                padding: 28,
                border: '1px solid rgba(245,146,46,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {/* Decorative glow */}
                <div style={{
                  position: 'absolute',
                  top: -30,
                  right: -30,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: glow,
                  filter: 'blur(30px)',
                  pointerEvents: 'none',
                }} />

                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}>
                  <Icon size={26} style={{ color: iconColor }} />
                </div>
                <div>
                  <h3 style={{
                    fontWeight: 700,
                    color: '#3D1A06',
                    marginBottom: 8,
                    lineHeight: 1.3,
                    fontSize: '1rem',
                  }}>{title}</h3>
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    lineHeight: 1.7,
                    margin: 0,
                  }}>{desc}</p>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  )
}
