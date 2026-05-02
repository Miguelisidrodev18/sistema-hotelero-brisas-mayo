import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Users, BedDouble, Search } from 'lucide-react'

export default function SearchBar() {
  const navigate = useNavigate()
  const today    = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [form, setForm] = useState({
    entrada: today, salida: tomorrow,
    huespedes: '2 adultos', sede: 'Cualquier sede',
  })
  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    /* Tarjeta que flota entre el hero y el contenido */
    <div className="w-full bg-white rounded-2xl shadow-2xl shadow-brand-dark/30 overflow-hidden border border-orange-100/40">
      <form
        onSubmit={e => { e.preventDefault(); navigate('/register') }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
      >
        {/* Campo genérico */}
        {[
          {
            name: 'entrada', label: 'Fecha de entrada', icon: CalendarDays,
            type: 'date', value: form.entrada, extra: { min: today },
          },
          {
            name: 'salida', label: 'Fecha de salida', icon: CalendarDays,
            type: 'date', value: form.salida, extra: { min: form.entrada },
          },
        ].map(({ name, label, icon: Icon, type, value, extra }) => (
          <label key={name}
            className="flex flex-col gap-1 px-5 py-4 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer hover:bg-brand-cream/50 transition-colors">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand-orange uppercase tracking-widest">
              <Icon size={11} /> {label}
            </span>
            <input type={type} name={name} value={value} onChange={handle} {...extra}
              className="text-sm font-semibold text-brand-brown bg-transparent focus:outline-none cursor-pointer" />
          </label>
        ))}

        {/* Huéspedes */}
        <label className="flex flex-col gap-1 px-5 py-4 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer hover:bg-brand-cream/50 transition-colors">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand-orange uppercase tracking-widest">
            <Users size={11} /> Huéspedes
          </span>
          <select name="huespedes" value={form.huespedes} onChange={handle}
            className="text-sm font-semibold text-brand-brown bg-transparent focus:outline-none cursor-pointer">
            {['1 persona','2 personas','3 personas','4 personas','Familia'].map(o => <option key={o}>{o}</option>)}
          </select>
        </label>

        {/* Sede */}
        <label className="flex flex-col gap-1 px-5 py-4 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer hover:bg-brand-cream/50 transition-colors">
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-brand-orange uppercase tracking-widest">
            <BedDouble size={11} /> Sede
          </span>
          <select name="sede" value={form.sede} onChange={handle}
            className="text-sm font-semibold text-brand-brown bg-transparent focus:outline-none cursor-pointer">
            {['Cualquier sede','Brisas I — Laguna','Brisas II — Cascadas'].map(o => <option key={o}>{o}</option>)}
          </select>
        </label>

        {/* Botón */}
        <button type="submit"
          className="bg-brand-orange hover:bg-brand-orange2 text-white font-bold flex items-center justify-center gap-2 py-5 px-6 transition-colors text-sm">
          <Search size={16} />
          Buscar disponibilidad
        </button>
      </form>
    </div>
  )
}
