import { useState, useEffect, useCallback } from 'react'
import { getCompras } from '../../api/compras'
import Modal from '../../components/ui/Modal'
import Buscador from '../../components/ui/Buscador'
import Paginacion from '../../components/ui/Paginacion'
import FormCompra from './FormCompra'
import { formatCOP, formatFechaCorta } from '../../lib/dashboard'

const POR_PAGINA = 15

export default function Compras() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [lista, setLista] = useState([])
  const [meta, setMeta] = useState({ currentPage: 1, lastPage: 1, total: 0 })
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async (page = 1) => {
    setCargando(true)
    try {
      const params = { page, per_page: POR_PAGINA }
      if (busqueda.trim()) params.busqueda = busqueda.trim()
      const res = await getCompras(params)
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
    cargar(1)
  }

  const inicio = (meta.currentPage - 1) * POR_PAGINA

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-[#1a365d]">Compras</h2>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {meta.total} compra{meta.total !== 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="bg-[#f56523] text-white text-sm px-4 py-2.5 rounded-xl font-medium hover:bg-[#d9541a] transition-colors"
          >
            + Nueva compra
          </button>
        </div>
      </div>

      <Buscador
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar por producto o proveedor..."
        className="mb-4"
      />

      {cargando ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p className="text-sm mb-3">
            {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay compras registradas aún.'}
          </p>
          {!busqueda && (
            <button
              type="button"
              onClick={() => setMostrarForm(true)}
              className="text-sm text-[#f56523] font-medium hover:underline"
            >
              Registrar primera compra →
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {lista.map((c) => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{c.product?.name}</p>
                  <span className="font-bold text-[#1a365d] text-sm shrink-0">{formatCOP(c.total)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400 gap-2">
                  <span className="truncate">
                    {c.supplier?.name} · {Number(c.quantity_kg).toFixed(1)} kg
                  </span>
                  <span className="shrink-0">{formatFechaCorta(c.date)}</span>
                </div>
              </div>
            ))}
          </div>

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
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatFechaCorta(c.date)}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.product?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.supplier?.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {Number(c.quantity_kg).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                      {formatCOP(c.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#1a365d] tabular-nums">
                      {formatCOP(c.total)}
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
            sustantivo="compra"
            onAnterior={() => cargar(meta.currentPage - 1)}
            onSiguiente={() => cargar(meta.currentPage + 1)}
          />
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
