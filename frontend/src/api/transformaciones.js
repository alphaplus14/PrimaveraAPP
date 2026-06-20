import client from './client'

export const getTransformaciones = (params) => client.get('/transformaciones', { params })
export const crearTransformacion = (data) => client.post('/transformaciones', data)
