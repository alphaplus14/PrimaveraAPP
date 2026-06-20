import client from './client'

// Usado por Dashboard
export const getResumenHoy = () => {
  const hoy = new Date().toISOString().split('T')[0]
  return Promise.all([
    client.get('/ventas',    { params: { desde: hoy, hasta: hoy } }),
    client.get('/compras',   { params: { desde: hoy, hasta: hoy } }),
    client.get('/inventario'),
    client.get('/productos'),
  ])
}

export const getReporteVentas      = (params) => client.get('/reportes/ventas', { params })
export const getReporteCompras     = (params) => client.get('/reportes/compras', { params })
export const getReporteMovimientos = (params) => client.get('/reportes/movimientos', { params })
export const getReporteInventario  = ()        => client.get('/reportes/inventario')

// Helpers de fecha
export const formatFecha = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })

export const rangoPreset = (preset) => {
  const hoy = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

  switch (preset) {
    case 'hoy':
      return { desde: iso(hoy), hasta: iso(hoy) }
    case 'semana': {
      const lunes = new Date(hoy)
      lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7))
      return { desde: iso(lunes), hasta: iso(hoy) }
    }
    case 'mes': {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      return { desde: iso(inicio), hasta: iso(hoy) }
    }
    case 'mes_anterior': {
      const ini = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0)
      return { desde: iso(ini), hasta: iso(fin) }
    }
    default:
      return { desde: iso(hoy), hasta: iso(hoy) }
  }
}
