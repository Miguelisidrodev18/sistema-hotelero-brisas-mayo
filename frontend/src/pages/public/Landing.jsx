import Navbar        from '../../components/landing/Navbar'
import Hero          from '../../components/landing/Hero'
import Benefits      from '../../components/landing/Benefits'
import Sedes         from '../../components/landing/Sedes'
import FeaturedRooms from '../../components/landing/FeaturedRooms'
import Metrics       from '../../components/landing/Metrics'
import Footer        from '../../components/landing/Footer'

/*
  Estructura:
  ┌─────────────────────────────────────┐
  │  HERO  (min-h: 100vh)               │
  │                                     │
  │  título / subtítulo / CTAs          │
  │                                     │
  │  ┌───────────────────────────────┐  │  ← SearchBar dentro del hero
  └──┤      SEARCH BAR              ├──┘    con marginBottom: -52px
     └───────────────────────────────┘      sobresale 52px fuera del hero
  ┌─────────────────────────────────────┐
  │  pt-[80px] compensa el overlap      │  ← Benefits empieza aquí
  │  Benefits / Sedes / Rooms / ...     │
  └─────────────────────────────────────┘
*/
export default function Landing() {
  return (
    <div style={{ width: '100%' }}>
      <Navbar />
      <Hero />   {/* SearchBar ya está dentro con -mb-52px */}

      {/* pt compensa el SearchBar que sobresale 52px + margen de respiro */}
      {/* pt = 56px overlap del SearchBar + 32px de respiro */}
      <div style={{ paddingTop: 88 }}>
        <Benefits />
        <Sedes />
        <FeaturedRooms />
        <Metrics />
        <Footer />
      </div>
    </div>
  )
}
