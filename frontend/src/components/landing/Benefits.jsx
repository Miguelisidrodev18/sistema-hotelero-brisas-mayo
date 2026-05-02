import { Waves, Coffee, Droplets, ShieldCheck, Car, Tv } from 'lucide-react'

const BENEFITS = [
  {
    icon: Waves,
    bg: 'bg-teal-50', color: 'text-teal-600', border: 'border-teal-100',
    title: 'Vista a cascadas y laguna',
    desc: 'Habitaciones con vista directa a las Cascadas de Cabracancha o la Laguna de Mayo.',
    delay: 'delay-100',
  },
  {
    icon: Coffee,
    bg: 'bg-amber-50', color: 'text-amber-600', border: 'border-amber-100',
    title: 'Desayuno incluido',
    desc: 'Todas las habitaciones incluyen desayuno. Empieza el día con energía en medio de la naturaleza.',
    delay: 'delay-200',
  },
  {
    icon: Droplets,
    bg: 'bg-blue-50', color: 'text-blue-500', border: 'border-blue-100',
    title: 'Baño privado agua caliente',
    desc: 'Agua tibia caliente disponible las 24 horas en tu baño privado.',
    delay: 'delay-300',
  },
  {
    icon: ShieldCheck,
    bg: 'bg-green-50', color: 'text-green-600', border: 'border-green-100',
    title: 'Reserva segura',
    desc: 'Confirmación inmediata online. Aceptamos pago en soles y dólares al tipo de cambio del día.',
    delay: 'delay-400',
  },
]

export default function Benefits() {
  return (
    <section id="beneficios" className="py-24 bg-brand-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-16 anim-fade-up">
          <p className="text-brand-orange text-xs font-bold tracking-widest uppercase mb-3">¿Por qué elegirnos?</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-brand-brown">
            Todo lo que necesitas para descansar
          </h2>
          <div className="w-16 h-1 bg-brand-orange mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BENEFITS.map(({ icon: Icon, bg, color, border, title, desc, delay }) => (
            <div key={title}
              className={`bg-white rounded-2xl p-7 card-hover border ${border} flex flex-col gap-4 anim-fade-up ${delay}`}>
              <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center`}>
                <Icon size={26} className={color} />
              </div>
              <div>
                <h3 className="font-bold text-brand-brown mb-2 leading-snug">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
