import Navbar        from '../../components/landing/Navbar'
import Hero          from '../../components/landing/Hero'
import SearchBar     from '../../components/landing/SearchBar'
import Benefits      from '../../components/landing/Benefits'
import Sedes         from '../../components/landing/Sedes'
import FeaturedRooms from '../../components/landing/FeaturedRooms'
import Metrics       from '../../components/landing/Metrics'
import Footer        from '../../components/landing/Footer'

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />

      {/* ─── Hero + SearchBar flotante ─────────────────────────────── */}
      {/*
        El wrapper tiene `relative` y el hero ocupa h-screen.
        La SearchBar está absolute en bottom-0 con translate-y-1/2,
        quedando mitad dentro del hero y mitad fuera → efecto flotante.
        El contenido de abajo tiene pt suficiente para no quedar tapado.
      */}
      <div className="relative">
        <Hero />

        {/* SearchBar flotante: bottom-0 + translate-y-1/2 = flota entre secciones */}
        <div className="absolute bottom-0 left-0 right-0 z-30
                        px-4 sm:px-8 lg:px-12
                        translate-y-1/2">
          <div className="max-w-6xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </div>

      {/* Espacio para compensar la mitad del SearchBar que sobresale */}
      <div className="h-[70px] sm:h-[60px] bg-white" />

      {/* ─── Secciones ─────────────────────────────────────────────── */}
      <Benefits />
      <Sedes />
      <FeaturedRooms />
      <Metrics />
      <Footer />
    </div>
  )
}
