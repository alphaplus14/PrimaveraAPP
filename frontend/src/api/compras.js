import client from './client'

export const getCompras = (params) => client.get('/compras', { params })
export const getCompra = (id) => client.get(`/compras/${id}`)
export const crearCompra = (data) => client.post('/compras', data)

export const getProveedores = () => client.get('/proveedores')
export const crearProveedor = (data) => client.post('/proveedores', data)
