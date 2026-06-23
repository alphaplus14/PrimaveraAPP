import { useState } from 'react'
import { getVentas } from '../../api/ventas'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import FormVenta from './FormVenta'

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const TIPO_VENTA_LABEL = { detal: 'Detal', mayorista: 'Mayorista' }

export default function Ventas() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const { data: ventas, cargando, recargar } = useApi(getVentas)

  const lista = ventas?.data ?? ventas ?? []

  const handleGuardado = () => {
    setMostrarForm(false)
    recargar()
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#1a365d]">Ventas</h2>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-[#f56523] text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-[#d9541a] transition-colors"
        >
          + Nueva venta
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
          <p className="text-4xl mb-3">💰</p>
          <p className="text-sm mb-3">No hay ventas registradas aún.</p>
          <button
            onClick={() => setMostrarForm(true)}
            className="text-sm text-[#f56523] font-medium hover:underline"
          >
            Registrar primera venta →
          </button>
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-3">
            {lista.map((v) => (
              <div key={v.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-gray-800">{v.producto?.nombre}</p>
                  <span className="font-bold text-green-600 text-sm">{formatCOP(v.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{v.cliente?.nombre} · {Number(v.cantidad_kg).toFixed(1)} kg</span>
                  <div className="flex items-center gap-1">
                    <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                      v.tipo_venta === 'mayorista' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>{TIPO_VENTA_LABEL[v.tipo_venta] ?? v.tipo_venta}</span>
                    <span>{v.fecha}</span>
                  </div>
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
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-right px-4 py-3">kg</th>
                  <th className="text-right px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{v.fecha}</td>
                    <td className="px-4 py-3 font-medium">{v.producto?.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">{v.cliente?.nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        v.tipo_venta === 'mayorista' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>{TIPO_VENTA_LABEL[v.tipo_venta] ?? v.tipo_venta}</span>
                    </td>
                    <td className="px-4 py-3 text-right">{Number(v.cantidad_kg).toFixed(1)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCOP(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nueva venta" onClose={() => setMostrarForm(false)}>
          <FormVenta onGuardado={handleGuardado} onCerrar={() => setMostrarForm(false)} />
        </Modal>
      )}
    </div>
  )
}
