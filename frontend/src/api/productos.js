import client from './client'

export const getProductos = () => client.get('/productos')
export const getProductosConCompras = (params) => client.get('/productos/con-compras', { params })
export const getProducto = (id) => client.get(`/productos/${id}`)
export const crearProducto = (data) => client.post('/productos', data)
export const actualizarProducto = (id, data) => client.put(`/productos/${id}`, data)

export const getPreciosProducto = (id) => client.get(`/productos/${id}/precios`)
export const getPrecioActual = (id) => client.get(`/productos/${id}/precio-actual`)
export const crearPrecio = (id, data) => client.post(`/productos/${id}/precios`, data)
