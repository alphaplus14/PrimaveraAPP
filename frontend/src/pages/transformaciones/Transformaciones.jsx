import { useState } from 'react'
import { getTransformaciones } from '../../api/transformaciones'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import FormTransformacion from './FormTransformacion'

export default function Transformaciones() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const { data, cargando, recargar } = useApi(getTransformaciones)

  // La API devuelve paginación de Laravel: { data: [...], total, ... }
  const lista = data?.data ?? data ?? []

  const handleGuardado = () => {
    setMostrarForm(false)
    recargar()
  }

  const rendimiento = (fruta, pulpa) =>
    fruta > 0 ? ((pulpa / fruta) * 100).toFixed(1) + '%' : '—'

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1a365d]">Transformaciones</h2>
          <p className="text-xs text-gray-400 mt-0.5">Fruta → Pulpa</p>
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
          <p className="text-4xl mb-3">🧃</p>
          <p className="text-sm mb-1">No hay transformaciones registradas.</p>
          <p className="text-xs mb-4">Convierte fruta en pulpa y el inventario se actualiza solo.</p>
          <button
            onClick={() => setMostrarForm(true)}
            className="text-sm text-[#f56523] font-medium hover:underline"
          >
            Registrar primera transformación →
          </button>
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-3">
            {lista.map((t) => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌿</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{t.producto_origen?.name}</p>
                      <p className="text-xs text-gray-400">{Number(t.fruit_quantity_kg).toFixed(1)} kg entrada</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{t.date}</span>
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-orange-600">🧃</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{t.producto_pulpa?.name}</p>
                    <p className="text-xs text-gray-400">{Number(t.pulp_quantity_kg).toFixed(1)} kg pulpa</p>
                  </div>
                  <span className="ml-auto text-xs font-bold text-[#1a365d]">
                    {rendimiento(Number(t.fruit_quantity_kg), Number(t.pulp_quantity_kg))}
                  </span>
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
                  <th className="text-left px-4 py-3">Fruta</th>
                  <th className="text-right px-4 py-3">kg entrada</th>
                  <th className="text-left px-4 py-3">Pulpa</th>
                  <th className="text-right px-4 py-3">kg salida</th>
                  <th className="text-right px-4 py-3">Rendimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{t.date}</td>
                    <td className="px-4 py-3 font-medium text-green-700">
                      🌿 {t.producto_origen?.name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {Number(t.fruit_quantity_kg).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 font-medium text-orange-600">
                      🧃 {t.producto_pulpa?.name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {Number(t.pulp_quantity_kg).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#1a365d]">
                      {rendimiento(Number(t.fruit_quantity_kg), Number(t.pulp_quantity_kg))}
                    </td>
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
