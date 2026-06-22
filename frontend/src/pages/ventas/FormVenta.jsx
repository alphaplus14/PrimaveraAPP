import { useState, useEffect } from 'react'
import { crearVenta, getClientes, crearCliente } from '../../api/ventas'
import { getProductos, getPrecioActual } from '../../api/productos'
import { getInventario } from '../../api/inventario'
import SelectBuscable from '../../components/ui/SelectBuscable'

const hoy = () => new Date().toISOString().split('T')[0]

const lineaVacia = () => ({
  id: Math.random(),
  product_id: '',
  sale_type: 'retail',
  quantity_kg: '',
  unit_price: '',
})

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function FormVenta({ onGuardado, onCerrar }) {
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [inventario, setInventario] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [nuevoCliente, setNuevoCliente] = useState('')
  const [advertencias, setAdvertencias] = useState({}) // lineaId -> stock disponible
  const [confirmarForzar, setConfirmarForzar] = useState(false)

  const [cabecera, setCabecera] = useState({ date: hoy(), customer_id: '' })
  const [lineas, setLineas] = useState([lineaVacia()])

  useEffect(() => {
    Promise.all([getProductos(), getClientes(), getInventario()]).then(
      ([p, c, i]) => {
        setProductos(p.data.data.filter((x) => x.is_active))
        setClientes(c.data.data.filter((x) => x.is_active))
        setInventario(i.data.data)
      }
    )
  }, [])

  // Actualizar precio cuando cambia producto o tipo en una línea
  const actualizarLinea = async (id, campo, valor) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    )

    const linea = lineas.find((l) => l.id === id)
    const product_id = campo === 'product_id' ? valor : linea.product_id
    const sale_type = campo === 'sale_type' ? valor : linea.sale_type

    if ((campo === 'product_id' || campo === 'sale_type') && product_id) {
      try {
        const { data } = await getPrecioActual(product_id)
        const precio = data.data?.[sale_type]
        setLineas((prev) =>
          prev.map((l) =>
            l.id === id ? { ...l, [campo]: valor, unit_price: precio ? Number(precio.amount) : '' } : l
          )
        )
      } catch {
        // sin precio registrado, dejar vacío
      }
    }

    // Verificar stock si cambia cantidad o producto
    if (campo === 'quantity_kg' || campo === 'product_id') {
      const pid = campo === 'product_id' ? valor : linea.product_id
      const kg = campo === 'quantity_kg' ? valor : linea.quantity_kg
      if (pid && kg) {
        const inv = inventario.find((i) => i.product_id === Number(pid))
        const stock = inv ? Number(inv.quantity_kg) : 0
        if (Number(kg) > stock) {
          setAdvertencias((prev) => ({ ...prev, [id]: stock }))
        } else {
          setAdvertencias((prev) => { const n = { ...prev }; delete n[id]; return n })
        }
      }
    }
  }

  const agregarLinea = () => setLineas((prev) => [...prev, lineaVacia()])

  const eliminarLinea = (id) =>
    setLineas((prev) => prev.filter((l) => l.id !== id))

  const totalGeneral = lineas.reduce((sum, l) => {
    const t = l.quantity_kg && l.unit_price
      ? Number(l.quantity_kg) * Number(l.unit_price)
      : 0
    return sum + t
  }, 0)

  const handleCrearCliente = async (nombre) => {
    try {
      const { data } = await crearCliente({ name: nombre, type: 'individual' })
      setClientes((prev) => [...prev, data.data])
      setCabecera((c) => ({ ...c, customer_id: String(data.data.id) }))
    } catch {
      setError('No se pudo crear el cliente.')
    }
  }

  const handleSubmit = async (forzar = false) => {
    setError(null)

    if (!cabecera.customer_id) { setError('Selecciona un cliente.'); return }
    if (lineas.some((l) => !l.product_id || !l.quantity_kg || !l.unit_price)) {
      setError('Completa todos los campos de cada línea.')
      return
    }

    const hayAdvertencias = Object.keys(advertencias).length > 0
    if (hayAdvertencias && !forzar) {
      setConfirmarForzar(true)
      return
    }

    setGuardando(true)
    try {
      await Promise.all(
        lineas.map((l) =>
          crearVenta({
            date: cabecera.date,
            customer_id: cabecera.customer_id,
            product_id: l.product_id,
            sale_type: l.sale_type,
            quantity_kg: l.quantity_kg,
            unit_price: l.unit_price,
            force: forzar,
          })
        )
      )
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar la venta.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabecera: fecha y cliente */}
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
          <label className="block text-xs font-medium text-gray-500 mb-1">Cliente *</label>
          <SelectBuscable
            opciones={clientes.map((c) => ({ value: c.id, label: c.name }))}
            value={cabecera.customer_id}
            onChange={(v) => setCabecera((c) => ({ ...c, customer_id: v }))}
            placeholder="Buscar cliente..."
            onCrear={handleCrearCliente}
          />
        </div>
      </div>

      {/* Líneas de productos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Productos</label>
          <button
            type="button"
            onClick={agregarLinea}
            className="text-xs text-[#f56523] font-semibold hover:underline"
          >
            + Agregar producto
          </button>
        </div>

        {lineas.map((linea, idx) => (
          <div key={linea.id} className="bg-gray-50 rounded-xl p-3 space-y-2 relative">
            {/* Número de línea y botón eliminar */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-400">#{idx + 1}</span>
              {lineas.length > 1 && (
                <button
                  onClick={() => eliminarLinea(linea.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Eliminar
                </button>
              )}
            </div>

            {/* Producto */}
            <SelectBuscable
              opciones={productos.map((p) => ({ value: p.id, label: p.name }))}
              value={linea.product_id}
              onChange={(v) => actualizarLinea(linea.id, 'product_id', v)}
              placeholder="Buscar producto..."
            />

            {/* Tipo + Cantidad + Precio en fila */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">Tipo</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                  {['retail', 'wholesale'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => actualizarLinea(linea.id, 'sale_type', t)}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        t === linea.sale_type
                          ? 'bg-[#1a365d] text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {t === 'wholesale' ? 'May.' : 'Det.'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">kg *</label>
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
                <label className="text-xs text-gray-400 mb-0.5 block">$/kg *</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  placeholder="0"
                  value={linea.unit_price}
                  onChange={(e) => actualizarLinea(linea.id, 'unit_price', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Subtotal y advertencia de stock */}
            <div className="flex items-center justify-between">
              {advertencias[linea.id] !== undefined && (
                <span className="text-xs text-amber-600">
                  ⚠️ Stock: {Number(advertencias[linea.id]).toFixed(1)} kg
                </span>
              )}
              {linea.quantity_kg && linea.unit_price && (
                <span className="text-xs font-semibold text-green-700 ml-auto">
                  = {formatCOP(Number(linea.quantity_kg) * Number(linea.unit_price))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total general */}
      {totalGeneral > 0 && (
        <div className="bg-[#1a365d] text-white rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium opacity-80">Total venta</span>
          <span className="text-xl font-bold">{formatCOP(totalGeneral)}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Confirmación de stock insuficiente */}
      {confirmarForzar && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
          <p className="text-amber-700 text-sm font-medium mb-3">
            ⚠️ Hay productos con stock insuficiente. ¿Continuar de todas formas?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setConfirmarForzar(false); handleSubmit(true) }}
              className="flex-1 bg-amber-500 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              Sí, registrar igual
            </button>
            <button
              onClick={() => setConfirmarForzar(false)}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Botones */}
      {!confirmarForzar && (
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCerrar}
            className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={guardando}
            className="flex-1 bg-[#f56523] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : `Registrar${lineas.length > 1 ? ` (${lineas.length} productos)` : ''}`}
          </button>
        </div>
      )}
    </div>
  )
}

const inputClass = 'w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent'
