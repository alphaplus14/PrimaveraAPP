import { useState } from 'react'
import { getTransformaciones } from '../../api/transformaciones'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import FormTransformacion from './FormTransformacion'

const formatKg = (v) =>
  new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(v) + ' kg'

export default function Transformaciones() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const { data, cargando, recargar } = useApi(getTransformaciones)

  const lista = data ?? []

  const handleGuardado = () => {
    setMostrarForm(false)
    recargar()
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1a365d]">Transformaciones</h2>
          <p className="text-xs text-gray-400 mt-0.5">Fruta convertida en pulpa</p>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-[#f56523] text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-[#d9541a] transition-colors"
        >
          + Nueva
        </button>
      </div>

      {cargando ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🫙</p>
          <p className="text-sm mb-4">No hay transformaciones registradas.</p>
          <button
            onClick={() => setMostrarForm(true)}
            className="text-sm text-[#f56523] font-medium hover:underline"
          >
            Registrar primera transformación →
          </button>
        </div>
      ) : (
        <>
          {/* Móvil */}
          <div className="md:hidden space-y-3">
            {lista.map((t) => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{t.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{t.source_product?.name}</span>
                  <span className="text-gray-400 text-xs">{formatKg(t.fruit_quantity_kg)}</span>
                  <span className="text-gray-300">→</span>
                  <span className="font-medium text-purple-700">{t.pulp_product?.name}</span>
                  <span className="text-gray-400 text-xs">{formatKg(t.pulp_quantity_kg)}</span>
                </div>
                {t.notes && <p className="text-xs text-gray-400 mt-1">{t.notes}</p>}
              </div>
            ))}
          </div>

          {/* Desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Fruta origen</th>
                  <th className="text-left px-4 py-3">Cantidad fruta</th>
                  <th className="text-left px-4 py-3">Pulpa obtenida</th>
                  <th className="text-left px-4 py-3">Cantidad pulpa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 font-medium">{t.source_product?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{formatKg(t.fruit_quantity_kg)}</td>
                    <td className="px-4 py-3 font-medium text-purple-700">{t.pulp_product?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{formatKg(t.pulp_quantity_kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nueva transformación" onClose={() => setMostrarForm(false)}>
          <FormTransformacion onGuardado={handleGuardado} onCerrar={() => setMostrarForm(false)} />
        </Modal>
      )}
    </div>
  )
}
