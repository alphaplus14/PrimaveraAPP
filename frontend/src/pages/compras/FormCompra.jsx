import { useState, useEffect } from 'react'
import { crearCompra, actualizarCompra, getProveedores, crearProveedor } from '../../api/compras'
import { getProductos } from '../../api/productos'
import { getInsumos, crearInsumo } from '../../api/labores'
import SelectBuscable from '../../components/ui/SelectBuscable'
import { SUPPLY_TYPE_LABEL } from '../../constants/enums'

import { hoyLocal } from '../../lib/fechas'

const hoy = hoyLocal
const fechaInput = (valor) => (valor ? String(valor).split('T')[0] : hoy())

const lineaVacia = () => ({
  id: Math.random(),
  product_id: '',
  supply_id: '',
  quantity_kg: '',
  unit_price: '',
})

const lineaDesdeCompra = (compra) => ({
  id: Math.random(),
  product_id: compra.product_id ? String(compra.product_id) : '',
  supply_id: compra.supply_id ? String(compra.supply_id) : '',
  quantity_kg: String(compra.quantity_kg),
  unit_price: String(compra.unit_price),
})

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function FormCompra({ compra, onGuardado, onCerrar }) {
  const esEdicion = !!compra

  const [productos, setProductos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [pendingProveedor, setPendingProveedor] = useState(null)
  const [tipoProveedor, setTipoProveedor] = useState('neighbor')
  const [pendingInsumo, setPendingInsumo] = useState(null)
  const [formInsumo, setFormInsumo] = useState({ type: 'fertilizer', unit: '' })

  const [cabecera, setCabecera] = useState({
    date: fechaInput(compra?.date),
    supplier_id: compra ? String(compra.supplier_id) : '',
    purchase_type: compra?.purchase_type ?? 'resale',
    notes: compra?.notes ?? '',
  })
  const [lineas, setLineas] = useState(() =>
    esEdicion ? [lineaDesdeCompra(compra)] : [lineaVacia()],
  )

  const esInsumo = cabecera.purchase_type === 'farm_supply'

  useEffect(() => {
    Promise.all([
      getProductos(),
      getProveedores(),
      getInsumos({ todos: 1 }),
    ]).then(([p, prov, ins]) => {
      setProductos(p.data.data.filter((x) => x.active))
      setProveedores(prov.data.data.filter((x) => x.active))
      setInsumos(ins.data.data ?? [])
    })
  }, [])

  const cambiarConcepto = (tipo) => {
    if (esEdicion) return
    setCabecera((c) => ({ ...c, purchase_type: tipo }))
    setLineas([lineaVacia()])
  }

  const actualizarLinea = (id, campo, valor) =>
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)))

  const agregarLinea = () => setLineas((prev) => [...prev, lineaVacia()])
  const eliminarLinea = (id) => setLineas((prev) => prev.filter((l) => l.id !== id))

  const totalGeneral = lineas.reduce(
    (sum, l) =>
      sum + (l.quantity_kg && l.unit_price ? Number(l.quantity_kg) * Number(l.unit_price) : 0),
    0,
  )

  const unidadLinea = (linea) => {
    if (!esInsumo) return 'kg'
    const ins = insumos.find((i) => String(i.id) === String(linea.supply_id))
    return ins?.unit ?? 'unidad'
  }

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

  const handleIniciarCrearInsumo = (name, lineaId) => {
    setPendingInsumo({ name, lineaId })
    setFormInsumo({ type: 'fertilizer', unit: '' })
  }

  const handleConfirmarInsumo = async () => {
    if (!formInsumo.unit.trim()) {
      setError('Indica la unidad del insumo.')
      return
    }
    try {
      const { data } = await crearInsumo({
        name: pendingInsumo.name,
        type: formInsumo.type,
        unit: formInsumo.unit,
      })
      const nuevo = data.data
      setInsumos((prev) => [...prev, nuevo])
      actualizarLinea(pendingInsumo.lineaId, 'supply_id', String(nuevo.id))
      setPendingInsumo(null)
      setError(null)
    } catch {
      setError('No se pudo crear el insumo.')
    }
  }

  const payloadLinea = (linea) => ({
    date: cabecera.date,
    supplier_id: cabecera.supplier_id,
    purchase_type: cabecera.purchase_type,
    notes: cabecera.notes || undefined,
    product_id: esInsumo ? undefined : linea.product_id,
    supply_id: esInsumo ? linea.supply_id : undefined,
    quantity_kg: linea.quantity_kg,
    unit_price: linea.unit_price,
  })

  const lineaValida = (l) => {
    const itemOk = esInsumo ? l.supply_id : l.product_id
    return itemOk && l.quantity_kg && l.unit_price
  }

  const handleSubmit = async () => {
    setError(null)
    if (!cabecera.supplier_id) {
      setError('Selecciona un proveedor.')
      return
    }
    if (lineas.some((l) => !lineaValida(l))) {
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
      {!esEdicion && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Concepto de compra</label>
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {[
              ['resale', 'Para venta (producto)'],
              ['farm_supply', 'Insumo de finca'],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => cambiarConcepto(v)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  cabecera.purchase_type === v
                    ? 'bg-[#1a365d] text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      )}

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
            {esInsumo ? 'Insumos' : esEdicion ? 'Producto' : 'Productos'}
          </label>
          {!esEdicion && (
            <button
              type="button"
              onClick={agregarLinea}
              className="text-xs text-[#f56523] font-semibold hover:underline"
            >
              + Agregar línea
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

            {esInsumo ? (
              <SelectBuscable
                opciones={insumos.map((i) => ({
                  value: i.id,
                  label: `${i.name} (${SUPPLY_TYPE_LABEL[i.type] ?? i.type})`,
                }))}
                value={linea.supply_id}
                onChange={(v) => actualizarLinea(linea.id, 'supply_id', v)}
                placeholder="Buscar insumo..."
                onCrear={(name) => handleIniciarCrearInsumo(name, linea.id)}
              />
            ) : (
              <SelectBuscable
                opciones={productos.map((p) => ({ value: p.id, label: p.name }))}
                value={linea.product_id}
                onChange={(v) => actualizarLinea(linea.id, 'product_id', v)}
                placeholder="Buscar producto..."
              />
            )}

            {pendingInsumo?.lineaId === linea.id && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-semibold text-blue-700">
                  Nuevo insumo: "{pendingInsumo.name}"
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">Tipo</label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300">
                      {Object.entries(SUPPLY_TYPE_LABEL).map(([v, l]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setFormInsumo((f) => ({ ...f, type: v }))}
                          className={`flex-1 py-2 text-xs font-medium ${
                            formInsumo.type === v
                              ? 'bg-[#1a365d] text-white'
                              : 'bg-white text-gray-500'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">Unidad *</label>
                    <input
                      type="text"
                      placeholder="L, kg..."
                      value={formInsumo.unit}
                      onChange={(e) => setFormInsumo((f) => ({ ...f, unit: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmarInsumo}
                    className="flex-1 bg-[#1a365d] text-white py-2 rounded-lg text-xs font-medium"
                  >
                    Crear insumo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingInsumo(null)}
                    className="px-3 border border-gray-300 rounded-lg text-xs text-gray-400"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">
                  Cantidad ({unidadLinea(linea)}) *
                </label>
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
                <label className="text-xs text-gray-400 mb-0.5 block">
                  Precio por {unidadLinea(linea)} *
                </label>
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
              : `Registrar${lineas.length > 1 ? ` (${lineas.length} líneas)` : ''}`}
        </button>
      </div>
    </div>
  )
}

const inputClass =
  'w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent'
