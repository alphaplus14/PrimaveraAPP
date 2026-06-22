import { useState, useCallback } from 'react'
import {
  getReporteVentas,
  getReporteCompras,
  getReporteMovimientos,
  rangoPreset,
} from '../../api/reportes'
import { getProductos } from '../../api/productos'
import { useApi } from '../../hooks/useApi'
import { MOVEMENT_TYPE_LABEL, SALE_TYPE_LABEL } from '../../constants/enums'

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const TABS = [
  { id: 'ventas',      label: 'Ventas',      icon: '💰' },
  { id: 'compras',     label: 'Compras',     icon: '🛒' },
  { id: 'movimientos', label: 'Movimientos', icon: '📋' },
]

const PRESETS = [
  { id: 'hoy',          label: 'Hoy' },
  { id: 'semana',       label: 'Esta semana' },
  { id: 'mes',          label: 'Este mes' },
  { id: 'mes_anterior', label: 'Mes anterior' },
]


export default function Reportes() {
  const [tab, setTab] = useState('ventas')
  const [rango, setRango] = useState(rangoPreset('mes'))
  const [presetActivo, setPresetActivo] = useState('mes')
  const [productoFiltro, setProductoFiltro] = useState('')

  // Cargamos los productos para el filtro de movimientos
  const { data: dataProductos } = useApi(getProductos)
  const productos = dataProductos?.data ?? []

  // Función de fetch que depende del tab y los filtros actuales
  const fetchDatos = useCallback(() => {
    if (tab === 'ventas')      return getReporteVentas(rango)
    if (tab === 'compras')     return getReporteCompras(rango)
    if (tab === 'movimientos') return getReporteMovimientos({ ...rango, product_id: productoFiltro || undefined })
    return Promise.resolve({ data: { data: null } })
  }, [tab, rango, productoFiltro])

  const { data: resultado, cargando, recargar } = useApi(fetchDatos, [tab, rango, productoFiltro])

  const aplicarPreset = (id) => {
    setPresetActivo(id)
    setRango(rangoPreset(id))
  }

  const aplicarRangoManual = (campo, valor) => {
    setPresetActivo(null)
    setRango((r) => ({ ...r, [campo]: valor }))
  }

  // Extraer datos según el tab
  const datosVentas      = resultado?.data?.ventas ?? []
  const resumenVentas    = resultado?.data?.resumen ?? {}
  const datosCompras     = resultado?.data?.compras ?? []
  const resumenCompras   = resultado?.data?.resumen ?? {}
  const datosMovimientos = resultado?.data ?? []

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <h2 className="text-xl font-bold text-[#1a365d] mb-4">Reportes</h2>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-[#1a365d] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
        {/* Presets */}
        <div className="flex gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => aplicarPreset(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                presetActivo === p.id
                  ? 'bg-[#1a365d] text-white'
                  : 'border border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Rango manual */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={rango.desde}
            onChange={(e) => aplicarRangoManual('desde', e.target.value)}
            className={inputClass}
          />
          <span className="text-gray-400 text-sm">→</span>
          <input
            type="date"
            value={rango.hasta}
            onChange={(e) => aplicarRangoManual('hasta', e.target.value)}
            className={inputClass}
          />
          <button
            onClick={recargar}
            className="shrink-0 px-3 py-2.5 bg-[#f56523] text-white rounded-lg text-sm font-medium hover:bg-[#d9541a]"
          >
            Buscar
          </button>
        </div>

        {/* Filtro de producto (solo movimientos) */}
        {tab === 'movimientos' && (
          <select
            value={productoFiltro}
            onChange={(e) => setProductoFiltro(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos los productos</option>
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Contenido */}
      {cargando ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── TAB VENTAS ── */}
          {tab === 'ventas' && (
            <div className="space-y-4">
              {/* Tarjetas resumen */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a365d]">{resumenVentas.total_ventas ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Ventas</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a365d]">
                    {Number(resumenVentas.total_kg ?? 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">kg vendidos</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-lg font-bold text-green-600 leading-tight">
                    {formatCOP(resumenVentas.total_pesos ?? 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total</p>
                </div>
              </div>

              {/* Resumen por producto */}
              {resumenVentas.por_producto && Object.keys(resumenVentas.por_producto).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Por producto
                  </p>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-400 text-xs">
                      <tr>
                        <th className="text-left px-4 py-2">Producto</th>
                        <th className="text-right px-4 py-2">kg</th>
                        <th className="text-right px-4 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {Object.entries(resumenVentas.por_producto)
                        .sort(([, a], [, b]) => b.total_pesos - a.total_pesos)
                        .map(([nombre, vals]) => (
                          <tr key={nombre} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-medium text-gray-800">{nombre}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-500">
                              {Number(vals.quantity_kg).toFixed(1)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-green-700">
                              {formatCOP(vals.total_pesos)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Lista detallada */}
              {datosVentas.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Detalle ({datosVentas.length})
                  </p>
                  <div className="divide-y divide-gray-50">
                    {datosVentas.map((v) => (
                      <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{v.producto?.name}</p>
                          <p className="text-xs text-gray-400">
                            {v.cliente?.name} · {Number(v.quantity_kg).toFixed(1)} kg · {SALE_TYPE_LABEL[v.sale_type] ?? v.sale_type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-700">{formatCOP(v.total)}</p>
                          <p className="text-xs text-gray-400">{v.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState mensaje="Sin ventas en este período" />
              )}
            </div>
          )}

          {/* ── TAB COMPRAS ── */}
          {tab === 'compras' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a365d]">{resumenCompras.total_compras ?? 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Compras</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a365d]">
                    {Number(resumenCompras.total_kg ?? 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">kg comprados</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-lg font-bold text-blue-600 leading-tight">
                    {formatCOP(resumenCompras.total_pesos ?? 0)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total</p>
                </div>
              </div>

              {datosCompras.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Detalle ({datosCompras.length})
                  </p>
                  <div className="divide-y divide-gray-50">
                    {datosCompras.map((c) => (
                      <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.producto?.name}</p>
                          <p className="text-xs text-gray-400">
                            {c.proveedor?.name} · {Number(c.quantity_kg).toFixed(1)} kg
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-700">{formatCOP(c.total)}</p>
                          <p className="text-xs text-gray-400">{c.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <EmptyState mensaje="Sin compras en este período" />
              )}
            </div>
          )}

          {/* ── TAB MOVIMIENTOS ── */}
          {tab === 'movimientos' && (
            <div className="space-y-3">
              {datosMovimientos.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {datosMovimientos.length} movimiento{datosMovimientos.length !== 1 ? 's' : ''}
                  </p>
                  <div className="divide-y divide-gray-50">
                    {datosMovimientos.map((m) => {
                      const tipo = MOVEMENT_TYPE_LABEL[m.type] ?? { label: m.type, color: 'text-gray-600', bg: 'bg-gray-50' }
                      const positivo = Number(m.quantity_kg) >= 0
                      return (
                        <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipo.bg} ${tipo.color}`}>
                              {tipo.label}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{m.producto?.name}</p>
                              <p className="text-xs text-gray-400">{m.date}</p>
                            </div>
                          </div>
                          <p className={`text-sm font-bold tabular-nums ${positivo ? 'text-green-600' : 'text-red-500'}`}>
                            {positivo ? '+' : ''}{Number(m.quantity_kg).toFixed(1)} kg
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState mensaje="Sin movimientos en este período" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({ mensaje }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
      <p className="text-3xl mb-2">📭</p>
      <p className="text-sm">{mensaje}</p>
    </div>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] bg-white'
