import { useState, useEffect, useCallback } from 'react'
import Swal from 'sweetalert2'
import { getTransformaciones } from '../../api/transformaciones'
import Modal from '../../components/ui/Modal'
import FormTransformacion from './FormTransformacion'

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
  const [perPage, setPerPage] = useState(10)
  const [pagina, setPagina] = useState(1)

  const [lista, setLista] = useState([])
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async (page = 1) => {
    setCargando(true)
    try {
      const params = { page, per_page: perPage }
      if (filtroActivo) { params.desde = desde; params.hasta = hasta }
      if (busqueda.trim()) params.busqueda = busqueda.trim()
      const res = await getTransformaciones(params)
      const paginado = res.data
      setLista(paginado.data ?? [])
      setMeta({
        currentPage: paginado.current_page ?? 1,
        lastPage: paginado.last_page ?? 1,
        total: paginado.total ?? 0,
      })
      setPagina(paginado.current_page ?? 1)
    } catch {
      Swal.fire({ icon: 'error', title: 'Error al cargar transformaciones', confirmButtonColor: '#1a365d' })
    } finally {
      setCargando(false)
    }
  }, [filtroActivo, desde, hasta, busqueda, perPage])

  useEffect(() => { cargar(1) }, [cargar])

  const handleGuardado = () => {
    setMostrarForm(false)
    cargar(1)
  }

  const aplicarFiltro = () => {
    if (!desde || !hasta) {
      Swal.fire({ icon: 'warning', title: 'Selecciona ambas fechas', confirmButtonColor: '#f56523' })
      return
    }
    setFiltroActivo(true)
  }

  const limpiarFiltro = () => {
    setFiltroActivo(false)
    setDesde(inicioMes())
    setHasta(hoy())
    setBusqueda('')
  }

  const irAPagina = (p) => {
    if (p < 1 || p > meta.lastPage) return
    cargar(p)
  }

  const pageNumbers = () => {
    const pages = []
    const start = Math.max(1, meta.currentPage - 2)
    const end = Math.min(meta.lastPage, meta.currentPage + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por fruta o pulpa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cargar(1)}
            className={`${inputClass} flex-1`}
          />
          {/* Registros por página */}
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#f56523]"
          >
            <option value={5}>5/pág</option>
            <option value={10}>10/pág</option>
            <option value={25}>25/pág</option>
          </select>
        </div>

        {/* Rango de fechas */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <span className="text-gray-400 text-sm shrink-0">→</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={aplicarFiltro}
            className="shrink-0 px-3 py-2.5 bg-[#1a365d] text-white rounded-lg text-sm font-medium hover:bg-[#122947]"
          >
            Filtrar
          </button>
          {filtroActivo && (
            <button
              onClick={limpiarFiltro}
              className="shrink-0 px-3 py-2.5 border border-gray-300 text-gray-500 rounded-lg text-sm hover:bg-gray-50"
            >
              ✕
            </button>
          )}
        </div>

        {filtroActivo && (
          <p className="text-xs text-[#1a365d] font-medium">
            Mostrando desde {desde} hasta {hasta}
          </p>
        )}
      </div>

      {/* Contenido */}
      {cargando ? (
        <div className="space-y-3">
          {[...Array(perPage)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🧃</p>
          {busqueda || filtroActivo ? (
            <>
              <p className="text-sm mb-1">Sin resultados para este filtro.</p>
              <button onClick={limpiarFiltro} className="text-sm text-[#f56523] font-medium hover:underline mt-2">
                Limpiar filtros
              </button>
            </>
          ) : (
            <>
              <p className="text-sm mb-1">No hay transformaciones registradas.</p>
              <p className="text-xs mb-4">Convierte fruta en pulpa y el inventario se actualiza solo.</p>
              <button onClick={() => setMostrarForm(true)} className="text-sm text-[#f56523] font-medium hover:underline">
                Registrar primera transformación →
              </button>
            </>
          )}
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
                  <span className="text-xs text-gray-400 shrink-0">{t.date}</span>
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>🧃</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{t.producto_pulpa?.name}</p>
                    <p className="text-xs text-gray-400">
                      {t.pulp_quantity_packages} paquetes · {kgPorPaquete(Number(t.fruit_quantity_kg), t.pulp_quantity_packages)} kg/paq
                    </p>
                  </div>
                </div>
                {t.notes && <p className="text-xs text-gray-400 mt-2 pl-8 italic">"{t.notes}"</p>}
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
                  <th className="text-right px-4 py-3">Paquetes</th>
                  <th className="text-right px-4 py-3">kg/paquete</th>
                  <th className="text-left px-4 py-3">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{t.date}</td>
                    <td className="px-4 py-3 font-medium text-green-700 whitespace-nowrap">🌿 {t.producto_origen?.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{Number(t.fruit_quantity_kg).toFixed(1)}</td>
                    <td className="px-4 py-3 font-medium text-orange-600 whitespace-nowrap">🧃 {t.producto_pulpa?.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{t.pulp_quantity_packages} paq</td>
                    <td className="px-4 py-3 text-right font-bold text-[#1a365d]">
                      {kgPorPaquete(Number(t.fruit_quantity_kg), t.pulp_quantity_packages)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{t.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-400">
              {meta.total} registro{meta.total !== 1 ? 's' : ''} · página {meta.currentPage} de {meta.lastPage}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => irAPagina(meta.currentPage - 1)}
                disabled={meta.currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => irAPagina(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    p === meta.currentPage
                      ? 'bg-[#1a365d] text-white'
                      : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => irAPagina(meta.currentPage + 1)}
                disabled={meta.currentPage === meta.lastPage}
                className="px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
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

const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] bg-white'
