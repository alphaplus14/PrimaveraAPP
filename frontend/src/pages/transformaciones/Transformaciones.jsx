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
      Swal.fire({ icon: 'error', title: 'Error al cargar transformaciones', confirmButtonColor: '#6366F1' })
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
      Swal.fire({ icon: 'warning', title: 'Selecciona ambas fechas', confirmButtonColor: '#6366F1' })
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
    <div className="p-4 md:p-6 pb-24 md:pb-6 min-h-full bg-[#F8F9FA]">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <img
              src="/assets/icons/transformaciones%20icon.png"
              alt=""
              className="w-6 h-6 object-contain opacity-80"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Transformaciones</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fruta → Pulpa</p>
          </div>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
          className="bg-[#6366F1] text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-[#5C27FE] transition-colors shadow-sm"
        >
          + Nueva
        </button>
      </div>

      {/* Stat card */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl p-4 border border-indigo-100 bg-white shadow-sm">
          <span className="text-xs font-medium text-slate-500">Total registros</span>
          <p className="text-2xl font-bold text-[#5C27FE] leading-tight mt-1">{meta.total}</p>
          <p className="text-xs text-indigo-400 mt-1">transformaciones</p>
        </div>
        <div className="rounded-2xl p-4 border border-emerald-100 bg-white shadow-sm">
          <span className="text-xs font-medium text-slate-500">Esta página</span>
          <p className="text-2xl font-bold text-[#10B981] leading-tight mt-1">{lista.length}</p>
          <p className="text-xs text-emerald-400 mt-1">registros visibles</p>
        </div>
        <div className="hidden sm:block rounded-2xl p-4 border border-amber-100 bg-white shadow-sm">
          <span className="text-xs font-medium text-slate-500">Paquetes este mes</span>
          <p className="text-2xl font-bold text-[#F59E0B] leading-tight mt-1">
            {lista.reduce((s, t) => s + (t.pulp_quantity_packages ?? 0), 0)}
          </p>
          <p className="text-xs text-amber-400 mt-1">en vista actual</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por fruta o pulpa..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && cargar(1)}
            className={`${inputClass} flex-1`}
          />
          <select
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value={5}>5/pág</option>
            <option value={10}>10/pág</option>
            <option value={25}>25/pág</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <span className="text-slate-300 text-sm shrink-0">→</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className={`${inputClass} flex-1`}
          />
          <button
            onClick={aplicarFiltro}
            className="shrink-0 px-3 py-2.5 bg-[#6366F1] text-white rounded-xl text-sm font-medium hover:bg-[#5C27FE] transition-colors"
          >
            Filtrar
          </button>
          {filtroActivo && (
            <button
              onClick={limpiarFiltro}
              className="shrink-0 px-3 py-2.5 border border-slate-200 text-slate-400 rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {filtroActivo && (
          <p className="text-xs text-indigo-500 font-medium">
            Filtrando: {desde} → {hasta}
          </p>
        )}
      </div>

      {/* Contenido */}
      {cargando ? (
        <div className="space-y-3">
          {[...Array(perPage)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
            <img src="/assets/icons/transformaciones%20icon.png" alt="" className="w-9 h-9 object-contain opacity-60" />
          </div>
          {busqueda || filtroActivo ? (
            <>
              <p className="text-sm text-slate-500 mb-1">Sin resultados para este filtro.</p>
              <button onClick={limpiarFiltro} className="text-sm text-indigo-500 font-medium hover:underline mt-2">
                Limpiar filtros
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-600 mb-1">No hay transformaciones registradas</p>
              <p className="text-xs text-slate-400 mb-4">Convierte fruta en pulpa y el inventario se actualiza solo.</p>
              <button
                onClick={() => setMostrarForm(true)}
                className="text-sm text-[#6366F1] font-medium hover:underline"
              >
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
              <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-base">🌿</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.source_product?.name}</p>
                      <p className="text-xs text-slate-400">{Number(t.fruit_quantity_kg).toFixed(1)} kg entrada</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{t.date}</span>
                </div>

                <div className="flex items-center gap-1 ml-1 mb-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-base">🧃</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{t.pulp_product?.name}</p>
                    <p className="text-xs text-slate-400">
                      {t.pulp_quantity_packages} paquetes · {kgPorPaquete(Number(t.fruit_quantity_kg), t.pulp_quantity_packages)} kg/paq
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#6366F1] bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg shrink-0">
                    {t.pulp_quantity_packages} paq
                  </span>
                </div>

                {t.notes && (
                  <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-50 italic">"{t.notes}"</p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: tabla */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase border-b border-slate-100">
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
              <tbody className="divide-y divide-slate-50">
                {lista.map((t) => (
                  <tr key={t.id} className="hover:bg-[#F3F0FF]/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{t.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-green-700 font-medium">
                        🌿 {t.source_product?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                      {Number(t.fruit_quantity_kg).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-orange-600 font-medium">
                        🧃 {t.pulp_product?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-block bg-indigo-50 border border-indigo-100 text-[#6366F1] font-bold text-xs px-2.5 py-1 rounded-full">
                        {t.pulp_quantity_packages} paq
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-600 tabular-nums">
                      {kgPorPaquete(Number(t.fruit_quantity_kg), t.pulp_quantity_packages)}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">{t.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-slate-400">
              {meta.total} registro{meta.total !== 1 ? 's' : ''} · página {meta.currentPage} de {meta.lastPage}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => irAPagina(meta.currentPage - 1)}
                disabled={meta.currentPage === 1}
                className="px-2.5 py-1.5 rounded-xl text-sm border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              {pageNumbers().map((p) => (
                <button
                  key={p}
                  onClick={() => irAPagina(p)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    p === meta.currentPage
                      ? 'bg-[#6366F1] text-white shadow-sm'
                      : 'border border-slate-200 text-slate-500 hover:bg-[#F3F0FF]'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => irAPagina(meta.currentPage + 1)}
                disabled={meta.currentPage === meta.lastPage}
                className="px-2.5 py-1.5 rounded-xl text-sm border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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

const inputClass = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white'
