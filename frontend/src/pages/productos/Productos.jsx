import { useState } from 'react'
import { getProductos } from '../../api/productos'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import FormProducto from './FormProducto'

const CATEGORIA_LABEL = {
  propio:   'Propio',
  comprado: 'Comprado',
  pulpa:    'Pulpa',
}

const CATEGORIA_BADGE = {
  propio:   'bg-green-100 text-green-700',
  comprado: 'bg-blue-100 text-blue-700',
  pulpa:    'bg-orange-100 text-orange-700',
}

const FILTROS = ['todos', 'propio', 'comprado', 'pulpa']

export default function Productos() {
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [productoEditar, setProductoEditar] = useState(null)

  const { data, cargando, recargar } = useApi(getProductos)
  const todos = data?.data ?? []

  const lista = todos.filter((p) => {
    const coincideCategoria = filtro === 'todos' || p.categoria === filtro
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
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
            {f === 'todos' ? 'Todos' : CATEGORIA_LABEL[f]}
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
              <button
                key={p.id}
                type="button"
                onClick={() => handleEditar(p)}
                className="w-full bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${CATEGORIA_BADGE[p.categoria]}`}>
                      {CATEGORIA_LABEL[p.categoria]}
                    </span>
                    <span className="font-medium text-gray-800 truncate">{p.nombre}</span>
                    {!p.activo && (
                      <span className="text-xs text-gray-400 shrink-0">(inactivo)</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 ml-2 shrink-0">
                    {p.inventario ? `${Number(p.inventario.cantidad_kg).toFixed(1)} kg` : '—'}
                  </span>
                </div>
              </button>
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
                    <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIA_BADGE[p.categoria]}`}>
                        {CATEGORIA_LABEL[p.categoria]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {p.es_fruta_para_pulpa ? '✓' : '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {p.inventario ? Number(p.inventario.cantidad_kg).toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleEditar(p)}
                        className="text-xs text-[#f56523] font-medium hover:underline"
                      >
                        Editar
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
          titulo={productoEditar ? `Editar: ${productoEditar.nombre}` : 'Nuevo producto'}
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
