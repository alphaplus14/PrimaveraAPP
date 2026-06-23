import { useState } from 'react'
import { getLabores } from '../../api/labores'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import FormLabor from './FormLabor'

const TIPO_ICONO = {
  'Siembra': '🌱',
  'Cosecha': '🧺',
  'Fumigación': '💨',
  'Fertilización': '🪣',
  'Poda': '✂️',
  'Riego': '💧',
  'Limpieza': '🧹',
  'Control de plagas': '🐛',
}

const icono = (tipo) => TIPO_ICONO[tipo] ?? '🔧'

export default function Labores() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const { data, cargando, recargar } = useApi(getLabores)

  const lista = data?.data ?? []

  const handleGuardado = () => {
    setMostrarForm(false)
    recargar()
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1a365d]">Labores</h2>
          <p className="text-xs text-gray-400 mt-0.5">Actividades en la finca</p>
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
          <p className="text-4xl mb-3">🌾</p>
          <p className="text-sm mb-1">No hay labores registradas.</p>
          <p className="text-xs mb-4">Registra siembras, cosechas, fumigaciones y más.</p>
          <button
            onClick={() => setMostrarForm(true)}
            className="text-sm text-[#f56523] font-medium hover:underline"
          >
            Registrar primera labor →
          </button>
        </div>
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <div className="md:hidden space-y-3">
            {lista.map((l) => (
              <div key={l.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{icono(l.tipo_labor)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">{l.tipo_labor}</p>
                      <span className="text-xs text-gray-400">{l.fecha}</span>
                    </div>
                    {l.cultivo && (
                      <p className="text-xs text-gray-500 mt-0.5">Cultivo: {l.cultivo}</p>
                    )}
                    {l.responsable && (
                      <p className="text-xs text-gray-500">Responsable: {l.responsable}</p>
                    )}
                    {l.descripcion && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{l.descripcion}</p>
                    )}
                    {l.insumos?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {l.insumos.map((ins) => (
                          <span
                            key={ins.id}
                            className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs"
                          >
                            {ins.nombre} · {Number(ins.pivot?.cantidad_usada ?? 0).toLocaleString('es-CO')} {ins.unidad_medida}
                          </span>
                        ))}
                      </div>
                    )}
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
                  <th className="text-left px-4 py-3">Labor</th>
                  <th className="text-left px-4 py-3">Cultivo</th>
                  <th className="text-left px-4 py-3">Responsable</th>
                  <th className="text-left px-4 py-3">Insumos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{l.fecha}</td>
                    <td className="px-4 py-3 font-medium">
                      {icono(l.tipo_labor)} {l.tipo_labor}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.cultivo ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{l.responsable ?? '—'}</td>
                    <td className="px-4 py-3">
                      {l.insumos?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {l.insumos.map((ins) => (
                            <span
                              key={ins.id}
                              className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs"
                            >
                              {ins.nombre} · {Number(ins.pivot?.cantidad_usada ?? 0).toLocaleString('es-CO')} {ins.unidad_medida}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mostrarForm && (
        <Modal titulo="Nueva labor" onClose={() => setMostrarForm(false)}>
          <FormLabor onGuardado={handleGuardado} onCerrar={() => setMostrarForm(false)} />
        </Modal>
      )}
    </div>
  )
}
