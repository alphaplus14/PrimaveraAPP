import { useEffect, useState } from 'react'
import { getCompras } from '../../api/compras'

export default function Compras() {
  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getCompras()
      .then(({ data }) => setCompras(data.data))
      .finally(() => setCargando(false))
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1a365d]">Compras</h2>
        <button className="bg-[#f56523] text-white text-sm px-4 py-2 rounded-lg hover:bg-[#d9541a] transition-colors">
          + Registrar compra
        </button>
      </div>

      {cargando ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : compras.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-sm">No hay compras registradas aún.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Producto</th>
                <th className="text-left px-4 py-3">Proveedor</th>
                <th className="text-right px-4 py-3">kg</th>
                <th className="text-right px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {compras.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{c.fecha}</td>
                  <td className="px-4 py-3 font-medium">{c.producto?.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{c.proveedor?.nombre}</td>
                  <td className="px-4 py-3 text-right">{Number(c.cantidad_kg).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">
                    ${Number(c.total).toLocaleString('es-CO')}
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
