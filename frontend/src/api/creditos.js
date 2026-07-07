import client from './client'

export const getCreditos = () => client.get('/creditos')
export const registrarAbono = (data) => client.post('/creditos/abonos', data)
