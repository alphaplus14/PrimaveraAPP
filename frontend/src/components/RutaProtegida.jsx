import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RutaProtegida({ children }) {
  const { user, verificandoSesion } = useAuth()

  // Mientras se confirma el token guardado contra el backend, evitamos
  // parpadeos hacia /login o mostrar la app con una sesión ya vencida.
  if (verificandoSesion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fa] gap-3">
        <div className="w-10 h-10 border-3 border-[#1a365d] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Cargando tu sesión...</p>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}
