import { useState } from 'react'
import { getCompras } from '../../api/compras'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import FormCompra from './FormCompra'

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function Compras() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const { data: compras, cargando, recargar } = useApi(getCompras)

  const lista = compras?.data ?? compras ?? []

  const handleGuardado = () => {
    setMostrarForm(false)
    recargar()
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1a365d]">Compras</h2>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-[#f56523] text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-[#d9541a] transition-colors"
        >
          + Nueva compra
        </button>
      </div>

      {cargando ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-sm mb-3">No hay compras registradas aún.</p>
          <button
            onClick={() => setMostrarForm(true)}
            className="text-sm text-[#f56523] font-medium hover:underline"
          >
            Registrar primera compra →
          </button>
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-3">
            {lista.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-gray-800">{c.product?.name}</p>
                  <span className="font-bold text-blue-600 text-sm">{formatCOP(c.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{c.supplier?.name} · {Number(c.quantity_kg).toFixed(1)} kg</span>
                  <span>{c.date}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Producto</th>
                  <th className="text-left px-4 py-3">Proveedor</th>
                  <th className="text-right px-4 py-3">kg</th>
                  <th className="text-right px-4 py-3">$/kg</th>
                  <th className="text-right px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{c.date}</td>
                    <td className="px-4 py-3 font-medium">{c.product?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.supplier?.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(c.quantity_kg).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-500">{formatCOP(c.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatCOP(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nueva compra" onClose={() => setMostrarForm(false)}>
          <FormCompra onGuardado={handleGuardado} onCerrar={() => setMostrarForm(false)} />
        </Modal>
      )}
    </div>
  )
}
