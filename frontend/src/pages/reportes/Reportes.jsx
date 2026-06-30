import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  getReporteVentas,
  getReporteCompras,
  getReporteMovimientos,
  getReporteRentabilidad,
  getReporteLabores,
  rangoPreset,
} from '../../api/reportes'
import { getProductos } from '../../api/productos'
import { useApi } from '../../hooks/useApi'
import Paginacion from '../../components/ui/Paginacion'
import { MOVEMENT_TYPE_LABEL, SALE_TYPE_LABEL, PAYMENT_MODE_LABEL } from '../../constants/enums'
import { formatFechaCorta } from '../../lib/dashboard'

const POR_PAGINA = 10

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const TABS = [
  { id: 'ventas',        label: 'Ventas',        icon: '💰' },
  { id: 'compras',       label: 'Compras',       icon: '🛒' },
  { id: 'rentabilidad',  label: 'Rentabilidad', icon: '📈' },
  { id: 'labores',       label: 'Cosechas',     icon: '🧺' },
  { id: 'movimientos',   label: 'Movimientos',   icon: '📋' },
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
  const [rentabilidad, setRentabilidad] = useState({ rows: [], meta: null })
  const [cargandoRentabilidad, setCargandoRentabilidad] = useState(false)
  const [labores, setLabores] = useState({ data: null, meta: null })
  const [cargandoLabores, setCargandoLabores] = useState(false)
  const [cultivoFiltro, setCultivoFiltro] = useState('')
  const [paginas, setPaginas] = useState({})

  const paginaDe = (clave) => paginas[clave] ?? 1
  const irPagina = (clave, pagina) =>
    setPaginas((prev) => ({ ...prev, [clave]: pagina }))

  useEffect(() => {
    setPaginas({})
  }, [tab, rango.desde, rango.hasta, productoFiltro, cultivoFiltro])

  const { data: dataProductos } = useApi(getProductos)
  const productos = dataProductos ?? []

  const fetchDatos = useCallback(() => {
    if (tab === 'rentabilidad') return Promise.resolve({ data: { data: null } })
    if (tab === 'labores') return Promise.resolve({ data: { data: null } })
    if (tab === 'ventas')      return getReporteVentas(rango)
    if (tab === 'compras')     return getReporteCompras(rango)
    if (tab === 'movimientos') return getReporteMovimientos({ ...rango, product_id: productoFiltro || undefined })
    return Promise.resolve({ data: { data: null } })
  }, [tab, rango, productoFiltro])

  const { data: resultado, cargando, recargar } = useApi(fetchDatos, [tab, rango, productoFiltro])

  const cargarRentabilidad = useCallback(() => {
    setCargandoRentabilidad(true)
    getReporteRentabilidad({
      ...rango,
      product_id: productoFiltro || undefined,
    })
      .then(({ data }) => {
        setRentabilidad({ rows: data.data ?? [], meta: data.meta ?? null })
      })
      .catch(() => setRentabilidad({ rows: [], meta: null }))
      .finally(() => setCargandoRentabilidad(false))
  }, [rango, productoFiltro])

  useEffect(() => {
    if (tab === 'rentabilidad') cargarRentabilidad()
  }, [tab, cargarRentabilidad])

  const cargarLabores = useCallback(() => {
    setCargandoLabores(true)
    getReporteLabores({
      ...rango,
      crop: cultivoFiltro.trim() || undefined,
    })
      .then(({ data }) => {
        setLabores({ data: data.data ?? null, meta: data.meta ?? null })
      })
      .catch(() => setLabores({ data: null, meta: null }))
      .finally(() => setCargandoLabores(false))
  }, [rango, cultivoFiltro])

  useEffect(() => {
    if (tab === 'labores') cargarLabores()
  }, [tab, cargarLabores])

  const aplicarPreset = (id) => {
    setPresetActivo(id)
    setRango(rangoPreset(id))
  }

  const handleBuscar = () => {
    if (tab === 'rentabilidad') cargarRentabilidad()
    else if (tab === 'labores') cargarLabores()
    else recargar()
  }

  const aplicarRangoManual = (campo, valor) => {
    setPresetActivo(null)
    setRango((r) => ({ ...r, [campo]: valor }))
  }

  // useApi unwraps res.data?.data — resultado is the array directly
  const datosVentas      = tab === 'ventas'      ? (resultado ?? []) : []
  const datosCompras     = tab === 'compras'     ? (resultado ?? []) : []
  const datosMovimientos = tab === 'movimientos' ? (resultado ?? []) : []
  const datosRentabilidad = tab === 'rentabilidad' ? rentabilidad.rows : []
  const metaRentabilidad = tab === 'rentabilidad' ? rentabilidad.meta : null
  const datosLabores = tab === 'labores' ? (labores.data ?? { tasks: [], by_crop: [], by_date: [] }) : null
  const metaLabores = tab === 'labores' ? labores.meta : null
  const cargandoVista = tab === 'rentabilidad' ? cargandoRentabilidad : tab === 'labores' ? cargandoLabores : cargando

  // Compute summaries inline
  const totalVentasKg    = datosVentas.reduce((s, v) => s + Number(v.quantity_kg), 0)
  const totalVentasPesos = datosVentas.reduce((s, v) => s + Number(v.total), 0)
  const totalComprasKg   = datosCompras.reduce((s, v) => s + Number(v.quantity_kg), 0)
  const totalComprasPesos = datosCompras.reduce((s, v) => s + Number(v.total), 0)

  const ventasPorProductoLista = useMemo(() => {
    const acc = datosVentas.reduce((map, v) => {
      const nombre = v.product?.name ?? 'Desconocido'
      if (!map[nombre]) map[nombre] = { quantity_kg: 0, total_pesos: 0 }
      map[nombre].quantity_kg += Number(v.quantity_kg)
      map[nombre].total_pesos += Number(v.total)
      return map
    }, {})
    return Object.entries(acc)
      .sort(([, a], [, b]) => b.total_pesos - a.total_pesos)
      .map(([nombre, vals]) => ({ nombre, ...vals }))
  }, [datosVentas])

  const pagVentasProducto = paginarLista(ventasPorProductoLista, paginaDe('ventas-producto'))
  const pagVentasDetalle = paginarLista(datosVentas, paginaDe('ventas-detalle'))
  const pagComprasDetalle = paginarLista(datosCompras, paginaDe('compras-detalle'))
  const pagRentabilidad = paginarLista(datosRentabilidad, paginaDe('rentabilidad'))
  const pagLaboresCultivo = paginarLista(datosLabores?.by_crop ?? [], paginaDe('labores-cultivo'))
  const pagLaboresFecha = paginarLista(datosLabores?.by_date ?? [], paginaDe('labores-fecha'))
  const pagLaboresDetalle = paginarLista(datosLabores?.tasks ?? [], paginaDe('labores-detalle'))
  const pagMovimientos = paginarLista(datosMovimientos, paginaDe('movimientos'))

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
            onClick={handleBuscar}
            className="shrink-0 px-3 py-2.5 bg-[#f56523] text-white rounded-lg text-sm font-medium hover:bg-[#d9541a]"
          >
            Buscar
          </button>
        </div>

        {(tab === 'movimientos' || tab === 'rentabilidad') && (
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

        {tab === 'labores' && (
          <input
            type="text"
            value={cultivoFiltro}
            onChange={(e) => setCultivoFiltro(e.target.value)}
            placeholder="Filtrar por cultivo (ej: Plátano)"
            className={inputClass}
          />
        )}
      </div>

      {/* Contenido */}
      {cargandoVista ? (
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
                  <p className="text-2xl font-bold text-[#1a365d]">{datosVentas.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Ventas</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a365d]">{totalVentasKg.toFixed(1)}</p>
                  <p className="text-xs text-gray-400 mt-1">kg vendidos</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-lg font-bold text-green-600 leading-tight">
                    {formatCOP(totalVentasPesos)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total</p>
                </div>
              </div>

              {datosVentas.length > 0 ? (
                <div
                  className={
                    ventasPorProductoLista.length > 0
                      ? 'grid md:grid-cols-2 gap-4 items-start'
                      : ''
                  }
                >
                  {ventasPorProductoLista.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
                      <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide shrink-0">
                        Por producto ({ventasPorProductoLista.length})
                      </p>
                      <div className="overflow-x-auto min-h-0">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-50 text-gray-400 uppercase">
                            <tr>
                              <th className="text-left px-3 py-2">Producto</th>
                              <th className="text-right px-3 py-2">kg</th>
                              <th className="text-right px-3 py-2">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {pagVentasProducto.items.map((row) => (
                              <tr key={row.nombre} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium text-gray-800 max-w-[8rem] truncate" title={row.nombre}>
                                  {row.nombre}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums text-gray-500 whitespace-nowrap">
                                  {Number(row.quantity_kg).toFixed(1)}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums font-semibold text-green-700 whitespace-nowrap">
                                  {formatCOP(row.total_pesos)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <PiePaginacion
                        clave="ventas-producto"
                        pag={pagVentasProducto}
                        sustantivo="producto"
                        irPagina={irPagina}
                      />
                    </div>
                  )}

                  <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
                    <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide shrink-0">
                      Detalle ({datosVentas.length})
                    </p>
                    <div className="divide-y divide-gray-50 min-h-0">
                      {pagVentasDetalle.items.map((v) => (
                        <div key={v.id} className="px-3 py-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{v.product?.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {v.customer?.name} · {Number(v.quantity_kg).toFixed(1)} kg · {SALE_TYPE_LABEL[v.sale_type] ?? v.sale_type}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold text-green-700">{formatCOP(v.total)}</p>
                            <p className="text-[11px] text-gray-400">{v.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <PiePaginacion
                      clave="ventas-detalle"
                      pag={pagVentasDetalle}
                      sustantivo="venta"
                      irPagina={irPagina}
                    />
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
                  <p className="text-2xl font-bold text-[#1a365d]">{datosCompras.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Compras</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-[#1a365d]">{totalComprasKg.toFixed(1)}</p>
                  <p className="text-xs text-gray-400 mt-1">kg comprados</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                  <p className="text-lg font-bold text-blue-600 leading-tight">
                    {formatCOP(totalComprasPesos)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Total</p>
                </div>
              </div>

              {datosCompras.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Detalle ({datosCompras.length})
                  </p>
                  <div className="divide-y divide-gray-50">
                    {pagComprasDetalle.items.map((c) => (
                      <div key={c.id} className="px-3 py-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{c.product?.name}</p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {c.supplier?.name} · {Number(c.quantity_kg).toFixed(1)} kg
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-blue-700">{formatCOP(c.total)}</p>
                          <p className="text-[11px] text-gray-400">{c.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <PiePaginacion
                    clave="compras-detalle"
                    pag={pagComprasDetalle}
                    sustantivo="compra"
                    irPagina={irPagina}
                  />
                </div>
              ) : (
                <EmptyState mensaje="Sin compras en este período" />
              )}
            </div>
          )}

          {/* ── TAB RENTABILIDAD ── */}
          {tab === 'rentabilidad' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Margen estimado del período: ventas menos compras de reventa por producto. Sin lotes
                ni costo FIFO.
              </p>

              {metaRentabilidad && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                    <p className="text-lg font-bold text-green-600 leading-tight">
                      {formatCOP(metaRentabilidad.sales_total)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Ventas</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                    <p className="text-lg font-bold text-blue-600 leading-tight">
                      {formatCOP(metaRentabilidad.purchase_total)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Compras reventa</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                    <p
                      className={`text-lg font-bold leading-tight ${
                        metaRentabilidad.margin >= 0 ? 'text-[#1a365d]' : 'text-red-600'
                      }`}
                    >
                      {formatCOP(metaRentabilidad.margin)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Margen</p>
                  </div>
                </div>
              )}

              {datosRentabilidad.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Por producto ({datosRentabilidad.length})
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[32rem]">
                      <thead className="bg-gray-50 text-gray-400 uppercase">
                        <tr>
                          <th className="text-left px-3 py-2">Producto</th>
                          <th className="text-right px-3 py-2">Kg vend.</th>
                          <th className="text-right px-3 py-2">Ventas</th>
                          <th className="text-right px-3 py-2">Kg compr.</th>
                          <th className="text-right px-3 py-2">Compras</th>
                          <th className="text-right px-3 py-2">Margen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {pagRentabilidad.items.map((r) => (
                          <tr key={r.product_id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium text-gray-800">
                              {r.product?.name ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                              {Number(r.sales_kg).toFixed(1)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-green-700">
                              {formatCOP(r.sales_total)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-gray-500">
                              {Number(r.purchase_kg).toFixed(1)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-blue-700">
                              {formatCOP(r.purchase_total)}
                            </td>
                            <td
                              className={`px-3 py-2 text-right tabular-nums font-semibold ${
                                r.margin >= 0 ? 'text-[#1a365d]' : 'text-red-600'
                              }`}
                            >
                              {formatCOP(r.margin)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PiePaginacion
                    clave="rentabilidad"
                    pag={pagRentabilidad}
                    sustantivo="producto"
                    irPagina={irPagina}
                  />
                </div>
              ) : (
                <EmptyState mensaje="Sin movimientos de venta o compra en este período" />
              )}
            </div>
          )}

          {/* ── TAB COSECHAS / LABORES ── */}
          {tab === 'labores' && (
            <div className="space-y-4">
              {metaLabores && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                    <p className="text-2xl font-bold text-[#1a365d]">{metaLabores.harvest_count}</p>
                    <p className="text-xs text-gray-400 mt-1">Cosechas</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                    <p className="text-2xl font-bold text-[#1a365d]">{Number(metaLabores.total_kg).toFixed(1)}</p>
                    <p className="text-xs text-gray-400 mt-1">kg cosechados</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                    <p className="text-2xl font-bold text-amber-600">{metaLabores.worker_entries}</p>
                    <p className="text-xs text-gray-400 mt-1">Pagos registrados</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                    <p className="text-lg font-bold text-[#1a365d] leading-tight">
                      {formatCOP(metaLabores.total_paid)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Total pagado</p>
                  </div>
                </div>
              )}

              {datosLabores?.by_crop?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Por cultivo ({datosLabores.by_crop.length})
                  </p>
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-400 uppercase">
                      <tr>
                        <th className="text-left px-3 py-2">Cultivo</th>
                        <th className="text-right px-3 py-2">Kg</th>
                        <th className="text-right px-3 py-2">Pagado</th>
                        <th className="text-center px-3 py-2">Labores</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pagLaboresCultivo.items.map((row) => (
                        <tr key={row.crop} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-800">{row.crop}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{Number(row.quantity_kg).toFixed(1)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium text-[#1a365d]">
                            {formatCOP(row.total_paid)}
                          </td>
                          <td className="px-3 py-2 text-center tabular-nums text-gray-500">{row.task_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <PiePaginacion
                    clave="labores-cultivo"
                    pag={pagLaboresCultivo}
                    sustantivo="cultivo"
                    irPagina={irPagina}
                  />
                </div>
              )}

              {datosLabores?.by_date?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Por fecha ({datosLabores.by_date.length})
                  </p>
                  <div className="divide-y divide-gray-50">
                    {pagLaboresFecha.items.map((row) => (
                      <div key={row.date} className="px-3 py-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-800">{formatFechaCorta(row.date)}</p>
                          <p className="text-[11px] text-gray-400">{row.task_count} cosecha{row.task_count !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right text-xs shrink-0">
                          <p className="font-semibold tabular-nums text-[#1a365d]">{Number(row.quantity_kg).toFixed(1)} kg</p>
                          <p className="text-[11px] text-amber-700 tabular-nums">{formatCOP(row.total_paid)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <PiePaginacion
                    clave="labores-fecha"
                    pag={pagLaboresFecha}
                    sustantivo="fecha"
                    irPagina={irPagina}
                  />
                </div>
              )}

              {datosLabores?.tasks?.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Detalle ({datosLabores.tasks.length})
                  </p>
                  <div className="divide-y divide-gray-50">
                    {pagLaboresDetalle.items.map((t) => (
                      <div key={t.id} className="px-3 py-2">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">
                              {t.crop || 'Sin cultivo'} · {formatFechaCorta(t.date)}
                            </p>
                            <p className="text-[11px] text-gray-400">{t.task_type}</p>
                          </div>
                          <div className="text-right text-xs shrink-0">
                            <p className="font-semibold tabular-nums">{Number(t.quantity_kg).toFixed(1)} kg</p>
                            <p className="text-[11px] text-amber-700">{formatCOP(t.total_paid)}</p>
                          </div>
                        </div>
                        {t.workers?.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {t.workers.map((w) => (
                              <p key={w.id} className="text-[11px] text-gray-500 flex justify-between gap-2">
                                <span className="truncate">{w.worker_name} · {PAYMENT_MODE_LABEL[w.payment_mode]}</span>
                                <span className="tabular-nums shrink-0">{formatCOP(w.total_paid)}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <PiePaginacion
                    clave="labores-detalle"
                    pag={pagLaboresDetalle}
                    sustantivo="cosecha"
                    irPagina={irPagina}
                  />
                </div>
              ) : (
                !cargandoLabores && (
                  <EmptyState mensaje="Sin cosechas registradas en este período" />
                )
              )}
            </div>
          )}

          {/* ── TAB MOVIMIENTOS ── */}
          {tab === 'movimientos' && (
            <div className="space-y-3">
              {datosMovimientos.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    {datosMovimientos.length} movimiento{datosMovimientos.length !== 1 ? 's' : ''}
                  </p>
                  <div className="divide-y divide-gray-50">
                    {pagMovimientos.items.map((m) => {
                      const tipo = MOVEMENT_TYPE_LABEL[m.type] ?? { label: m.type, color: 'text-gray-600', bg: 'bg-gray-50' }
                      const positivo = Number(m.quantity_kg) >= 0
                      return (
                        <div key={m.id} className="px-3 py-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${tipo.bg} ${tipo.color}`}>
                              {tipo.label}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-gray-800 truncate">{m.product?.name}</p>
                              <p className="text-[11px] text-gray-400">{m.date}</p>
                            </div>
                          </div>
                          <p className={`text-xs font-bold tabular-nums shrink-0 ${positivo ? 'text-green-600' : 'text-red-500'}`}>
                            {positivo ? '+' : ''}{Number(m.quantity_kg).toFixed(1)} kg
                          </p>
                        </div>
                      )
                    })}
                  </div>
                  <PiePaginacion
                    clave="movimientos"
                    pag={pagMovimientos}
                    sustantivo="movimiento"
                    irPagina={irPagina}
                  />
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

function paginarLista(lista, pagina) {
  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const paginaActual = Math.min(Math.max(1, pagina), totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  return {
    items: lista.slice(inicio, inicio + POR_PAGINA),
    pagina: paginaActual,
    totalPaginas,
    inicio,
    total: lista.length,
  }
}

function PiePaginacion({ clave, pag, sustantivo, irPagina }) {
  return (
    <div className="border-t border-gray-100 px-3 py-1.5 bg-gray-50/50">
      <Paginacion
        pagina={pag.pagina}
        totalPaginas={pag.totalPaginas}
        total={pag.total}
        totalGeneral={pag.total}
        porPagina={POR_PAGINA}
        inicio={pag.inicio}
        filtrado={false}
        sustantivo={sustantivo}
        compact
        embedded
        onAnterior={() => irPagina(clave, Math.max(1, pag.pagina - 1))}
        onSiguiente={() => irPagina(clave, Math.min(pag.totalPaginas, pag.pagina + 1))}
      />
    </div>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] bg-white'
