import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    // Al cargar la app, recuperar el usuario guardado en localStorage
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  const iniciarSesion = async (email, password) => {
    setCargando(true)
    setError(null)
    try {
      const { data } = await apiLogin(email, password)
      const { user, token } = data.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)
      return true
    } catch (err) {
      const mensaje =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        'Error al iniciar sesión.'
      setError(mensaje)
      return false
    } finally {
      setCargando(false)
    }
  }

  const cerrarSesion = async () => {
    try {
      await apiLogout()
    } catch {
      // Si falla el logout en el servidor, igual limpiamos local
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, cargando, error, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el contexto fácilmente: const { user } = useAuth()
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
