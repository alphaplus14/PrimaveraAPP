import client from './client'

export const getInventario = () => client.get('/inventario')
export const getInventarioProducto = (id) => client.get(`/inventario/${id}`)
export const ajustarInventario = (id, data) => client.patch(`/inventario/${id}/ajuste`, data)
