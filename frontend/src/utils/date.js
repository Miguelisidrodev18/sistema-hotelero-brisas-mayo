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
