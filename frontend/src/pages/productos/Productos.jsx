import { useEffect, useState } from 'react'
import { getProductos } from '../../api/productos'

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getProductos()
      .then(({ data }) => setProductos(data.data))
      .finally(() => setCargando(false))
  }, [])

  const categoriaColor = {
    propio: 'bg-green-100 text-green-700',
    comprado: 'bg-blue-100 text-blue-700',
    pulpa: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1a365d]">Productos</h2>
        <button className="bg-[#f56523] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#d9541a] transition-colors">
          + Nuevo
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Categoría</th>
                <th className="text-right px-4 py-3">Stock (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoriaColor[p.categoria]}`}>
                      {p.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {p.inventario ? Number(p.inventario.cantidad_kg).toLocaleString('es-CO') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
