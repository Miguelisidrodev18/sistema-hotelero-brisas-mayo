import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Coffee, Droplets, Tv, Star, Car } from 'lucide-react'
import RevealSection from '../ui/RevealSection'
import { sedesApi } from '../../api/sedes'

const GRADIENTS = [
  'linear-gradient(135deg, #0f766e 0%, #134e4a 100%)',
  'linear-gradient(135deg, #7B4019 0%, #3D1A06 100%)',
  'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)',
]
const ACCENTS = ['#14b8a6', '#F5922E', '#3b82f6']

const INCLUYE_FIJO = ['Desayuno incluido', 'Baño privado agua caliente', 'Televisión']
const AMENITY_ICONS = {
  'Desayuno incluido':         Coffee,
  'Baño privado agua caliente': Droplets,
  'Televisión':                Tv,
  '2 botellas de agua':        Droplets,
  'Termo + pantuflas':         Star,
}

export default function Sedes() {
  const [sedes, setSedes] = useState([])

  useEffect(() => {
    sedesApi.getPublicas()
      .then(r => setSedes(r.data))
      .catch(() => {})
  }, [])

  return (
    <section id="sedes" style={{ width: '100%', padding: '96px 0', background: 'white' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>

        <RevealSection style={{ textAlign: 'center', marginBottom: 64 }}>
          <p style={{ color: '#F5922E', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
            Nuestras sedes
          </p>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, color: '#3D1A06', margin: 0 }}>
            Dos destinos, una experiencia única
          </h2>
          <div className="section-divider" />
          <p style={{ color: '#6b7280', marginTop: 16, maxWidth: 560, marginLeft: 'auto', marginRight: 'auto', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Elige entre nuestro hospedaje junto a la laguna o nuestro hotel frente a las cascadas de Cabracancha, ambos en Huancaya, Yauyos.
          </p>
        </RevealSection>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 32 }}>
          {sedes.map((sede, i) => {
            const gradient = GRADIENTS[i % GRADIENTS.length]
            const accent   = ACCENTS[i % ACCENTS.length]
            const disponibles = sede.habitaciones_disponibles ?? 0

            return (
              <RevealSection key={sede.id} direction={i % 2 === 0 ? 'left' : 'right'}>
                <div className="card-hover" style={{ borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 32px rgba(61,26,6,0.08)', border: '1px solid rgba(0,0,0,0.05)', background: 'white' }}>

                  {/* Cabecera */}
                  <div style={{ position: 'relative', height: 200, background: sede.vista_principal ? '#3D1A06' : gradient, padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
                    {sede.vista_principal && (
                      <img src={sede.vista_principal} alt={sede.nombre}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
                        onError={e => e.target.style.display = 'none'}/>
                    )}
                    <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }}/>
                    <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
                      <div>
                        <span style={{ display: 'inline-block', background: accent, color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '5px 14px', borderRadius: 9999, marginBottom: 8, letterSpacing: '0.05em' }}>
                          SEDE {i + 1}
                        </span>
                        <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.3, margin: 0, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}>
                          {sede.nombre}
                        </h3>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem', position: 'relative' }}>
                      <MapPin size={13} style={{ color: '#D4A843', flexShrink: 0 }}/>
                      <span>{sede.ciudad ?? 'Huancaya, Yauyos'}</span>
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div style={{ padding: 24 }}>
                    {sede.descripcion && (
                      <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.7, marginBottom: 20 }}>
                        {sede.descripcion}
                      </p>
                    )}

                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3D1A06', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Incluye</p>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, padding: 0 }}>
                      {INCLUYE_FIJO.map(item => {
                        const Icon = AMENITY_ICONS[item] || Star
                        return (
                          <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#4b5563' }}>
                            <Icon size={13} style={{ color: '#F5922E', flexShrink: 0 }}/> {item}
                          </li>
                        )
                      })}
                    </ul>

                    {sede.telefono && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#9ca3af', background: '#f9fafb', borderRadius: 12, padding: '8px 14px', marginBottom: 20 }}>
                        <Car size={13} style={{ color: '#F5922E', flexShrink: 0 }}/>
                        {sede.telefono}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                      <span style={{ fontSize: '0.8rem', color: disponibles > 0 ? '#059669' : '#9ca3af', fontWeight: disponibles > 0 ? 600 : 400 }}>
                        {disponibles > 0 ? `${disponibles} habitación${disponibles !== 1 ? 'es' : ''} disponible${disponibles !== 1 ? 's' : ''}` : 'Sin disponibilidad'}
                      </span>
                      <Link
                        to={`/habitaciones?sede=${sede.slug}`}
                        className="btn-glow"
                        style={{ background: 'linear-gradient(135deg, #F5922E, #E07820)', color: 'white', fontSize: '0.8rem', fontWeight: 700, padding: '10px 20px', borderRadius: 14, textDecoration: 'none' }}
                      >
                        Ver habitaciones →
                      </Link>
                    </div>
                  </div>
                </div>
              </RevealSection>
            )
          })}
        </div>
      </div>
    </section>
  )
}
