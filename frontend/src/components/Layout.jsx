import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/',            label: 'Dashboard',   icon: '📊' },
  { to: '/productos',   label: 'Productos',   icon: '🌿' },
  { to: '/inventario',  label: 'Inventario',  icon: '📦' },
  { to: '/compras',     label: 'Compras',     icon: '🛒' },
  { to: '/ventas',      label: 'Ventas',      icon: '💰' },
]

export default function Layout() {
  const { user, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await cerrarSesion()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — visible en pantallas medianas en adelante */}
      <aside className="hidden md:flex flex-col w-56 bg-[#1a365d] text-white">
        <div className="px-5 py-6 border-b border-white/10">
          <h1 className="font-bold text-lg leading-tight">Finca Primavera</h1>
          <p className="text-xs text-white/60 mt-0.5">{user?.name}</p>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#f56523] text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="m-3 text-sm text-white/50 hover:text-white py-2 transition-colors text-left px-3"
        >
          Cerrar sesión
        </button>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>

      {/* Barra de navegación inferior — solo móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#1a365d] flex justify-around py-2 z-50">
        {nav.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-xs transition-colors ${
                isActive ? 'text-[#f56523]' : 'text-white/60'
              }`
            }
          >
            <span className="text-xl">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
