import { useState } from 'react'
import { getProductos } from '../../api/productos'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import FormProducto from './FormProducto'

const CATEGORIA_LABEL = { own: 'Propio', purchased: 'Comprado', pulp: 'Pulpa' }
const CATEGORIA_BADGE = {
  own:       'bg-green-100 text-green-700',
  purchased: 'bg-blue-100 text-blue-700',
  pulp:      'bg-purple-100 text-purple-700',
}
const FILTROS = ['todos', 'own', 'purchased', 'pulp']
const FILTRO_LABEL = { todos: 'Todos', own: 'Propios', purchased: 'Comprados', pulp: 'Pulpas' }

const formatKg = (v) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(v) + ' kg'

export default function Productos() {
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [productoEditar, setProductoEditar] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const { data, cargando, recargar } = useApi(getProductos)

  const lista = (data ?? []).filter((p) => {
    const matchFiltro  = filtro === 'todos' || p.category === filtro
    const matchBusqueda = p.name.toLowerCase().includes(busqueda.toLowerCase())
    return matchFiltro && matchBusqueda
  })

  const handleGuardado = () => {
    setMostrarForm(false)
    setProductoEditar(null)
    recargar()
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a365d]">Productos</h2>
          <p className="text-xs text-gray-400 mt-0.5">Catálogo de la finca</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-[#f56523] text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-[#d9541a] transition-colors"
        >
          + Nuevo
        </button>
      </div>

      <div className="mb-4 space-y-2">
        <input
          type="search"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523]"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filtro === f ? 'bg-[#1a365d] text-white' : 'bg-white border border-gray-200 text-gray-500'
              }`}
            >
              {FILTRO_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-sm">No hay productos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lista.map((p) => (
            <div
              key={p.id}
              onClick={() => { setProductoEditar(p); setMostrarForm(true) }}
              className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORIA_BADGE[p.category]}`}>
                    {CATEGORIA_LABEL[p.category]}
                  </span>
                  {p.is_pulp_fruit && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">→ pulpa</span>
                  )}
                  {!p.active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">Inactivo</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Stock: {p.inventory ? formatKg(p.inventory.quantity_kg) : '—'}
                </p>
              </div>
              <span className="text-gray-300 text-sm">›</span>
            </div>
          ))}
        </div>
      )}

      {mostrarForm && (
        <Modal
          titulo={productoEditar ? 'Editar producto' : 'Nuevo producto'}
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
