import { useState, useEffect } from 'react'
import { getInventario, ajustarInventario } from '../../api/inventario'
import { useApi } from '../../hooks/useApi'
import Modal from '../../components/ui/Modal'
import Buscador from '../../components/ui/Buscador'
import Paginacion from '../../components/ui/Paginacion'

const POR_PAGINA = 15

function formatStock(producto, quantityKg, { corto = false } = {}) {
  const qty = Number(quantityKg)
  if (producto?.category === 'pulp') {
    return corto ? `${Math.round(qty)} paq` : `${Math.round(qty)} paquetes`
  }
  return `${qty.toFixed(1)} kg`
}

export default function Inventario() {
  const { data: items, cargando, recargar } = useApi(getInventario)
  const [ajuste, setAjuste] = useState(null)
  const [form, setForm] = useState({ quantity_kg: '', reason: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  const todos = items?.data ?? items ?? []
  const lista = todos.filter((i) =>
    i.product?.name?.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const totalPaginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const paginaItems = lista.slice(inicio, inicio + POR_PAGINA)

  useEffect(() => {
    setPagina(1)
  }, [busqueda])

  const abrirAjuste = (item) => {
    setAjuste(item)
    setForm({ quantity_kg: '', reason: '' })
    setError(null)
  }

  const handleGuardar = async () => {
    if (!form.quantity_kg || !form.reason.trim()) {
      setError('Completa la cantidad y el motivo.')
      return
    }
    setGuardando(true)
    try {
      await ajustarInventario(ajuste.product_id, {
        quantity_kg: Number(form.quantity_kg),
        reason: form.reason,
      })
      setAjuste(null)
      recargar()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar el ajuste.')
    } finally {
      setGuardando(false)
    }
  }

  const stockNuevo =
    ajuste && form.quantity_kg
      ? Number(ajuste.quantity_kg) + Number(form.quantity_kg)
      : null

  const esPulpa = ajuste?.product?.category === 'pulp'

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#1a365d]">Inventario</h2>
        <span className="text-xs text-gray-400">{lista.length} productos</span>
      </div>

      <Buscador
        value={busqueda}
        onChange={setBusqueda}
        placeholder="Buscar producto..."
        className="mb-4"
      />

      {cargando ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          <p className="text-sm">
            {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay productos en inventario.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3">Producto</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">Actualizado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginaItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.product?.name}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        Number(item.quantity_kg) === 0
                          ? 'text-red-400'
                          : Number(item.quantity_kg) < 5
                            ? 'text-amber-500'
                            : 'text-gray-800'
                      }`}
                    >
                      {formatStock(item.product, item.quantity_kg, { corto: true })}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs hidden md:table-cell">
                      {item.stock_updated_at
                        ? new Date(item.stock_updated_at).toLocaleDateString('es-CO')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => abrirAjuste(item)}
                        className="text-xs text-[#1a365d] hover:text-[#f56523] font-medium transition-colors"
                      >
                        Ajustar
                      </button>
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
            sustantivo="producto"
            onAnterior={() => setPagina((p) => Math.max(1, p - 1))}
            onSiguiente={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
          />
        </>
      )}

      {ajuste && (
        <Modal titulo={`Ajustar — ${ajuste?.product?.name}`} onClose={() => setAjuste(null)}>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
              <span className="text-sm text-gray-500">Stock actual</span>
              <span className="font-bold text-gray-800">
                {formatStock(ajuste?.product, ajuste.quantity_kg)}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad a sumar o restar ({esPulpa ? 'paquetes' : 'kg'}) *
              </label>
              <input
                type="number"
                step={esPulpa ? '1' : '0.1'}
                placeholder="Ej: 50 para sumar, -5 para restar"
                value={form.quantity_kg}
                onChange={(e) => setForm((f) => ({ ...f, quantity_kg: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523]"
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">
                Usa número positivo para agregar stock, negativo para reducirlo (merma)
              </p>
            </div>

            {stockNuevo !== null && (
              <div
                className={`rounded-lg px-4 py-3 flex justify-between items-center ${
                  stockNuevo < 0
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <span className="text-sm font-medium text-gray-600">Stock resultante</span>
                <span
                  className={`font-bold text-lg ${stockNuevo < 0 ? 'text-red-600' : 'text-green-700'}`}
                >
                  {formatStock(ajuste?.product, stockNuevo)}
                </span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
              <input
                type="text"
                placeholder="Ej: Stock inicial, merma, cosecha..."
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523]"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAjuste(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando}
                className="flex-1 bg-[#1a365d] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar ajuste'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
