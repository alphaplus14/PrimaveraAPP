import { useState, useEffect, useMemo } from 'react'
import { getCompras } from '../../api/compras'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import Buscador from '../../components/ui/Buscador'
import Paginacion from '../../components/ui/Paginacion'
import FormCompra from './FormCompra'
import { formatCOP, formatFechaCorta } from '../../lib/dashboard'

const POR_PAGINA = 15

export default function Compras() {
  const [mostrarForm, setMostrarForm] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const { data: compras, cargando, recargar } = useApi(getCompras)

  const todos = compras?.data ?? compras ?? []

  const lista = useMemo(
    () =>
      todos.filter((c) => {
        const q = busqueda.toLowerCase()
        return (
          c.product?.name?.toLowerCase().includes(q) ||
          c.supplier?.name?.toLowerCase().includes(q)
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
        <h2 className="text-xl font-bold text-[#1a365d]">Compras</h2>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-gray-400 hidden sm:inline">
            {lista.length} compra{lista.length !== 1 ? 's' : ''}
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
            {paginaItems.map((c) => (
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
                {paginaItems.map((c) => (
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
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            total={lista.length}
            totalGeneral={todos.length}
            porPagina={POR_PAGINA}
            inicio={inicio}
            filtrado={!!busqueda}
            sustantivo="compra"
            onAnterior={() => setPagina((p) => Math.max(1, p - 1))}
            onSiguiente={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
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
