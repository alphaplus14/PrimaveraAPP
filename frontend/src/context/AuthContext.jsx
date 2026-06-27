import { createContext, useContext, useState } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/auth'
import { twoFactorChallenge } from '../api/twoFactor'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  // Estado pendiente de 2FA
  const [pending2FA, setPending2FA] = useState(null) // { two_factor_token }

  const iniciarSesion = async (email, password) => {
    setCargando(true)
    setError(null)
    try {
      const { data } = await apiLogin(email, password)
      const payload = data.data

      // El servidor pide 2FA
      if (payload.requires_2fa) {
        setPending2FA({ two_factor_token: payload.two_factor_token })
        return { requires_2fa: true }
      }

      // Login directo
      _saveSession(payload)
      return { ok: true }
    } catch (err) {
      const mensaje =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Error al iniciar sesión.'
      setError(mensaje)
      return { ok: false }
    } finally {
      setCargando(false)
    }
  }

  const verificar2FA = async (code) => {
    if (!pending2FA) return { ok: false }
    setCargando(true)
    setError(null)
    try {
      const { data } = await twoFactorChallenge(pending2FA.two_factor_token, code)
      _saveSession(data.data)
      setPending2FA(null)
      return { ok: true }
    } catch (err) {
      const mensaje =
        err.response?.data?.message || 'Código incorrecto. Inténtalo de nuevo.'
      setError(mensaje)
      return { ok: false }
    } finally {
      setCargando(false)
    }
  }

  const cancelar2FA = () => {
    setPending2FA(null)
    setError(null)
  }

  const cerrarSesion = async () => {
    try {
      await apiLogout()
    } catch {
      // limpiamos local igualmente
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  const _saveSession = ({ user, token }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  const actualizarUsuario = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  return (
    <AuthContext.Provider value={{
      user,
      cargando,
      error,
      pending2FA,
      iniciarSesion,
      verificar2FA,
      cancelar2FA,
      cerrarSesion,
      actualizarUsuario,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
