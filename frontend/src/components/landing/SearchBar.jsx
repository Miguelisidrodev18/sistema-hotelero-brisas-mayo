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

  const labelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: '0.6rem',
    fontWeight: 700,
    color: '#F5922E',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  }

  const inputStyle = {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#3D1A06',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
  }

  return (
    <div className="anim-scale-in delay-600" style={{
      width: '100%',
      background: 'white',
      borderRadius: 20,
      boxShadow: '0 25px 80px rgba(30,13,3,0.18), 0 8px 24px rgba(30,13,3,0.1), 0 0 0 1px rgba(245,146,46,0.06)',
      overflow: 'hidden',
      border: '1px solid rgba(245,146,46,0.1)',
    }}>
      <form
        onSubmit={e => { e.preventDefault(); navigate('/register') }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
      >
        {/* Fecha de entrada */}
        <label className="flex flex-col gap-1 px-5 py-4 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer hover:bg-brand-cream/50 transition-colors">
          <span style={labelStyle}>
            <CalendarDays size={11} /> Fecha de entrada
          </span>
          <input type="date" name="entrada" value={form.entrada}
            onChange={handle} min={today} style={inputStyle} />
        </label>

        {/* Fecha de salida */}
        <label className="flex flex-col gap-1 px-5 py-4 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer hover:bg-brand-cream/50 transition-colors">
          <span style={labelStyle}>
            <CalendarDays size={11} /> Fecha de salida
          </span>
          <input type="date" name="salida" value={form.salida}
            onChange={handle} min={form.entrada} style={inputStyle} />
        </label>

        {/* Huéspedes */}
        <label className="flex flex-col gap-1 px-5 py-4 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer hover:bg-brand-cream/50 transition-colors">
          <span style={labelStyle}>
            <Users size={11} /> Huéspedes
          </span>
          <select name="huespedes" value={form.huespedes} onChange={handle} style={inputStyle}>
            {['1 persona','2 personas','3 personas','4 personas','Familia'].map(o => <option key={o}>{o}</option>)}
          </select>
        </label>

        {/* Sede */}
        <label className="flex flex-col gap-1 px-5 py-4 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer hover:bg-brand-cream/50 transition-colors">
          <span style={labelStyle}>
            <BedDouble size={11} /> Sede
          </span>
          <select name="sede" value={form.sede} onChange={handle} style={inputStyle}>
            {['Cualquier sede','Brisas I — Laguna','Brisas II — Cascadas'].map(o => <option key={o}>{o}</option>)}
          </select>
        </label>

        {/* Botón */}
        <button type="submit"
          className="btn-glow"
          style={{
            background: 'linear-gradient(135deg, #F5922E, #E07820)',
            color: 'white',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '18px 24px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          <Search size={16} />
          Buscar
        </button>
      </form>
    </div>
  )
}
