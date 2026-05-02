import { Link } from 'react-router-dom'
import { MapPin, Coffee, Droplets, Tv, Star, Car } from 'lucide-react'

const SEDES = [
  {
    num: 'I',
    nombre: 'Hospedaje Brisas de Mayo I',
    subtitulo: 'Vista panorámica a la Laguna de Mayo',
    descripcion: 'Rodeado de naturaleza y con acceso directo a la hermosa laguna. Ideal para familias y parejas que buscan tranquilidad.',
    desde: 100,
    habitaciones: 12,
    incluye: ['Desayuno incluido', 'Baño privado agua caliente', 'Televisión'],
    cochera: 'Cochera municipal a 20 m',
    gradient: 'from-teal-700 to-teal-900',
    accent: 'bg-teal-500',
    delay: 'delay-100',
  },
  {
    num: 'II',
    nombre: 'Hotel Brisas de Mayo II',
    subtitulo: 'Vista panorámica a las Cascadas de Cabracancha',
    descripcion: 'Nuestro hotel principal con 4 pisos y vistas únicas a las impresionantes cascadas de Cabracancha.',
    desde: 140,
    habitaciones: 28,
    incluye: ['Desayuno incluido', 'Baño privado agua caliente', 'Televisión', '2 botellas de agua', 'Termo + pantuflas'],
    cochera: 'Cochera privada — capacidad 10 vehículos',
    gradient: 'from-brand-wood to-brand-brown',
    accent: 'bg-brand-orange',
    delay: 'delay-200',
  },
]

const AMENITY_ICONS = {
  'Desayuno incluido': Coffee,
  'Baño privado agua caliente': Droplets,
  'Televisión': Tv,
  '2 botellas de agua': Droplets,
  'Termo + pantuflas': Star,
}

export default function Sedes() {
  return (
    <section id="sedes" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16 anim-fade-up">
          <p className="text-brand-orange text-xs font-bold tracking-widest uppercase mb-3">Nuestras sedes</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-brown">
            Dos destinos, una experiencia única
          </h2>
          <div className="w-16 h-1 bg-brand-orange mx-auto mt-4 rounded-full" />
          <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
            Elige entre nuestra hospedaje junto a la laguna o nuestro hotel frente a las cascadas de Cabracancha, ambos en Huánuco, Perú.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {SEDES.map((sede) => (
            <div key={sede.num}
              className={`card-hover rounded-3xl overflow-hidden shadow-lg border border-gray-100 anim-fade-up ${sede.delay}`}>

              {/* Cabecera con gradiente */}
              <div className={`relative h-48 bg-gradient-to-br ${sede.gradient} p-6 flex flex-col justify-between`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-block ${sede.accent} text-white text-xs font-bold px-3 py-1 rounded-full mb-2`}>
                      SEDE {sede.num}
                    </span>
                    <h3 className="text-white font-bold text-lg leading-tight">{sede.nombre}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs">Desde</p>
                    <p className="text-white font-bold text-2xl">S/ {sede.desde}</p>
                    <p className="text-white/70 text-xs">/ noche</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <MapPin size={13} className="text-brand-gold shrink-0" />
                  <span>{sede.subtitulo}</span>
                </div>

                {/* Decorativo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
              </div>

              {/* Cuerpo */}
              <div className="bg-white p-6">
                <p className="text-gray-500 text-sm leading-relaxed mb-5">{sede.descripcion}</p>

                {/* Incluye */}
                <p className="text-xs font-bold text-brand-brown uppercase tracking-wide mb-3">Incluye</p>
                <ul className="flex flex-col gap-2 mb-5">
                  {sede.incluye.map((item) => {
                    const Icon = AMENITY_ICONS[item] || Star
                    return (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon size={13} className="text-brand-orange shrink-0" />
                        {item}
                      </li>
                    )
                  })}
                </ul>

                {/* Cochera */}
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 mb-5">
                  <Car size={13} className="text-brand-orange shrink-0" />
                  {sede.cochera}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-400">{sede.habitaciones} habitaciones disponibles</span>
                  <Link to="/register"
                    className="bg-brand-orange hover:bg-brand-orange2 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105">
                    Ver habitaciones →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
