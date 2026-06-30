import { useState, useEffect, useCallback } from 'react'
import { getTransformaciones } from '../../api/transformaciones'
import Modal from '../../components/ui/Modal'
import Buscador from '../../components/ui/Buscador'
import Paginacion from '../../components/ui/Paginacion'
import FormTransformacion from './FormTransformacion'
import { formatFechaCorta } from '../../lib/dashboard'

const POR_PAGINA = 10

const hoy = () => new Date().toISOString().split('T')[0]
const inicioMes = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const kgPorPaquete = (fruta, paquetes) =>
  paquetes > 0 ? (fruta / paquetes).toFixed(2) : '—'

export default function Transformaciones() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [desde, setDesde] = useState(inicioMes())
  const [hasta, setHasta] = useState(hoy())
  const [filtroActivo, setFiltroActivo] = useState(false)
  const [errorFiltro, setErrorFiltro] = useState(null)

  const [lista, setLista] = useState([])
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async (page = 1) => {
    setCargando(true)
    try {
      const params = { page, per_page: POR_PAGINA }
      if (filtroActivo) {
        params.desde = desde
        params.hasta = hasta
      }
      if (busqueda.trim()) params.busqueda = busqueda.trim()
      const res = await getTransformaciones(params)
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
  }, [filtroActivo, desde, hasta, busqueda])

  useEffect(() => {
    cargar(1)
  }, [cargar])

  const handleGuardado = () => {
    setMostrarForm(false)
    cargar(1)
  }

  const aplicarFiltro = () => {
    if (!desde || !hasta) {
      setErrorFiltro('Selecciona ambas fechas.')
      return
    }
    setErrorFiltro(null)
    setFiltroActivo(true)
  }

  const limpiarFiltro = () => {
    setFiltroActivo(false)
    setDesde(inicioMes())
    setHasta(hoy())
    setBusqueda('')
    setErrorFiltro(null)
  }

  const inicio = (meta.currentPage - 1) * POR_PAGINA
  const hayFiltros = !!busqueda.trim() || filtroActivo

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a365d]">Transformaciones</h2>
          <p className="text-xs text-gray-400 mt-0.5">Fruta → pulpa</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {meta.total} transformación{meta.total !== 1 ? 'es' : ''}
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
        placeholder="Buscar por fruta o pulpa..."
        className="mb-3"
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className={inputClass}
          aria-label="Desde"
        />
        <span className="text-gray-300 text-sm shrink-0">—</span>
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className={inputClass}
          aria-label="Hasta"
        />
        <button
          type="button"
          onClick={aplicarFiltro}
          className="shrink-0 px-3 py-2.5 bg-[#1a365d] text-white rounded-xl text-sm font-medium hover:bg-[#152c4d] transition-colors"
        >
          Filtrar fechas
        </button>
        {filtroActivo && (
          <button
            type="button"
            onClick={limpiarFiltro}
            className="shrink-0 px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors"
          >
            Limpiar
          </button>
        )}
      </div>

      {errorFiltro && (
        <p className="text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {errorFiltro}
        </p>
      )}

      {filtroActivo && !errorFiltro && (
        <p className="text-xs text-gray-400 mb-4 -mt-2">
          Mostrando del {formatFechaCorta(desde)} al {formatFechaCorta(hasta)}
        </p>
      )}

      {cargando ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🧃</p>
          <p className="text-sm mb-1">
            {hayFiltros ? 'Sin resultados para este filtro.' : 'No hay transformaciones registradas.'}
          </p>
          {hayFiltros ? (
            <button
              type="button"
              onClick={limpiarFiltro}
              className="text-sm text-[#f56523] font-medium hover:underline mt-2"
            >
              Limpiar filtros
            </button>
          ) : (
            <>
              <p className="text-xs mb-4">Convierte fruta en pulpa y el inventario se actualiza solo.</p>
              <button
                type="button"
                onClick={() => setMostrarForm(true)}
                className="text-sm text-[#f56523] font-medium hover:underline"
              >
                Registrar primera transformación →
              </button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {lista.map((t) => (
              <div key={t.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {t.source_product?.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      → {t.pulp_product?.name}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatFechaCorta(t.date)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs gap-2">
                  <span className="text-gray-500">
                    {Number(t.fruit_quantity_kg).toFixed(1)} kg fruta
                  </span>
                  <span className="font-semibold text-[#f56523]">
                    {t.pulp_quantity_packages} paq
                    <span className="font-normal text-gray-400 ml-1">
                      · {kgPorPaquete(Number(t.fruit_quantity_kg), t.pulp_quantity_packages)} kg/paq
                    </span>
                  </span>
                </div>
                {t.notes && (
                  <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100 truncate">
                    {t.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="text-left px-3 py-2">Fecha</th>
                  <th className="text-left px-3 py-2">Fruta</th>
                  <th className="text-right px-3 py-2">kg entrada</th>
                  <th className="text-left px-3 py-2">Pulpa</th>
                  <th className="text-right px-3 py-2">Paquetes</th>
                  <th className="text-right px-3 py-2">kg/paq</th>
                  <th className="text-left px-3 py-2">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {formatFechaCorta(t.date)}
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {t.source_product?.name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                      {Number(t.fruit_quantity_kg).toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-gray-800">{t.pulp_product?.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium text-[#f56523]">
                      {t.pulp_quantity_packages}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                      {kgPorPaquete(Number(t.fruit_quantity_kg), t.pulp_quantity_packages)}
                    </td>
                    <td className="px-3 py-2 text-gray-400 max-w-[10rem] truncate">
                      {t.notes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-gray-100 px-3 py-1.5 bg-gray-50/50">
              <Paginacion
                pagina={meta.currentPage}
                totalPaginas={meta.lastPage}
                total={meta.total}
                totalGeneral={meta.total}
                porPagina={POR_PAGINA}
                inicio={inicio}
                filtrado={hayFiltros}
                sustantivo="transformación"
                compact
                embedded
                onAnterior={() => cargar(meta.currentPage - 1)}
                onSiguiente={() => cargar(meta.currentPage + 1)}
              />
            </div>
          </div>

          <div className="md:hidden">
            <Paginacion
              pagina={meta.currentPage}
              totalPaginas={meta.lastPage}
              total={meta.total}
              totalGeneral={meta.total}
              porPagina={POR_PAGINA}
              inicio={inicio}
              filtrado={hayFiltros}
              sustantivo="transformación"
              compact
              onAnterior={() => cargar(meta.currentPage - 1)}
              onSiguiente={() => cargar(meta.currentPage + 1)}
            />
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

const inputClass =
  'border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent'
