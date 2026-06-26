import client from './client'

export const getLabores      = (params) => client.get('/labores', { params })
export const crearLabor      = (data)   => client.post('/labores', data)
export const actualizarLabor = (id, data) => client.put(`/labores/${id}`, data)
export const eliminarLabor   = (id) => client.delete(`/labores/${id}`)

export const getInsumos  = ()       => client.get('/insumos')
export const crearInsumo = (data)   => client.post('/insumos', data)
