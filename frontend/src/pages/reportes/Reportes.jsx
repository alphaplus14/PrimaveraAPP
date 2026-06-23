import { useState, useCallback } from 'react'
import {
  getReporteVentas,
  getReporteCompras,
  getReporteMovimientos,
  rangoPreset,
} from '../../api/reportes'
import { getProductos } from '../../api/productos'
import { useApi } from '../../hooks/useApi'

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const TIPO_VENTA_LABEL = { retail: 'Detal', wholesale: 'Mayorista' }

const TIPO_MOV = {
  purchase:       { label: 'Compra',         color: 'text-blue-600',   bg: 'bg-blue-50'   },
  sale:           { label: 'Venta',           color: 'text-green-600',  bg: 'bg-green-50'  },
  transformation: { label: 'Transformación',  color: 'text-orange-600', bg: 'bg-orange-50' },
  adjustment:     { label: 'Ajuste',          color: 'text-purple-600', bg: 'bg-purple-50' },
}

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

  const { data: dataProductos } = useApi(getProductos)
  const productos = dataProductos ?? []

  const fetchDatos = useCallback(() => {
    if (tab === 'ventas')      return getReporteVentas(rango)
    if (tab === 'compras')     return getReporteCompras(rango)
    if (tab === 'movimientos') return getReporteMovimientos({ ...rango, product_id: productoFiltro || undefined })
    return Promise.resolve({ data: { data: [] } })
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

  // resultado is the unwrapped array from useApi (res.data.data)
  const datos = resultado ?? []

  // Compute summaries from data
  const totalKg    = datos.reduce((s, r) => s + Number(r.quantity_kg ?? 0), 0)
  const totalPesos = datos.reduce((s, r) => s + Number(r.total ?? 0), 0)

  const porProducto = datos.reduce((acc, r) => {
    const nombre = r.product?.name ?? '—'
    if (!acc[nombre]) acc[nombre] = { quantity_kg: 0, total: 0 }
    acc[nombre].quantity_kg += Number(r.quantity_kg ?? 0)
    acc[nombre].total       += Number(r.total ?? 0)
    return acc
  }, {})

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

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
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
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a365d]">{datos.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Ventas</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a365d]">{totalKg.toFixed(1)}</p>
                  <p className="text-xs text-gray-400 mt-1">kg vendidos</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-lg font-bold text-green-600 leading-tight">{formatCOP(totalPesos)}</p>
                  <p className="text-xs text-gray-400 mt-1">Total</p>
                </div>
              </div>

              {Object.keys(porProducto).length > 0 && (
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
                      {Object.entries(porProducto)
                        .sort(([, a], [, b]) => b.total - a.total)
                        .map(([nombre, vals]) => (
                          <tr key={nombre} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 font-medium text-gray-800">{nombre}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-gray-500">
                              {Number(vals.quantity_kg).toFixed(1)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-green-700">
                              {formatCOP(vals.total)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {datos.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Detalle ({datos.length})
                  </p>
                  <div className="divide-y divide-gray-50">
                    {datos.map((v) => (
                      <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{v.product?.name}</p>
                          <p className="text-xs text-gray-400">
                            {v.customer?.name} · {Number(v.quantity_kg).toFixed(1)} kg · {TIPO_VENTA_LABEL[v.sale_type] ?? v.sale_type}
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
                  <p className="text-2xl font-bold text-[#1a365d]">{datos.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Compras</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a365d]">{totalKg.toFixed(1)}</p>
                  <p className="text-xs text-gray-400 mt-1">kg comprados</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-lg font-bold text-blue-600 leading-tight">{formatCOP(totalPesos)}</p>
                  <p className="text-xs text-gray-400 mt-1">Total</p>
                </div>
              </div>

              {datos.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Detalle ({datos.length})
                  </p>
                  <div className="divide-y divide-gray-50">
                    {datos.map((c) => (
                      <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{c.product?.name}</p>
                          <p className="text-xs text-gray-400">
                            {c.supplier?.name} · {Number(c.quantity_kg).toFixed(1)} kg
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
              {datos.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {datos.length} movimiento{datos.length !== 1 ? 's' : ''}
                  </p>
                  <div className="divide-y divide-gray-50">
                    {datos.map((m) => {
                      const tipo    = TIPO_MOV[m.type] ?? { label: m.type, color: 'text-gray-600', bg: 'bg-gray-50' }
                      const positivo = Number(m.quantity_kg) >= 0
                      return (
                        <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tipo.bg} ${tipo.color}`}>
                              {tipo.label}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{m.product?.name}</p>
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
