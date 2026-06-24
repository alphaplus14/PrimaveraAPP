import client from './client'

export const getLabores      = (params) => client.get('/labores', { params })
export const crearLabor      = (data)   => client.post('/labores', data)
export const actualizarLabor = (id, data) => client.put(`/labores/${id}`, data)

export const getInsumos  = ()       => client.get('/insumos')
export const crearInsumo = (data)   => client.post('/insumos', data)
