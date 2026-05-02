import { Link } from 'react-router-dom'
import { Users, Eye, Star, BedDouble } from 'lucide-react'

const ROOMS = [
  {
    sede: 'Sede I — Laguna',
    name: 'Matrimonial Queen',
    tipo: 'Cama queen · Vista directa a la laguna',
    precio: 150,
    capacidad: 2,
    vista: 'Laguna de Mayo',
    rating: 4.9,
    gradient: 'from-teal-600 to-teal-900',
    badge: 'Vista a la laguna',
    badgeBg: 'bg-teal-500',
    delay: 'delay-100',
  },
  {
    sede: 'Sede II — Cascadas',
    name: 'Matrimonial KIN',
    tipo: 'Cama king · Vista a las cascadas',
    precio: 300,
    capacidad: 2,
    vista: 'Cascadas Cabracancha',
    rating: 5.0,
    gradient: 'from-brand-wood to-brand-brown',
    badge: 'Más popular',
    badgeBg: 'bg-brand-orange',
    delay: 'delay-200',
  },
  {
    sede: 'Sede II — Cascadas',
    name: 'Matrimonial + Adicional',
    tipo: 'Cama matrimonial + cama extra · Vista cascadas',
    precio: 250,
    capacidad: 3,
    vista: 'Cascadas Cabracancha',
    rating: 4.8,
    gradient: 'from-amber-700 to-amber-950',
    badge: 'Para familias',
    badgeBg: 'bg-amber-500',
    delay: 'delay-300',
  },
]

export default function FeaturedRooms() {
  return (
    <section id="habitaciones" className="w-full py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16 anim-fade-up">
          <p className="text-brand-orange text-xs font-bold tracking-widest uppercase mb-3">Habitaciones destacadas</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-brown">Elige tu espacio perfecto</h2>
          <div className="w-16 h-1 bg-brand-orange mx-auto mt-4 rounded-full" />
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
            Todas las habitaciones incluyen desayuno, baño privado con agua caliente y televisión.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {ROOMS.map((room) => (
            <article key={room.name}
              className={`card-hover rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white anim-fade-up ${room.delay}`}>

              {/* Imagen placeholder con gradiente */}
              <div className={`relative h-52 bg-gradient-to-br ${room.gradient}`}>
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,.5) 0%, transparent 60%)' }} />

                <span className={`absolute top-4 left-4 ${room.badgeBg} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                  {room.badge}
                </span>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-white/70 text-xs bg-black/20 px-2 py-1 rounded-full">{room.sede}</span>
                  <span className="flex items-center gap-1 text-white text-sm font-semibold">
                    <Star size={13} fill="#F5922E" className="text-brand-orange" /> {room.rating}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-bold text-brand-brown text-lg mb-1">{room.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{room.tipo}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-5 pb-4 border-b border-gray-100">
                  <span className="flex items-center gap-1.5"><Users size={13} /> {room.capacidad} pers.</span>
                  <span className="flex items-center gap-1.5"><Eye size={13} /> {room.vista}</span>
                  <span className="flex items-center gap-1.5"><BedDouble size={13} /></span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-brand-brown">S/ {room.precio}</span>
                    <span className="text-gray-400 text-xs"> / noche</span>
                  </div>
                  <Link to="/register"
                    className="bg-brand-orange hover:bg-brand-orange2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105">
                    Reservar
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/register"
            className="inline-flex items-center gap-2 border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white font-bold px-8 py-3 rounded-full transition-all text-sm">
            Ver todas las habitaciones →
          </Link>
        </div>
      </div>
    </section>
  )
}
