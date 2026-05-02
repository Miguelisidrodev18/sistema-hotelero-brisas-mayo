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
    <div style={{ width: '100%' }}>
      <Navbar />
      <Hero />

      {/* ─── SearchBar flotante — se superpone entre hero y Benefits ─── */}
      {/* Desktop: flota sobre el límite hero/benefits con efecto elevado */}
      <div className="hidden lg:block" style={{
        position: 'relative',
        zIndex: 30,
        marginTop: -72,
        marginBottom: 12,
      }}>
        <div className="anim-float-subtle" style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 2rem',
        }}>
          <SearchBar />
        </div>
      </div>

      {/* Mobile/tablet: SearchBar inline debajo del hero */}
      <div className="lg:hidden" style={{ padding: '16px 1rem 0' }}>
        <SearchBar />
      </div>
      <div style={{ paddingTop: 16 }} className="lg:hidden" />

      <Benefits />
      <Sedes />
      <FeaturedRooms />
      <Metrics />
      <Footer />
    </div>
  )
}
