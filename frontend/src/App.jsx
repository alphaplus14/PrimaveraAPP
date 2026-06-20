import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import RutaProtegida from './components/RutaProtegida'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Productos from './pages/productos/Productos'
import Inventario from './pages/inventario/Inventario'
import Compras from './pages/compras/Compras'
import Ventas from './pages/ventas/Ventas'
import Transformaciones from './pages/transformaciones/Transformaciones'
import Labores from './pages/labores/Labores'
import Reportes from './pages/reportes/Reportes'

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Si ya hay sesión y va al login, redirige al inicio */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Rutas protegidas dentro del layout */}
      <Route
        path="/"
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="productos" element={<Productos />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="compras" element={<Compras />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="transformaciones" element={<Transformaciones />} />
        <Route path="labores" element={<Labores />} />
        <Route path="reportes" element={<Reportes />} />
      </Route>

      {/* Cualquier ruta desconocida va al inicio */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
