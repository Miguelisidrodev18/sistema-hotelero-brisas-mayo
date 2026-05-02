import { Link } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'
import SearchBar from './SearchBar'

export default function Hero() {
  return (
    <section
      id="inicio"
      style={{
        position: 'relative',
        width: '100%',
        /* height exacto = viewport. minHeight como seguro en móviles */
        height: '100vh',
        minHeight: 620,
        /* NO overflow-hidden: permite que SearchBar sobresalga abajo */
      }}
    >
      {/* ─── Video de fondo — solo este div tiene overflow:hidden ─── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        overflow: 'hidden',
        zIndex: 0,
      }}>
        <video
          autoPlay muted loop playsInline
          poster="/images/Logo-hotel.jpeg"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        >
          <source src="/images/video-hotel.mp4" type="video/mp4" />
        </video>

        {/* Overlay oscuro general */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.52)' }} />
        {/* Gradiente izquierda → legibilidad del texto */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to right, rgba(30,13,3,0.88) 0%, rgba(30,13,3,0.5) 50%, transparent 100%)',
        }} />
        {/* Degradado inferior → SearchBar recibido suavemente */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
        }} />
      </div>

      {/* ─── Columna flex que ocupa todo el height de la sección ─── */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        /* height: 100% hereda el 100vh de la sección padre */
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Contenido principal — crece y centra verticalmente */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          paddingTop: 96,   /* espacio para navbar fija (80px + 16px) */
          paddingBottom: 32,
        }}>
          <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>

            {/* Ubicación */}
            <div className="flex items-center gap-2 mb-5 anim-fade-in">
              <MapPin size={15} style={{ color: '#F5922E', flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                Huánuco, Perú — 2 sedes frente a la naturaleza
              </span>
            </div>

            {/* Título */}
            <h1 className="anim-fade-up delay-100" style={{
              fontSize: 'clamp(2.4rem, 6vw, 4.5rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.1,
              marginBottom: '1.25rem',
              margin: '0 0 1.25rem',
            }}>
              Hotel<br />
              <span style={{ color: '#F5922E', fontStyle: 'italic' }}>Brisas de Mayo</span>
            </h1>

            {/* Subtítulo */}
            <p className="anim-fade-up delay-200" style={{
              color: 'rgba(255,255,255,0.78)',
              fontSize: '1.05rem',
              maxWidth: 480,
              lineHeight: 1.7,
              margin: '0 0 2rem',
            }}>
              Vista panorámica a las{' '}
              <strong style={{ color: 'white' }}>Cascadas de Cabracancha</strong> y la{' '}
              <strong style={{ color: 'white' }}>Laguna de Mayo</strong>.
              Desayuno incluido, confort y naturaleza.
            </p>

            {/* CTAs */}
            <div className="anim-fade-up delay-300" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: 0 }}>
              <Link
                to="/register"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#F5922E', color: 'white',
                  fontWeight: 700, fontSize: '0.875rem',
                  padding: '0.85rem 1.75rem', borderRadius: 9999,
                  textDecoration: 'none', transition: 'background .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#E07820'}
                onMouseLeave={e => e.currentTarget.style.background = '#F5922E'}
              >
                <Calendar size={17} /> Reservar ahora
              </Link>

              <a
                href="#habitaciones"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  color: 'white', fontWeight: 600, fontSize: '0.875rem',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  padding: '0.85rem 1.75rem', borderRadius: 9999,
                  textDecoration: 'none', transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#F5922E'; e.currentTarget.style.color = '#F5922E' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = 'white' }}
              >
                Ver habitaciones
              </a>
            </div>

            {/* Stats rápidas */}
            <div className="anim-fade-up delay-400" style={{
              display: 'flex', flexWrap: 'wrap', gap: '2rem',
              marginTop: '2.5rem', paddingTop: '2rem',
              borderTop: '1px solid rgba(255,255,255,0.12)',
            }}>
              {[
                ['2', 'Sedes'],
                ['40+', 'Habitaciones'],
                ['Desde S/ 100', 'Por noche'],
                ['★ 4.8', 'Calificación'],
              ].map(([v, l]) => (
                <div key={l}>
                  <p style={{ color: '#F5922E', fontWeight: 700, fontSize: '1.2rem', lineHeight: 1, margin: 0 }}>{v}</p>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── SearchBar anclada al fondo — sobresale hacia abajo ─── */}
        <div style={{
          width: '100%',
          padding: '0 1.5rem',
          maxWidth: 1152,
          margin: '0 auto',
          /* Negativo: la mitad del SearchBar (≈56px) sobresale del hero */
          marginBottom: -56,
          position: 'relative',
          zIndex: 20,
        }}>
          <SearchBar />
        </div>

      </div>
    </section>
  )
}
