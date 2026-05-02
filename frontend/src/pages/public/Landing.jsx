import Navbar        from '../../components/landing/Navbar'
import Hero          from '../../components/landing/Hero'
import SearchBar     from '../../components/landing/SearchBar'
import Benefits      from '../../components/landing/Benefits'
import Sedes         from '../../components/landing/Sedes'
import FeaturedRooms from '../../components/landing/FeaturedRooms'
import Metrics       from '../../components/landing/Metrics'
import Footer        from '../../components/landing/Footer'

/*
  Layout:
  ┌────────────────────┐  ← Hero (h-screen, video bg)
  │                    │
  │   Título + CTAs    │
  │                    │
  │  ┌──────────────┐  │  ← SearchBar: -mt saca la mitad fuera del Hero
  └──┤  SEARCHBAR   ├──┘
     └──────────────┘      el -mt-10 en el wrapper lo superpone al Hero
  ┌────────────────────┐  ← pt-10 en Benefits compensa el overlap
  │   Benefits …       │
*/
export default function Landing() {
  return (
    <div className="w-full">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────── */}
      <Hero />

      {/* ── SearchBar flotante (negative-margin approach) ── */}
      {/* -mt sube el SearchBar para que solape el borde del Hero */}
      <div className="relative z-30 -mt-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <SearchBar />
        </div>
      </div>

      {/* ── Secciones (pt compensa el overlap del SearchBar) ── */}
      <div className="pt-10">
        <Benefits />
        <Sedes />
        <FeaturedRooms />
        <Metrics />
        <Footer />
      </div>
    </div>
  )
}
