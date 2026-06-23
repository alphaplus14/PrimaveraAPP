import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FLUX } from '../lib/dashboard'

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
    <div className="min-h-screen flex" style={{ backgroundColor: FLUX.bg }}>
      {/* Sidebar — visible en pantallas medianas en adelante */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-slate-100 text-slate-700 transition-all duration-200 relative shrink-0 ${
          sidebarCollapsed ? 'w-16' : 'w-56'