import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  { to: '/',                  label: 'Dashboard',        icon: '/assets/icons/dashboard%20icon.png' },
  { to: '/productos',         label: 'Productos',        icon: '/assets/icons/productos%20icon.png' },
  { to: '/inventario',        label: 'Inventario',       icon: '/assets/icons/inventario%20icon.png' },
  { to: '/compras',           label: 'Compras',          icon: '/assets/icons/compras%20icon.png' },
  { to: '/ventas',            label: 'Ventas',           icon: '/assets/icons/ventas%20icono.png' },
  { to: '/transformaciones',  label: 'Transformaciones', icon: '/assets/icons/transformaciones%20icon.png' },
  { to: '/labores',           label: 'Labores',          icon: '/assets/icons/labores%20icono.png' },
  { to: '/reportes',          label: 'Reportes',         icon: '/assets/icons/reportes%20icono.png' },
]

const STORAGE_SIDEBAR = 'primavera-sidebar-collapsed'
const STORAGE_MOBILE_NAV = 'primavera-mobile-nav-open'

function NavIcon({ src, active, className = '', muted = false }) {
  return (
    <img
      src={src}
      alt=""
      className={`object-contain shrink-0 transition-opacity ${
        active ? 'opacity-100' : muted ? 'opacity-75' : 'opacity-60'
      } ${className}`}
    />
  )
}

function ChevronIcon({ direction = 'left', className = '' }) {
  const paths = {
    left: 'M15 19l-7-7 7-7',
    right: 'M9 5l7 7-7 7',
    down: 'M19 9l-7 7-7-7',
    up: 'M5 15l7-7 7 7',
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[direction]} />
    </svg>
  )
}

export default function Layout() {
  const { user, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(STORAGE_SIDEBAR) === 'true',
  )
  const [mobileNavOpen, setMobileNavOpen] = useState(
    () => localStorage.getItem(STORAGE_MOBILE_NAV) !== 'false',
  )

  useEffect(() => {
    localStorage.setItem(STORAGE_SIDEBAR, String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    localStorage.setItem(STORAGE_MOBILE_NAV, String(mobileNavOpen))
  }, [mobileNavOpen])

  const handleLogout = async () => {
    await cerrarSesion()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — visible en pantallas medianas en adelante */}
      <aside
        className={`hidden md:flex flex-col bg-[#1a365d] text-white transition-all duration-200 relative shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarCollapsed((c) => !c)}
          aria-label={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronIcon
            direction={sidebarCollapsed ? 'right' : 'left'}
            className="w-3.5 h-3.5"
          />
        </button>

        <div
          className={`border-b border-white/10 ${
            sidebarCollapsed ? 'px-2 py-4 text-center' : 'px-5 py-6'
          }`}
        >
          {sidebarCollapsed ? (
            <span className="text-xl" title="Finca Primavera">
              🌱
            </span>
          ) : (
            <>
              <h1 className="font-bold text-lg leading-tight">Finca Primavera</h1>
              <p className="text-xs text-white/60 mt-0.5 truncate">{user?.name}</p>
            </>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-lg text-sm transition-colors ${
                  sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#f56523] text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <NavIcon src={icon} active={isActive} className="w-5 h-5" />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`m-3 text-sm text-white/50 hover:text-white py-2 transition-colors ${
            sidebarCollapsed ? 'px-2 text-center' : 'text-left px-3'
          }`}
        >
          {sidebarCollapsed ? '⎋' : 'Cerrar sesión'}
        </button>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>

      {/* Barra de navegación inferior — solo móvil */}
      {mobileNavOpen ? (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50">
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Ocultar menú"
            className="absolute -top-8 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-md text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronIcon direction="down" className="w-4 h-4" />
          </button>
          <nav className="bg-blue-500 flex justify-around py-2.5 border-t border-blue-400/40 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
            {nav.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] leading-tight transition-colors min-w-0 ${
                    isActive
                      ? 'text-[#f56523] font-semibold'
                      : 'text-white font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <NavIcon src={icon} active={isActive} muted className="w-6 h-6" />
                    <span className="truncate max-w-13">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Mostrar menú"
          className="md:hidden fixed bottom-4 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-blue-500 text-white shadow-lg border border-blue-400/50 hover:bg-blue-600 transition-colors"
        >
          <ChevronIcon direction="up" className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}
