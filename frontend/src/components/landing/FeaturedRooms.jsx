import { Link } from 'react-router-dom'
import { Users, Eye, Star, BedDouble } from 'lucide-react'
import RevealSection from '../ui/RevealSection'

const ROOMS = [
  {
    sede: 'Sede I — Laguna',
    name: 'Matrimonial Queen',
    tipo: 'Cama queen · Vista directa a la laguna',
    precio: 150,
    capacidad: 2,
    vista: 'Laguna de Mayo',
    rating: 4.9,
    gradient: 'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
    badge: 'Vista a la laguna',
    badgeBg: '#14b8a6',
  },
  {
    sede: 'Sede II — Cascadas',
    name: 'Matrimonial KIN',
    tipo: 'Cama king · Vista a las cascadas',
    precio: 300,
    capacidad: 2,
    vista: 'Cascadas Cabracancha',
    rating: 5.0,
    gradient: 'linear-gradient(135deg, #7B4019 0%, #3D1A06 100%)',
    badge: 'Más popular',
    badgeBg: '#F5922E',
  },
  {
    sede: 'Sede II — Cascadas',
    name: 'Matrimonial + Adicional',
    tipo: 'Cama matrimonial + cama extra · Vista cascadas',
    precio: 250,
    capacidad: 3,
    vista: 'Cascadas Cabracancha',
    rating: 4.8,
    gradient: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
    badge: 'Para familias',
    badgeBg: '#f59e0b',
  },
]

export default function FeaturedRooms() {
  return (
    <section id="habitaciones" style={{
      width: '100%',
      padding: '96px 0',
      background: 'white',
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
          }}>Habitaciones destacadas</p>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: '#3D1A06',
            margin: 0,
          }}>Elige tu espacio perfecto</h2>
          <div className="section-divider" />
          <p style={{
            color: '#6b7280',
            marginTop: 16,
            maxWidth: 560,
            marginLeft: 'auto',
            marginRight: 'auto',
            fontSize: '0.9rem',
            lineHeight: 1.7,
          }}>
            Todas las habitaciones incluyen desayuno, baño privado con agua caliente y televisión.
          </p>
        </RevealSection>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gap: 28,
        }}>
          {ROOMS.map((room, i) => (
            <RevealSection key={room.name} direction="scale"
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <article className="card-hover" style={{
                borderRadius: 20,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.05)',
                boxShadow: '0 4px 24px rgba(61,26,6,0.06)',
                background: 'white',
              }}>

                {/* Image/gradient header */}
                <div style={{
                  position: 'relative',
                  height: 210,
                  background: room.gradient,
                  overflow: 'hidden',
                }}>
                  {/* Decorative light */}
                  <div style={{
                    position: 'absolute', inset: 0, opacity: 0.2,
                    background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,.5) 0%, transparent 60%)',
                  }} />

                  <span style={{
                    position: 'absolute',
                    top: 16, left: 16,
                    background: room.badgeBg,
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '5px 14px',
                    borderRadius: 9999,
                    letterSpacing: '0.03em',
                  }}>
                    {room.badge}
                  </span>

                  <div style={{
                    position: 'absolute',
                    bottom: 16, left: 16, right: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.7rem',
                      background: 'rgba(0,0,0,0.2)',
                      padding: '4px 10px',
                      borderRadius: 9999,
                      backdropFilter: 'blur(4px)',
                    }}>{room.sede}</span>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: 'white',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}>
                      <Star size={13} fill="#F5922E" style={{ color: '#F5922E' }} /> {room.rating}
                    </span>
                  </div>
                </div>

                <div style={{ padding: 24 }}>
                  <h3 style={{
                    fontWeight: 700,
                    color: '#3D1A06',
                    fontSize: '1.1rem',
                    marginBottom: 4,
                  }}>{room.name}</h3>
                  <p style={{
                    color: '#9ca3af',
                    fontSize: '0.8rem',
                    marginBottom: 16,
                  }}>{room.tipo}</p>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    marginBottom: 20,
                    paddingBottom: 16,
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={13} /> {room.capacidad} pers.
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Eye size={13} /> {room.vista}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BedDouble size={13} />
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <span style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: '#3D1A06',
                      }}>S/ {room.precio}</span>
                      <span style={{
                        color: '#9ca3af',
                        fontSize: '0.7rem',
                        marginLeft: 4,
                      }}>/ noche</span>
                    </div>
                    <Link to="/register"
                      className="btn-glow"
                      style={{
                        background: 'linear-gradient(135deg, #F5922E, #E07820)',
                        color: 'white',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '10px 20px',
                        borderRadius: 14,
                        textDecoration: 'none',
                      }}
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              </article>
            </RevealSection>
          ))}
        </div>

        <RevealSection style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '2px solid #F5922E',
              color: '#F5922E',
              fontWeight: 700,
              padding: '14px 32px',
              borderRadius: 9999,
              textDecoration: 'none',
              fontSize: '0.85rem',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#F5922E'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,146,46,0.3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#F5922E'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            Ver todas las habitaciones →
          </Link>
        </RevealSection>
      </div>
    </section>
  )
}
