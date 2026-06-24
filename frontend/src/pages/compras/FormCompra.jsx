import { useState, useEffect } from 'react'
import { crearCompra, actualizarCompra, getProveedores, crearProveedor } from '../../api/compras'
import { getProductos } from '../../api/productos'
import SelectBuscable from '../../components/ui/SelectBuscable'

const hoy = () => new Date().toISOString().split('T')[0]
const fechaInput = (valor) => (valor ? String(valor).split('T')[0] : hoy())

const lineaVacia = () => ({
  id: Math.random(),
  product_id: '',
  quantity_kg: '',
  unit_price: '',
})

const lineaDesdeCompra = (compra) => ({
  id: Math.random(),
  product_id: String(compra.product_id),
  quantity_kg: String(compra.quantity_kg),
  unit_price: String(compra.unit_price),
})

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function FormCompra({ compra, onGuardado, onCerrar }) {
  const esEdicion = !!compra

  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [pendingProveedor, setPendingProveedor] = useState(null)
  const [tipoProveedor, setTipoProveedor] = useState('neighbor')

  const [cabecera, setCabecera] = useState({
    date: fechaInput(compra?.date),
    supplier_id: compra ? String(compra.supplier_id) : '',
    notes: compra?.notes ?? '',
  })
  const [lineas, setLineas] = useState(() =>
    esEdicion ? [lineaDesdeCompra(compra)] : [lineaVacia()],
  )

  useEffect(() => {
    Promise.all([getProductos(), getProveedores()]).then(([p, prov]) => {
      setProductos(p.data.data.filter((x) => x.active))
      setProveedores(prov.data.data.filter((x) => x.active))
    })
  }, [])

  const actualizarLinea = (id, campo, valor) =>
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)))

  const agregarLinea = () => setLineas((prev) => [...prev, lineaVacia()])
  const eliminarLinea = (id) => setLineas((prev) => prev.filter((l) => l.id !== id))

  const totalGeneral = lineas.reduce(
    (sum, l) =>
      sum + (l.quantity_kg && l.unit_price ? Number(l.quantity_kg) * Number(l.unit_price) : 0),
    0,
  )

  const handleIniciarCrearProveedor = (name) => {
    setPendingProveedor({ name })
    setTipoProveedor('neighbor')
  }

  const handleConfirmarProveedor = async () => {
    if (!pendingProveedor?.name.trim()) return
    try {
      const { data } = await crearProveedor({
        name: pendingProveedor.name,
        type: tipoProveedor,
      })
      setProveedores((prev) => [...prev, data.data])
      setCabecera((c) => ({ ...c, supplier_id: String(data.data.id) }))
      setPendingProveedor(null)
    } catch {
      setError('No se pudo crear el proveedor.')
    }
  }

  const payloadLinea = (linea) => ({
    date: cabecera.date,
    supplier_id: cabecera.supplier_id,
    notes: cabecera.notes || undefined,
    product_id: linea.product_id,
    quantity_kg: linea.quantity_kg,
    unit_price: linea.unit_price,
  })

  const handleSubmit = async () => {
    setError(null)
    if (!cabecera.supplier_id) {
      setError('Selecciona un proveedor.')
      return
    }
    if (lineas.some((l) => !l.product_id || !l.quantity_kg || !l.unit_price)) {
      setError('Completa todos los campos de cada línea.')
      return
    }

    setGuardando(true)
    try {
      if (esEdicion) {
        await actualizarCompra(compra.id, payloadLinea(lineas[0]))
      } else {
        await Promise.all(lineas.map((l) => crearCompra(payloadLinea(l))))
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar la compra.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            value={cabecera.date}
            onChange={(e) => setCabecera((c) => ({ ...c, date: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor *</label>
          <SelectBuscable
            opciones={proveedores.map((p) => ({ value: p.id, label: `${p.name} (${p.type})` }))}
            value={cabecera.supplier_id}
            onChange={(v) => setCabecera((c) => ({ ...c, supplier_id: v }))}
            placeholder="Buscar proveedor..."
            onCrear={handleIniciarCrearProveedor}
          />
          {pendingProveedor && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-blue-700">
                Tipo de proveedor: <span className="font-bold">"{pendingProveedor.name}"</span>
              </p>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {[['neighbor', 'Vecino'], ['market', 'Galería'], ['other', 'Otro']].map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setTipoProveedor(v)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${
                      tipoProveedor === v
                        ? 'bg-[#1a365d] text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmarProveedor}
                  className="flex-1 bg-[#1a365d] text-white py-2 rounded-lg text-xs font-medium"
                >
                  Crear proveedor
                </button>
                <button
                  type="button"
                  onClick={() => setPendingProveedor(null)}
                  className="px-3 border border-gray-300 rounded-lg text-xs text-gray-400"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {esEdicion ? 'Producto' : 'Productos'}
          </label>
          {!esEdicion && (
            <button
              type="button"
              onClick={agregarLinea}
              className="text-xs text-[#f56523] font-semibold hover:underline"
            >
              + Agregar producto
            </button>
          )}
        </div>

        {lineas.map((linea, idx) => (
          <div key={linea.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
            {!esEdicion && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">#{idx + 1}</span>
                {lineas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarLinea(linea.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}

            <SelectBuscable
              opciones={productos.map((p) => ({ value: p.id, label: p.name }))}
              value={linea.product_id}
              onChange={(v) => actualizarLinea(linea.id, 'product_id', v)}
              placeholder="Buscar producto..."
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">Cantidad (kg) *</label>
                <input
                  type="number"
                  min="0.001"
                  step="0.1"
                  placeholder="0.0"
                  value={linea.quantity_kg}
                  onChange={(e) => actualizarLinea(linea.id, 'quantity_kg', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">Precio por kg *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="$ 0"
                  value={linea.unit_price}
                  onChange={(e) => actualizarLinea(linea.id, 'unit_price', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {linea.quantity_kg && linea.unit_price && (
              <div className="text-right text-xs font-semibold text-blue-700">
                = {formatCOP(Number(linea.quantity_kg) * Number(linea.unit_price))}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalGeneral > 0 && (
        <div className="bg-[#1a365d] text-white rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium opacity-80">Total compra</span>
          <span className="text-xl font-bold">{formatCOP(totalGeneral)}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones (opcional)</label>
        <input
          type="text"
          placeholder="Ej: Producto llegó en buen estado..."
          value={cabecera.notes}
          onChange={(e) => setCabecera((c) => ({ ...c, notes: e.target.value }))}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCerrar}
          className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={guardando}
          className="flex-1 bg-[#f56523] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {guardando
            ? 'Guardando...'
            : esEdicion
              ? 'Guardar cambios'
              : `Registrar${lineas.length > 1 ? ` (${lineas.length} productos)` : ''}`}
        </button>
      </div>
    </div>
  )
}

const inputClass =
  'w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent'
