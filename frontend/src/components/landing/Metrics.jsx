import { BedDouble, Users, Star, MapPin } from 'lucide-react'

const METRICS = [
  { icon: BedDouble, value: '40+',    label: 'Habitaciones' },
  { icon: Users,     value: '5000+',  label: 'Huéspedes satisfechos' },
  { icon: Star,      value: '4.8',    label: 'Calificación promedio' },
  { icon: MapPin,    value: '2',      label: 'Sedes en Huánuco' },
]

const TESTIMONIALS = [
  {
    name: 'Patricia Ríos', origen: 'Lima', initials: 'PR', bg: 'bg-teal-100 text-teal-700',
    texto: 'La vista a la laguna es increíble. El desayuno estuvo delicioso y el agua caliente a cualquier hora. Volveremos pronto.',
    rating: 5,
  },
  {
    name: 'Jorge Menacho', origen: 'Huánuco', initials: 'JM', bg: 'bg-orange-100 text-brand-orange',
    texto: 'Fui a las cascadas de Cabracancha y me alojé en Brisas II. La habitación KIN con vista a las cascadas es espectacular.',
    rating: 5,
  },
  {
    name: 'Lucia Vargas', origen: 'Tingo María', initials: 'LV', bg: 'bg-green-100 text-green-700',
    texto: 'Excelente atención, pantuflas y termo de agua incluidos. Súper cómodo para visitar las cascadas con la familia.',
    rating: 5,
  },
]

export default function Metrics() {
  return (
    <>
      <section id="metricas" className="py-20 bg-brand-brown relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {METRICS.map(({ icon: Icon, value, label }, i) => (
              <div key={label} className={`flex flex-col items-center text-center gap-3 anim-fade-up delay-${(i+1)*100}`}>
                <div className="w-14 h-14 bg-brand-orange/20 rounded-2xl flex items-center justify-center">
                  <Icon size={26} className="text-brand-orange" />
                </div>
                <p className="text-4xl font-bold text-white">{value}</p>
                <p className="text-white/60 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-brand-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 anim-fade-up">
            <p className="text-brand-orange text-xs font-bold tracking-widest uppercase mb-3">Testimonios</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-brand-brown">Lo que dicen nuestros huéspedes</h2>
            <div className="w-16 h-1 bg-brand-orange mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name}
                className={`bg-white rounded-2xl p-7 border border-orange-100/50 card-hover shadow-sm anim-fade-up delay-${(i+1)*100}`}>
                <p className="text-5xl text-brand-orange/15 font-serif leading-none mb-1">"</p>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={13} fill="#F5922E" className="text-brand-orange" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">{t.texto}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${t.bg}`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-brand-brown text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.origen}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
