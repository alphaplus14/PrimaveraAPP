export const STOCK_BAJO_UMBRAL = 5
export const ICONO_OJO = '/assets/icons/ojo%20icon.png'

/** Paleta inspirada en Flux Dashboard (dashboardpack) */
export const FLUX = {
  purple: '#6366F1',
  purpleDark: '#5C27FE',
  cyan: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  lavender: '#F3F0FF',
  bg: '#F8F9FA',
}

export const formatCOP = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    Number(valor) || 0,
  )

export function formatFechaCorta(valor) {
  const d = parseFechaNegocio(valor)
  if (!d) return '—'
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const formatKg = (valor) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(Number(valor) || 0) + ' kg'

/** Fecha de negocio (solo día) sin problemas de zona horaria ni ISO largo de Laravel */
export function parseFechaNegocio(valor) {
  if (!valor) return null
  const str = String(valor)
  const soloFecha = str.slice(0, 10)
  const [y, m, d] = soloFecha.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d, 12, 0, 0)
}

export function inicioSemana(fecha) {
  const d = parseFechaNegocio(fecha) ?? new Date(fecha)
  d.setHours(12, 0, 0, 0)
  const diff = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - diff)
  return d
}

export function agruparVentasPorSemana(ventas, numSemanas = 8) {
  const hoy = new Date()
  const lunesActual = inicioSemana(hoy)
  const semanas = []

  for (let i = numSemanas - 1; i >= 0; i--) {
    const inicio = new Date(lunesActual)
    inicio.setDate(lunesActual.getDate() - i * 7)
    inicio.setHours(0, 0, 0, 0)
    const fin = new Date(inicio)
    fin.setDate(inicio.getDate() + 6)
    fin.setHours(23, 59, 59, 999)
    semanas.push({ inicio, fin, total: 0 })
  }

  ;(ventas ?? []).forEach((v) => {
    const d = parseFechaNegocio(v.date)
    if (!d) return
    const bucket = semanas.find((s) => d >= s.inicio && d <= s.fin)
    if (bucket) bucket.total += Number(v.total)
  })

  return semanas.map((s) => ({
    label: s.inicio.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
    total: s.total,
  }))
}

export function filtrarStockBajo(inventario, umbral = STOCK_BAJO_UMBRAL) {
  return [...(inventario ?? [])]
    .filter((i) => Number(i.quantity_kg) < umbral)
    .sort((a, b) => Number(a.quantity_kg) - Number(b.quantity_kg))
}

export function tiempoRelativo(fechaISO) {
  if (!fechaISO) return ''
  const fecha = parseFechaNegocio(fechaISO)
  if (!fecha) return ''
  const ahora = new Date()
  const diffMin = Math.floor((ahora - fecha) / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}
