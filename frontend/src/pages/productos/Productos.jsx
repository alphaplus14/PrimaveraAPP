import { useState, useEffect, useMemo } from 'react'
import { getProductos, getProductosConCompras } from '../../api/productos'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import Buscador from '../../components/ui/Buscador'
import Paginacion from '../../components/ui/Paginacion'
import FormProducto from './FormProducto'
import { CATEGORY_LABEL, CATEGORY_BADGE } from '../../constants/enums'
import { formatCOP, formatKg, formatStock } from '../../lib/dashboard'

const ICONO_EDITAR = '/assets/icons/editar%20icono.png'
const FILTROS = ['todos', 'own', 'purchased', 'pulp', 'con_compras']
const POR_PAGINA = 15

const etiquetaFiltro = (f) => {
  if (f === 'todos') return 'Todos'
  if (f === 'con_compras') return 'Con compras'
  return CATEGORY_LABEL[f]
}

export default function Productos() {
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null)

  const esConCompras = filtro === 'con_compras'
  const { data, cargando, recargar } = useApi(
    () => (esConCompras ? getProductosConCompras() : getProductos()),
    [esConCompras],
  )
  const todos = data ?? []

  const lista = useMemo(
    () =>
      todos.filter((p) => {
        const coincideCategoria =
          filtro === 'todos' || filtro === 'con_compras' || p.category === filtro
        const coincideBusqueda = p.name.toLowerCase().includes(busqueda.toLowerCase())
        return coincideCategoria && coincideBusqueda
      }),
    [todos, filtro, busqueda],
  )

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const paginaItems = lista.slice(inicio, inicio + POR_PAGINA)

  useEffect(() => {
    setPagina(1)
  }, [filtro, busqueda])

  const handleGuardado = () => {
    setMostrarForm(false)
    setProductoEditar(null)
    recargar()
  }

  const handleEditar = (producto) => {
    setProductoEditar(producto)
    setMostrarForm(true)
  }

  const handleNuevo = () => {
    setProductoEditar(null)
    setMostrarForm(true)
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-[#1a365d]">Productos</h2>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {lista.length} producto{lista.length !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={handleNuevo}
            className="bg-[#f56523] text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-[#d9541a] transition-colors"
          >
            + Nuevo
          </button>
        </div>
      </div>

      <Buscador
        value={busqueda}
        onChange={setBusqueda}
        className="mb-3"
      />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
              filtro === f
                ? 'bg-[#1a365d] text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {etiquetaFiltro(f)}
          </button>
        ))}
      </div>

      {esConCompras && (
        <p className="text-xs text-gray-500 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <strong className="text-amber-800">Comprado</strong> es la categoría del catálogo.{' '}
          <strong className="text-amber-800">Con compras</strong> muestra solo productos con compras
          de reventa registradas y el total acumulado en la base de datos.
        </p>
      )}

      {cargando ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-sm mb-3">
            {busqueda
              ? `Sin resultados para "${busqueda}"`
              : esConCompras
                ? 'Ningún producto tiene compras de reventa registradas.'
                : 'No hay productos aún.'}
          </p>
          {!busqueda && !esConCompras && (
            <button
              type="button"
              onClick={handleNuevo}
              className="text-sm text-[#f56523] font-medium hover:underline"
            >
              Crear primer producto →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {paginaItems.map((p) => (
              <FilaProductoMovil
                key={p.id}
                producto={p}
                onEditar={handleEditar}
                mostrarCompras={esConCompras}
              />
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  {esConCompras ? (
                    <>
                      <th className="text-right px-4 py-3">Kg comprados</th>
                      <th className="text-right px-4 py-3">Total compras</th>
                      <th className="text-center px-4 py-3">Nº compras</th>
                    </>
                  ) : (
                    <>
                      <th className="text-center px-4 py-3">Para pulpa</th>
                      <th className="text-right px-4 py-3">Stock</th>
                    </>
                  )}
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginaItems.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BADGE[p.category]}`}
                      >
                        {CATEGORY_LABEL[p.category]}
                      </span>
                    </td>
                    {esConCompras ? (
                      <>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                          {formatKg(p.purchase_summary?.purchased_kg)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-[#1a365d]">
                          {formatCOP(p.purchase_summary?.purchased_total)}
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-600">
                          {p.purchase_summary?.purchase_count ?? 0}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-center text-gray-400">
                          {p.is_pulp_fruit ? '✓' : '—'}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                          {p.inventory
                            ? formatStock(p, p.inventory.quantity_kg)
                            : '—'}
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {p.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <BotonEditar producto={p} onClick={() => handleEditar(p)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            total={lista.length}
            totalGeneral={todos.length}
            porPagina={POR_PAGINA}
            inicio={inicio}
            filtrado={filtro !== 'todos' || !!busqueda}
            sustantivo="producto"
            onAnterior={() => setPagina((p) => Math.max(1, p - 1))}
            onSiguiente={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          />
        </>
      )}

      {mostrarForm && (
        <Modal
          titulo={productoEditar ? `Editar: ${productoEditar.name}` : 'Nuevo producto'}
          onClose={() => {
            setMostrarForm(false)
            setProductoEditar(null)
          }}
        >
          <FormProducto
            producto={productoEditar}
            onGuardado={handleGuardado}
            onCerrar={() => {
              setMostrarForm(false)
              setProductoEditar(null)
            }}
          />
        </Modal>
      )}
    </div>
  )
}

function BotonEditar({ producto, onClick, className = 'w-9 h-9' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Editar ${producto.name}`}
      className={`inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-orange-50 hover:border-orange-200 active:bg-orange-50 transition-colors ${className}`}
    >
      <img src={ICONO_EDITAR} alt="" className="w-4 h-4 object-contain opacity-80" />
    </button>
  )
}

function FilaProductoMovil({ producto: p, onEditar, mostrarCompras = false }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onEditar(p)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${CATEGORY_BADGE[p.category]}`}
            >
              {CATEGORY_LABEL[p.category]}
            </span>
            {!p.active && (
              <span className="text-xs text-gray-400">Inactivo</span>
            )}
            {!mostrarCompras && p.is_pulp_fruit && (
              <span className="text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Pulpa</span>
            )}
          </div>
          <p className="font-semibold text-gray-800 truncate">{p.name}</p>
          {mostrarCompras ? (
            <p className="text-xs text-gray-500 mt-1 space-y-0.5">
              <span className="block">
                Comprado: {formatKg(p.purchase_summary?.purchased_kg)}
              </span>
              <span className="block font-medium text-[#1a365d]">
                {formatCOP(p.purchase_summary?.purchased_total)} ·{' '}
                {p.purchase_summary?.purchase_count ?? 0} compra
                {(p.purchase_summary?.purchase_count ?? 0) !== 1 ? 's' : ''}
              </span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">
              Stock:{' '}
              <span className="font-medium text-gray-600 tabular-nums">
                {p.inventory
                  ? formatStock(p, p.inventory.quantity_kg)
                  : '—'}
              </span>
            </p>
          )}
        </button>
        <BotonEditar producto={p} onClick={() => onEditar(p)} className="w-10 h-10 shrink-0" />
      </div>
    </div>
  )
}
