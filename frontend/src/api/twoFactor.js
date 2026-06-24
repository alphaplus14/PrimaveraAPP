import client from './client'

export const twoFactorChallenge = (two_factor_token, code) =>
  client.post('/two-factor-challenge', { two_factor_token, code })

export const twoFactorEnable = () =>
  client.post('/user/two-factor-authentication')

export const twoFactorConfirm = (code) =>
  client.post('/user/confirmed-two-factor-authentication', { code })

export const twoFactorDisable = (password) =>
  client.delete('/user/two-factor-authentication', { data: { password } })

export const twoFactorStatus = () =>
  client.get('/user/two-factor-status')

export const twoFactorRecoveryCodes = () =>
  client.get('/user/two-factor-recovery-codes')

export const twoFactorRegenerateRecoveryCodes = () =>
  client.post('/user/two-factor-recovery-codes')
