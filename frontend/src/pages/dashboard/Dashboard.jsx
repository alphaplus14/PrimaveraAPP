import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getResumenHoy } from '../../api/reportes'
import { useNavigate } from 'react-router-dom'

const formatCOP = (valor) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor)

const formatKg = (valor) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(valor) + ' kg'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getResumenHoy()
      .then(([ventasRes, comprasRes, invRes, prodRes]) => {
        const ventas    = ventasRes.data?.data ?? []
        const compras   = comprasRes.data?.data ?? []
        const inventario = invRes.data?.data ?? []
        const productos  = prodRes.data?.data ?? []

        setDatos({
          ventasHoy:        ventas.reduce((s, v) => s + Number(v.total), 0),
          ventasKgHoy:      ventas.reduce((s, v) => s + Number(v.quantity_kg), 0),
          comprasHoy:       compras.reduce((s, c) => s + Number(c.total), 0),
          comprasKgHoy:     compras.reduce((s, c) => s + Number(c.quantity_kg), 0),
          productosActivos: productos.filter((p) => p.active).length,
          itemsConStock:    inventario.filter((i) => Number(i.quantity_kg) > 0).length,
          stockBajo:        inventario.filter((i) => Number(i.quantity_kg) >= 0 && Number(i.quantity_kg) < 5),
          ultimasVentas:    ventas.slice(0, 5),
        })
      })
      .catch(() => setError('No se pudo cargar el resumen. Verifica que el servidor esté activo.'))
      .finally(() => setCargando(false))
  }, [])

  const hoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#1a365d]">Hola, {user?.name} 👋</h2>
        <p className="text-gray-400 text-sm capitalize">{hoy}</p>
      </div>

      {cargando ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600 text-sm">
          {error}
        </div>
      ) : datos ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <TarjetaStat label="Ventas hoy"   valor={formatCOP(datos.ventasHoy)}  sub={formatKg(datos.ventasKgHoy) + ' vendidos'}  color="green"  icono="💰" />
            <TarjetaStat label="Compras hoy"  valor={formatCOP(datos.comprasHoy)} sub={formatKg(datos.comprasKgHoy) + ' comprados'} color="blue"   icono="🛒" />
            <TarjetaStat label="Productos"    valor={datos.productosActivos}       sub="activos en catálogo"                         color="orange" icono="🌿" />
            <TarjetaStat label="En stock"     valor={datos.itemsConStock}          sub="productos con saldo"                         color="purple" icono="📦" />
          </div>

          {datos.stockBajo.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-700 font-semibold text-sm mb-2">
                ⚠️ Stock bajo o agotado ({datos.stockBajo.length} productos)
              </p>
              <div className="flex flex-wrap gap-2">
                {datos.stockBajo.map((item) => (
                  <span key={item.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    {item.product?.name} — {Number(item.quantity_kg).toFixed(1)} kg
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Acciones rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Nueva venta',    icono: '💰', ruta: '/ventas',     color: 'bg-green-500' },
                { label: 'Nueva compra',   icono: '🛒', ruta: '/compras',    color: 'bg-blue-500' },
                { label: 'Ver inventario', icono: '📦', ruta: '/inventario', color: 'bg-purple-500' },
                { label: 'Productos',      icono: '🌿', ruta: '/productos',  color: 'bg-orange-500' },
              ].map(({ label, icono, ruta, color }) => (
                <button
                  key={ruta}
                  onClick={() => navigate(ruta)}
                  className={`${color} text-white rounded-xl p-4 text-left hover:opacity-90 active:scale-95 transition-all`}
                >
                  <span className="text-2xl block mb-1">{icono}</span>
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {datos.ultimasVentas.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ventas de hoy</h3>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {datos.ultimasVentas.map((v, i) => (
                  <div key={v.id} className={`flex items-center justify-between px-4 py-3 ${i < datos.ultimasVentas.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{v.product?.name}</p>
                      <p className="text-xs text-gray-400">{v.customer?.name} · {formatKg(v.quantity_kg)}</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{formatCOP(v.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm">No hay ventas registradas hoy.</p>
              <button onClick={() => navigate('/ventas')} className="mt-3 text-sm text-[#f56523] font-medium hover:underline">
                Registrar primera venta →
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}

function TarjetaStat({ label, valor, sub, color, icono }) {
  const colores = {
    green:  'bg-green-50 text-green-700 border-green-100',
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
  }
  return (
    <div className={`rounded-xl p-4 border ${colores[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-70">{label}</span>
        <span className="text-lg">{icono}</span>
      </div>
      <p className="text-xl font-bold">{valor}</p>
      <p className="text-xs opacity-60 mt-0.5">{sub}</p>
    </div>
  )
}
