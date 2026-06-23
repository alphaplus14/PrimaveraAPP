import { useState } from 'react'
import { getProductos } from '../../api/productos'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import FormProducto from './FormProducto'

import { CATEGORY_LABEL, CATEGORY_BADGE } from '../../constants/enums'

const ICONO_EDITAR = '/assets/icons/editar%20icono.png'

const FILTROS = ['todos', 'own', 'purchased', 'pulp']

export default function Productos() {
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null)

  const { data, cargando, recargar } = useApi(getProductos)
  const todos = data ?? []

  const lista = todos.filter((p) => {
    const coincideCategoria = filtro === 'todos' || p.category === filtro
    const coincideBusqueda = p.name.toLowerCase().includes(busqueda.toLowerCase())
    return coincideCategoria && coincideBusqueda
  })

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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1a365d]">Productos</h2>
        <button
          onClick={handleNuevo}
          className="bg-[#f56523] text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-[#d9541a] transition-colors"
        >
          + Nuevo
        </button>
      </div>

      {/* Buscador */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] bg-white"
        />
      </div>

      {/* Filtros de categoría */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filtro === f
                ? 'bg-[#1a365d] text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            {f === 'todos' ? 'Todos' : CATEGORY_LABEL[f]}
          </button>
        ))}
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-red-50 border border-red-200 text-red-500"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

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
            {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay productos aún.'}
          </p>
          {!busqueda && (
            <button
              onClick={handleNuevo}
              className="text-sm text-[#f56523] font-medium hover:underline"
            >
              Crear primer producto →
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-2">
            {lista.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 w-full bg-white rounded-xl border border-gray-200 p-3 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => handleEditar(p)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium shrink-0 border ${CATEGORY_BADGE[p.category]}`}>
                        {CATEGORY_LABEL[p.category]}
                      </span>
                      <span className="font-medium text-gray-900 truncate">{p.name}</span>
                      {!p.active && (
                        <span className="text-xs text-gray-400 shrink-0">(inactivo)</span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-600 tabular-nums shrink-0">
                      {p.inventory ? `${Number(p.inventory.quantity_kg).toFixed(1)} kg` : '—'}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleEditar(p)}
                  aria-label={`Editar ${p.name}`}
                  className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-colors"
                >
                  <img src={ICONO_EDITAR} alt="" className="w-5 h-5 object-contain opacity-90" />
                </button>
              </div>
            ))}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Categoría</th>
                  <th className="text-center px-4 py-3">Para pulpa</th>
                  <th className="text-right px-4 py-3">Stock (kg)</th>
                  <th className="text-center px-4 py-3">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_BADGE[p.category]}`}>
                        {CATEGORY_LABEL[p.category]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {p.is_pulp_fruit ? '✓' : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {p.inventory ? Number(p.inventory.quantity_kg).toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {p.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleEditar(p)}
                        aria-label={`Editar ${p.name}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-colors"
                      >
                        <img src={ICONO_EDITAR} alt="" className="w-4 h-4 object-contain opacity-90" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-right">
            {lista.length} producto{lista.length !== 1 ? 's' : ''}
            {filtro !== 'todos' || busqueda ? ` (filtrado de ${todos.length})` : ''}
          </p>
        </>
      )}

      {mostrarForm && (
        <Modal
          titulo={productoEditar ? `Editar: ${productoEditar.name}` : 'Nuevo producto'}
          onClose={() => { setMostrarForm(false); setProductoEditar(null) }}
        >
          <FormProducto
            producto={productoEditar}
            onGuardado={handleGuardado}
            onCerrar={() => { setMostrarForm(false); setProductoEditar(null) }}
          />
        </Modal>
      )}
    </div>
  )
}
