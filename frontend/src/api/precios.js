import client from './client'

export const getPriceReviewStatus = () => client.get('/user/price-review')

export const getRevisionDiaria = () => client.get('/precios/revision-diaria')

export const completarRevisionPrecios = (prices) =>
  client.post('/user/price-review/complete', { prices })

export const omitirRevisionPrecios = () => client.post('/user/price-review/skip')
