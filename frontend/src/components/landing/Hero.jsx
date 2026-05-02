import { Link } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'

export default function Hero() {
  return (
    <section id="inicio" className="relative w-full h-screen min-h-[600px] flex flex-col justify-center overflow-hidden">

      {/* ── Video de fondo ── */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="/images/Logo-hotel.jpeg"
      >
        <source src="/images/video-hotel.mp4" type="video/mp4" />
      </video>

      {/* ── Overlays ── */}
      {/* Oscurecimiento general */}
      <div className="absolute inset-0 bg-black/55" />
      {/* Gradiente desde izquierda para legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/80 via-brand-dark/40 to-transparent" />
      {/* Degradado hacia abajo para que la SearchBar flote suavemente */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />

      {/* ── Contenido ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Ubicación */}
        <div className="flex items-center gap-2 mb-5 anim-fade-in">
          <MapPin size={15} className="text-brand-orange" />
          <span className="text-white/80 text-sm tracking-wide">
            Huánuco, Perú — 2 sedes frente a la naturaleza
          </span>
        </div>

        {/* Título */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] mb-6 anim-fade-up delay-100">
          Hotel<br />
          <span className="text-brand-orange italic">Brisas de Mayo</span>
        </h1>

        {/* Subtítulo */}
        <p className="text-white/80 text-lg max-w-lg mb-10 leading-relaxed anim-fade-up delay-200">
          Vista panorámica a las <strong className="text-white">Cascadas de Cabracancha</strong> y la{' '}
          <strong className="text-white">Laguna de Mayo</strong>. Desayuno incluido, confort y naturaleza.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 anim-fade-up delay-300">
          <Link to="/register"
            className="inline-flex items-center gap-2 bg-brand-orange hover:bg-brand-orange2 text-white font-bold px-8 py-4 rounded-full transition-all hover:scale-105 shadow-lg shadow-brand-orange/30 text-sm">
            <Calendar size={17} />
            Reservar ahora
          </Link>
          <a href="#habitaciones"
            className="inline-flex items-center gap-2 text-white border border-white/50 hover:border-brand-orange hover:text-brand-orange px-8 py-4 rounded-full transition-all text-sm">
            Ver habitaciones
          </a>
        </div>

        {/* Stats rápidos */}
        <div className="flex flex-wrap gap-8 mt-14 pt-8 border-t border-white/15 anim-fade-up delay-400">
          {[
            ['2', 'Sedes'],
            ['40+', 'Habitaciones'],
            ['Desde S/ 100', 'Por noche'],
            ['★ 4.8', 'Calificación'],
          ].map(([v, l]) => (
            <div key={l} className="flex flex-col gap-0.5">
              <span className="text-brand-orange font-bold text-xl leading-none">{v}</span>
              <span className="text-white/60 text-xs uppercase tracking-wider">{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Indicador scroll ── */}
      <div className="absolute bottom-28 right-8 hidden lg:flex flex-col items-center gap-2 anim-float">
        <div className="w-5 h-9 border-2 border-white/30 rounded-full flex items-start justify-center p-1.5">
          <div className="w-1 h-2.5 bg-brand-orange rounded-full anim-pulse" />
        </div>
      </div>
    </section>
  )
}
