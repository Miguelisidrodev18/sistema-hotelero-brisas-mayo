import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Phone } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Inicio',       href: '#inicio' },
  { label: 'Habitaciones', href: '#habitaciones' },
  { label: 'Servicios',    href: '#beneficios' },
  { label: 'Nosotros',     href: '#metricas' },
  { label: 'Contacto',     href: '#footer' },
]

export default function Navbar() {
  const [open,     setOpen]     = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-brand-brown shadow-lg shadow-brand-dark/40'
        : 'bg-gradient-to-b from-brand-dark/80 to-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo real del hotel */}
          <a href="#inicio" className="flex items-center gap-3 shrink-0">
            <img
              src="/images/Logo-hotel.jpeg"
              alt="Hotel Brisas de Mayo"
              className="h-14 w-auto object-contain rounded-sm drop-shadow-md"
            />
          </a>

          {/* Links desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href}
                className="text-white/90 hover:text-brand-orange text-sm font-medium transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          {/* Acciones */}
          <div className="hidden md:flex items-center gap-4">
            <a href="tel:+51999123456"
              className="flex items-center gap-1.5 text-white/80 text-sm hover:text-brand-orange transition-colors">
              <Phone size={14} />
              +51 999 123 456
            </a>
            <Link to="/login"
              className="bg-brand-orange hover:bg-brand-orange2 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all hover:scale-105 shadow">
              Iniciar sesión
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setOpen(!open)}
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menú */}
      {open && (
        <div className="md:hidden bg-brand-brown border-t border-brand-orange/20 px-4 py-4 flex flex-col gap-3">
          {NAV_LINKS.map(l => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}
              className="text-white/90 hover:text-brand-orange py-2 text-sm font-medium border-b border-white/5 transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/login" onClick={() => setOpen(false)}
            className="mt-2 bg-brand-orange text-white font-semibold text-sm px-5 py-2.5 rounded-full text-center">
            Iniciar sesión
          </Link>
        </div>
      )}
    </header>
  )
}
