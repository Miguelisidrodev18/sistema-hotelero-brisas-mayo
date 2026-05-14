import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Eye, BedDouble } from 'lucide-react'
import RevealSection from '../ui/RevealSection'
import { habitacionesApi } from '../../api/habitaciones'
import { useAuth } from '../../context/AuthContext'

const TIPO_GRADIENTS = {
  matrimonial:           'linear-gradient(135deg, #7B4019 0%, #3D1A06 100%)',
  matrimonial_king:      'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  matrimonial_queen:     'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
  matrimonial_adicional: 'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
  doble:                 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
  triple:                'linear-gradient(135deg, #5b21b6 0%, #3b0764 100%)',
}

export default function FeaturedRooms() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    habitacionesApi.getDisponibles()
      .then(r => setRooms(r.data.slice(0, 3)))
      .catch(() => {})
  }, [])

  function handleReservar(hab) {
    if (isAuthenticated) {
      navigate(`/reservas?hab=${hab.id}`)
    } else {
      navigate(`/login?next=/reservas?hab=${hab.id}`)
    }
  }

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
          {rooms.map((hab, i) => (
            <RevealSection key={hab.id} direction="scale" style={{ transitionDelay: `${i * 0.12}s` }}>
              <article className="card-hover" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 24px rgba(61,26,6,0.06)', background: 'white' }}>

                <div style={{ position: 'relative', height: 210, background: hab.sede_imagen ? '#3D1A06' : (TIPO_GRADIENTS[hab.tipo] ?? TIPO_GRADIENTS.matrimonial), overflow: 'hidden' }}>
                  {hab.sede_imagen && <img src={hab.sede_imagen} alt={hab.sede_nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'}/>}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.2, background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,.5) 0%, transparent 60%)' }}/>
                  <span style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '5px 14px', borderRadius: 9999 }}>
                    {hab.tipo_label}
                  </span>
                  <div style={{ position: 'absolute', bottom: 16, left: 16, color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem', background: 'rgba(0,0,0,0.25)', padding: '4px 10px', borderRadius: 9999, backdropFilter: 'blur(4px)' }}>
                    {hab.sede_nombre}
                  </div>
                </div>

                <div style={{ padding: 24 }}>
                  <h3 style={{ fontWeight: 700, color: '#3D1A06', fontSize: '1.1rem', marginBottom: 4 }}>
                    Habitación N° {hab.numero}
                  </h3>
                  <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: 16 }}>
                    {hab.sede_ciudad} · Piso {hab.piso}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.8rem', color: '#6b7280', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={13}/> {hab.capacidad} pers.</span>
                    {hab.tiene_vista && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Eye size={13}/> Vista</span>}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BedDouble size={13}/></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3D1A06' }}>S/ {hab.precio}</span>
                      <span style={{ color: '#9ca3af', fontSize: '0.7rem', marginLeft: 4 }}>/noche</span>
                    </div>
                    <button onClick={() => handleReservar(hab)} className="btn-glow"
                      style={{ background: 'linear-gradient(135deg, #F5922E, #E07820)', color: 'white', fontSize: '0.8rem', fontWeight: 700, padding: '10px 20px', borderRadius: 14, border: 'none', cursor: 'pointer' }}>
                      Reservar
                    </button>
                  </div>
                </div>
              </article>
            </RevealSection>
          ))}
        </div>

        <RevealSection style={{ textAlign: 'center', marginTop: 48 }}>
          <Link to="/habitaciones"
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
            Ver todas las habitaciones disponibles →
          </Link>
        </RevealSection>
      </div>
    </section>
  )
}
