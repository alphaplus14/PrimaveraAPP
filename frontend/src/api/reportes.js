import client from './client'

export const getResumenHoy = () => {
  const hoy = new Date().toISOString().split('T')[0]
  return Promise.all([
    client.get('/ventas', { params: { desde: hoy, hasta: hoy } }),
    client.get('/compras', { params: { desde: hoy, hasta: hoy } }),
    client.get('/inventario'),
    client.get('/productos'),
  ])
}
