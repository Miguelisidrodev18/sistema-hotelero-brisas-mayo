// Fecha local en formato YYYY-MM-DD (evita el bug de usar toISOString(),
// que convierte a UTC y adelanta el día una vez pasadas las 19:00 en Perú/UTC-5).
export function toLocalYMD(date = new Date()) {
  const y   = date.getFullYear()
  const m   = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayLocal() {
  return toLocalYMD(new Date())
}

// Lunes de la semana actual (en local, no UTC)
export function startOfWeekLocal(date = new Date()) {
  const d = new Date(date)
  const dow = d.getDay() // 0=domingo..6=sábado
  const diff = dow === 0 ? -6 : 1 - dow // retrocede hasta el lunes
  d.setDate(d.getDate() + diff)
  return toLocalYMD(d)
}

// Día 1 del mes actual (en local, no UTC)
export function startOfMonthLocal(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1)
  return toLocalYMD(d)
}
