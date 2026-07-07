/** Fecha local YYYY-MM-DD (zona del navegador / finca en Colombia). */
export function isoLocal(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function hoyLocal() {
  return isoLocal(new Date())
}

export function fechaInput(valor) {
  return valor ? String(valor).split('T')[0] : hoyLocal()
}
