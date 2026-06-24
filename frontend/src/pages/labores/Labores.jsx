import { useState, useEffect, useMemo } from 'react'
import { getLabores } from '../../api/labores'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import Buscador from '../../components/ui/Buscador'
import Paginacion from '../../components/ui/Paginacion'
import FormLabor from './FormLabor'
import { formatFechaCorta } from '../../lib/dashboard'

const POR_PAGINA = 15

const TIPO_ICONO = {
  Siembra: '🌱',
  Cosecha: '🧺',
  Fumigación: '💨',
  Fertilización: '🪣',
  Poda: '✂️',
  Riego: '💧',
  Limpieza: '🧹',
  'Control de plagas': '🐛',
}

const icono = (tipo) => TIPO_ICONO[tipo] ?? '🔧'

const responsable = (l) => l.responsible ?? l.assigned_to ?? null

export default function Labores() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const { data, cargando, recargar } = useApi(getLabores)

  const todos = data ?? []

  const lista = useMemo(
    () =>
      todos.filter((l) => {
        const q = busqueda.toLowerCase()
        return (
          l.task_type?.toLowerCase().includes(q) ||
          l.crop?.toLowerCase().includes(q) ||
          responsable(l)?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.supplies?.some((ins) => ins.name?.toLowerCase().includes(q))
        )
      }),
    [todos, busqueda],
  )

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const paginaItems = lista.slice(inicio, inicio + POR_PAGINA)

  useEffect(() => {
    setPagina(1)
  }, [busqueda])

  const handleGuardado = () => {
    setMostrarForm(false)
    recargar()
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a365d]">Labores</h2>
          <p className="text-xs text-gray-400 mt-0.5">Actividades en la finca</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {lista.length} labor{lista.length !== 1 ? 'es' : ''}
          </span>
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="bg-[#f56523] text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-[#d9541a] transition-colors"
          >
            + Nueva
          </button>
        </div>
      </div>

      <Buscador
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por labor, cultivo, responsable o insumo..."
        className="mb-4"
      />

      {cargando ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🌾</p>
          <p className="text-sm mb-1">
            {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay labores registradas.'}
          </p>
          {!busqueda && (
            <>
              <p className="text-xs mb-4">Registra siembras, cosechas, fumigaciones y más.</p>
              <button
                type="button"
                onClick={() => setMostrarForm(true)}
                className="text-sm text-[#f56523] font-medium hover:underline"
              >
                Registrar primera labor →
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {paginaItems.map((l) => (
              <div key={l.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{icono(l.task_type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800">{l.task_type}</p>
                      <span className="text-xs text-gray-400 shrink-0">{formatFechaCorta(l.date)}</span>
                    </div>
                    {l.crop && (
                      <p className="text-xs text-gray-500 mt-0.5">Cultivo: {l.crop}</p>
                    )}
                    {responsable(l) && (
                      <p className="text-xs text-gray-500">Responsable: {responsable(l)}</p>
                    )}
                    {l.description && (
                      <p className="text-xs text-gray-400 mt-1 truncate">{l.description}</p>
                    )}
                    {l.supplies?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {l.supplies.map((ins) => (
                          <span
                            key={ins.id}
                            className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs"
                          >
                            {ins.name} · {Number(ins.pivot?.quantity_used ?? 0).toLocaleString('es-CO')}{' '}
                            {ins.unit ?? ins.unit_of_measure}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

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
                {paginaItems.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatFechaCorta(l.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {icono(l.task_type)} {l.task_type}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.crop ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{responsable(l) ?? '—'}</td>
                    <td className="px-4 py-3">
                      {l.supplies?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {l.supplies.map((ins) => (
                            <span
                              key={ins.id}
                              className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs"
                            >
                              {ins.name} · {Number(ins.pivot?.quantity_used ?? 0).toLocaleString('es-CO')}{' '}
                              {ins.unit ?? ins.unit_of_measure}
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

          <Paginacion
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            total={lista.length}
            totalGeneral={todos.length}
            porPagina={POR_PAGINA}
            inicio={inicio}
            filtrado={!!busqueda}
            sustantivo="labor"
            onAnterior={() => setPagina((p) => Math.max(1, p - 1))}
            onSiguiente={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          />
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
