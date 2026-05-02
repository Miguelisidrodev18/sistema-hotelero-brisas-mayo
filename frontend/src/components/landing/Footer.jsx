import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'

const SocialIcons = {
  Facebook: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  Instagram: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
}

const LINKS = {
  Hotel: [
    { label: 'Habitaciones',   href: '#habitaciones' },
    { label: 'Servicios',      href: '#beneficios' },
    { label: 'Promociones',    href: '#' },
    { label: 'Nosotros',       href: '#metricas' },
  ],
  Reservas: [
    { label: 'Reservar ahora', href: '/register' },
    { label: 'Iniciar sesión', href: '/login' },
    { label: 'Cancelaciones',  href: '#' },
    { label: 'FAQ',            href: '#' },
  ],
}

export default function Footer() {
  return (
    <footer id="footer" className="w-full bg-brand-dark text-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">

          {/* Brand con logo */}
          <div className="lg:col-span-1">
            <img src="/images/Logo-hotel.jpeg" alt="Brisas de Mayo"
              className="h-16 w-auto object-contain mb-4 rounded opacity-90" />
            <p className="text-sm leading-relaxed mb-5">
              Experiencias únicas frente al mar. Tu descanso es nuestra prioridad desde 2010.
            </p>
            <div className="flex gap-3">
              {[SocialIcons.Facebook, SocialIcons.Instagram, SocialIcons.X].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-9 h-9 bg-white/5 hover:bg-brand-orange hover:text-white text-white/60 rounded-full flex items-center justify-center transition-all">
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(LINKS).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wide">{section}</h4>
              <ul className="flex flex-col gap-3">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    {href.startsWith('/') ? (
                      <Link to={href} className="text-sm hover:text-brand-orange transition-colors">{label}</Link>
                    ) : (
                      <a href={href} className="text-sm hover:text-brand-orange transition-colors">{label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contacto */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wide">Contacto</h4>
            <ul className="flex flex-col gap-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-brand-orange mt-0.5 shrink-0" />
                Av. Costa Verde 123, Sede Principal
              </li>
              <li className="flex items-center gap-3">
                <Phone size={15} className="text-brand-orange shrink-0" />
                +51 999 123 456
              </li>
              <li className="flex items-center gap-3">
                <Mail size={15} className="text-brand-orange shrink-0" />
                contacto@brisasdmayo.com
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/30">
          <p>© {new Date().getFullYear()} Hotel Brisas de Mayo. Todos los derechos reservados.</p>
          <p>Desarrollado con React + Laravel</p>
        </div>
      </div>
    </footer>
  )
}
