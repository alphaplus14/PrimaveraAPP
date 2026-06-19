import client from './client'

export const getVentas = (params) => client.get('/ventas', { params })
export const getVenta = (id) => client.get(`/ventas/${id}`)
export const crearVenta = (data) => client.post('/ventas', data)

export const getClientes = () => client.get('/clientes')
export const crearCliente = (data) => client.post('/clientes', data)
