import client from './client'

export const login = (email, password) =>
  client.post('/login', { email, password })

export const logout = () =>
  client.post('/logout')

export const getUsuarioActual = () =>
  client.get('/user')
