import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPriceReviewStatus } from '../api/precios'
import { FLUX } from '../lib/dashboard'
import Modal from './ui/Modal'
import ModalRevisionPrecios from './ModalRevisionPrecios'
import TwoFactorSetup from './TwoFactorSetup'

const nav = [
  { to: '/',                  label: 'Dashboard',        icon: '/assets/icons/dashboard%20icon.png' },
  { to: '/productos',         label: 'Productos',        icon: '/assets/icons/productos%20icon.png' },
  { to: '/inventario',        label: 'Inventario',       icon: '/assets/icons/inventario%20icon.png' },
  { to: '/compras',           label: 'Compras',          icon: '/assets/icons/compras%20icon.png' },
  { to: '/ventas',            label: 'Ventas',           icon: '/assets/icons/ventas%20icono.png' },
  { to: '/creditos',          label: 'Créditos',         icon: '/assets/icons/ventas%20icono.png' },
  { to: '/transformaciones',  label: 'Transformaciones', icon: '/assets/icons/transformaciones%20icon.png' },
  { to: '/labores',           label: 'Labores',          icon: '/assets/icons/labores%20icono.png' },
  { to: '/reportes',          label: 'Reportes',         icon: '/assets/icons/reportes%20icono.png' },
]

const STORAGE_SIDEBAR = 'primavera-sidebar-collapsed'
const STORAGE_MOBILE_NAV = 'primavera-mobile-nav-open'

const dismissPreciosHoy = () => {
  const hoy = new Date().toISOString().split('T')[0]
  sessionStorage.setItem(`precios_modal_dismissed_${hoy}`, '1')
}

const preciosDismissedHoy = () => {
  const hoy = new Date().toISOString().split('T')[0]
  return sessionStorage.getItem(`precios_modal_dismissed_${hoy}`) === '1'
}

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
  const { user, cerrarSesion, actualizarUsuario } = useAuth()
  const navigate = useNavigate()

  const [mostrarSeguridad, setMostrarSeguridad] = useState(false)
  const [mostrarRevisionPrecios, setMostrarRevisionPrecios] = useState(false)
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

  useEffect(() => {
    if (!user) return

    getPriceReviewStatus()
      .then(({ data }) => {
        if (data.data?.needs_review && !preciosDismissedHoy()) {
          setMostrarRevisionPrecios(true)
        }
      })
      .catch(() => {})
  }, [user?.id])

  const handleCerrarRevision = () => {
    dismissPreciosHoy()
    setMostrarRevisionPrecios(false)
  }

  const handleRevisionCompletada = (userData) => {
    actualizarUsuario(userData)
    setMostrarRevisionPrecios(false)
  }

  const handleLogout = async () => {
    await cerrarSesion()
    navigate('/login')
  }

  return (
    <div className="h-screen max-h-screen flex overflow-hidden" style={{ backgroundColor: FLUX.bg }}>
      {/* Sidebar — visible en pantallas medianas en adelante */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-100 text-slate-700 transition-all duration-200 relative shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <button
          type="button"
          onClick={() => setSidebarCollapsed((c) => !c)}
          aria-label={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          className="absolute -right-3 top-20 z-10 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <ChevronIcon
            direction={sidebarCollapsed ? 'right' : 'left'}
            className="w-3.5 h-3.5"
          />
        </button>

        <div
          className={`border-b border-slate-100 ${
            sidebarCollapsed ? 'px-2 py-4 text-center' : 'px-5 py-6'
          }`}
        >
          {sidebarCollapsed ? (
            <span className="text-xl" title="Finca Primavera">
              🌱
            </span>
          ) : (
            <>
              <h1 className="font-bold text-lg leading-tight text-slate-800">Finca Primavera</h1>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{user?.name}</p>
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
                `flex items-center rounded-xl text-sm transition-colors ${
                  sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'font-medium'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: FLUX.lavender, color: FLUX.purpleDark }
                  : undefined
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
          onClick={() => setMostrarSeguridad(true)}
          title="Seguridad / 2FA"
          className={`mx-3 mb-1 text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors ${
            sidebarCollapsed ? 'px-2 text-center' : 'text-left px-3'
          }`}
        >
          {sidebarCollapsed ? '🔐' : '🔐 Seguridad'}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          title="Cerrar sesión"
          className={`m-3 mt-0 text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors ${
            sidebarCollapsed ? 'px-2 text-center' : 'text-left px-3'
          }`}
        >
          {sidebarCollapsed ? '⎋' : 'Cerrar sesión'}
        </button>

        {mostrarSeguridad && (
          <Modal titulo="Seguridad de la cuenta" onClose={() => setMostrarSeguridad(false)}>
            <TwoFactorSetup />
          </Modal>
        )}
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
        <Outlet />
      </main>

      {/* Barra de navegación inferior — solo móvil */}
      {mobileNavOpen ? (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-50">
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Ocultar menú"
            className="absolute -top-8 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <ChevronIcon direction="down" className="w-4 h-4" />
          </button>
          <nav className="bg-white flex justify-around py-2.5 border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
            {nav.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 px-1.5 py-1 rounded-lg text-[11px] leading-tight transition-colors min-w-0 ${
                    isActive
                      ? 'font-semibold'
                      : 'text-slate-500 font-medium'
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { color: FLUX.purpleDark } : undefined
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
          className="md:hidden fixed bottom-4 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-[#6366F1] hover:bg-[#5C27FE] text-white shadow-lg transition-colors"
        >
          <ChevronIcon direction="up" className="w-5 h-5" />
        </button>
      )}

      {mostrarRevisionPrecios && (
        <ModalRevisionPrecios
          onCerrar={handleCerrarRevision}
          onCompletado={handleRevisionCompletada}
        />
      )}
    </div>
  )
}