import client from './client'

const isoLocal = (d) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Usado por Dashboard — reportes sí filtran por fecha (ventas/compras index no)
export const getResumenHoy = () => {
  const hoy = isoLocal(new Date())
  const params = { desde: hoy, hasta: hoy }
  return Promise.all([
    client.get('/reportes/ventas', { params }),
    client.get('/reportes/compras', { params }),
    client.get('/inventario'),
    client.get('/productos'),
  ])
}

export const getReporteVentas      = (params) => client.get('/reportes/ventas', { params })
export const getReporteCompras     = (params) => client.get('/reportes/compras', { params })
export const getReporteMovimientos = (params) => client.get('/reportes/movimientos', { params })
export const getReporteInventario  = ()        => client.get('/reportes/inventario')
export const getReporteRentabilidad = (params) => client.get('/reportes/rentabilidad', { params })
export const getReporteLabores      = (params) => client.get('/reportes/labores', { params })
export const getReporteOrigen       = (params) => client.get('/reportes/origen', { params })

export const getVentasUltimasSemanas = (semanas = 8) => {
  const hoy = new Date()
  const desde = new Date(hoy)
  desde.setDate(hoy.getDate() - semanas * 7)
  const pad = (n) => String(n).padStart(2, '0')
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return getReporteVentas({ desde: iso(desde), hasta: iso(hoy) })
}

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
