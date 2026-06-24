import { useState, useEffect, useCallback } from 'react'
import { getLabores } from '../../api/labores'
import Modal from '../../components/ui/Modal'
import Buscador from '../../components/ui/Buscador'
import Paginacion from '../../components/ui/Paginacion'
import FormLabor from './FormLabor'
import { iconoLabor } from '../../lib/taskTypes'
import { formatFechaCorta } from '../../lib/dashboard'

const ICONO_EDITAR = '/assets/icons/editar%20icono.png'
const POR_PAGINA = 15

const responsable = (l) => l.responsible ?? l.assigned_to ?? null

const metaLinea = (labor) => {
  const partes = [labor.crop, responsable(labor)].filter(Boolean)
  return partes.length ? partes.join(' · ') : null
}

const resumenInsumos = (supplies) => {
  if (!supplies?.length) return null
  const fmt = (ins) => {
    const qty = Number(ins.pivot?.quantity_used ?? 0).toLocaleString('es-CO')
    const unit = ins.unit ?? ins.unit_of_measure ?? ''
    return `${ins.name} ${qty} ${unit}`.trim()
  }
  if (supplies.length === 1) return fmt(supplies[0])
  return `${supplies.length} insumos · ${supplies.map((s) => s.name).join(', ')}`
}

export default function Labores() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [laborEditar, setLaborEditar] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [lista, setLista] = useState([])
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async (page = 1) => {
    setCargando(true)
    try {
      const params = { page, per_page: POR_PAGINA }
      if (busqueda.trim()) params.busqueda = busqueda.trim()
      const res = await getLabores(params)
      const paginado = res.data
      setLista(paginado.data ?? [])
      setMeta({
        currentPage: paginado.current_page ?? 1,
        lastPage: paginado.last_page ?? 1,
        total: paginado.total ?? 0,
      })
    } catch {
      setLista([])
      setMeta({ currentPage: 1, lastPage: 1, total: 0 })
    } finally {
      setCargando(false)
    }
  }, [busqueda])

  useEffect(() => {
    cargar(1)
  }, [cargar])

  const handleGuardado = () => {
    setMostrarForm(false)
    setLaborEditar(null)
    cargar(meta.currentPage)
  }

  const handleNuevo = () => {
    setLaborEditar(null)
    setMostrarForm(true)
  }

  const handleEditar = (labor) => {
    setLaborEditar(labor)
    setMostrarForm(true)
  }

  const cerrarModal = () => {
    setMostrarForm(false)
    setLaborEditar(null)
  }

  const inicio = (meta.currentPage - 1) * POR_PAGINA

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a365d]">Labores</h2>
          <p className="text-xs text-gray-400 mt-0.5">Actividades en la finca</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {meta.total} labor{meta.total !== 1 ? 'es' : ''}
          </span>
          <button
            type="button"
            onClick={handleNuevo}
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
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
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
                onClick={handleNuevo}
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
            {lista.map((l) => (
              <FilaLaborMovil key={l.id} labor={l} onEditar={handleEditar} />
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
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatFechaCorta(l.date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <span className="mr-1">{iconoLabor(l.task_type)}</span>
                      {l.task_type}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{l.crop ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{responsable(l) ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                      {l.supplies?.length > 0 ? (
                        <span className="line-clamp-2">{resumenInsumos(l.supplies)}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <BotonEditar labor={l} onClick={() => handleEditar(l)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion
            pagina={meta.currentPage}
            totalPaginas={meta.lastPage}
            total={meta.total}
            totalGeneral={meta.total}
            porPagina={POR_PAGINA}
            inicio={inicio}
            filtrado={!!busqueda}
            sustantivo="labor"
            onAnterior={() => cargar(meta.currentPage - 1)}
            onSiguiente={() => cargar(meta.currentPage + 1)}
          />
        </>
      )}

      {mostrarForm && (
        <Modal
          titulo={laborEditar ? `Editar: ${laborEditar.task_type}` : 'Nueva labor'}
          onClose={cerrarModal}
        >
          <FormLabor labor={laborEditar} onGuardado={handleGuardado} onCerrar={cerrarModal} />
        </Modal>
      )}
    </div>
  )
}

function FilaLaborMovil({ labor: l, onEditar }) {
  const meta = metaLinea(l)
  const insumos = resumenInsumos(l.supplies)

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onEditar(l)}
          className="flex-1 min-w-0 text-left"
        >
          <p className="font-semibold text-gray-800 leading-snug">
            <span className="mr-1">{iconoLabor(l.task_type)}</span>
            {l.task_type}
          </p>

          <div className="flex justify-between items-center gap-2 mt-1.5 text-xs text-gray-400">
            <span className="truncate min-w-0">{meta ?? 'Sin cultivo ni responsable'}</span>
            <span className="shrink-0">{formatFechaCorta(l.date)}</span>
          </div>

          {insumos && (
            <p className="text-xs text-[#f56523] font-medium mt-1 truncate">{insumos}</p>
          )}

          {l.description && (
            <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
              {l.description}
            </p>
          )}
        </button>

        <BotonEditar labor={l} onClick={() => onEditar(l)} className="w-10 h-10 shrink-0" />
      </div>
    </div>
  )
}

function BotonEditar({ labor, onClick, className = 'w-9 h-9' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Editar labor ${labor.task_type}`}
      className={`inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-orange-50 hover:border-orange-200 active:bg-orange-50 transition-colors ${className}`}
    >
      <img src={ICONO_EDITAR} alt="" className="w-4 h-4 object-contain opacity-80" />
    </button>
  )
}
