import { useState, useEffect } from 'react'
import { crearCompra, getProveedores, crearProveedor } from '../../api/compras'
import { getProductos } from '../../api/productos'
import SelectBuscable from '../../components/ui/SelectBuscable'

const hoy = () => new Date().toISOString().split('T')[0]

const lineaVacia = () => ({
  id: Math.random(),
  producto_id: '',
  cantidad_kg: '',
  precio_unitario: '',
})

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function FormCompra({ onGuardado, onCerrar }) {
  const [productos, setProductos] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // Estado para crear proveedor con tipo
  const [pendingProveedor, setPendingProveedor] = useState(null) // { nombre } → espera tipo
  const [tipoProveedor, setTipoProveedor] = useState('vecino')

  const [cabecera, setCabecera] = useState({
    fecha: hoy(),
    proveedor_id: '',
    observaciones: '',
  })
  const [lineas, setLineas] = useState([lineaVacia()])

  useEffect(() => {
    Promise.all([getProductos(), getProveedores()]).then(([p, prov]) => {
      setProductos(p.data.data.filter((x) => x.activo))
      setProveedores(prov.data.data.filter((x) => x.activo))
    })
  }, [])

  const actualizarLinea = (id, campo, valor) => {
    setLineas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    )
  }

  const agregarLinea = () => setLineas((prev) => [...prev, lineaVacia()])
  const eliminarLinea = (id) => setLineas((prev) => prev.filter((l) => l.id !== id))

  const totalGeneral = lineas.reduce((sum, l) => {
    return sum + (l.cantidad_kg && l.precio_unitario
      ? Number(l.cantidad_kg) * Number(l.precio_unitario)
      : 0)
  }, 0)

  // Se llama cuando SelectBuscable dispara "Crear X"
  const handleIniciarCrearProveedor = (nombre) => {
    setPendingProveedor({ nombre })
    setTipoProveedor('vecino')
  }

  const handleConfirmarProveedor = async () => {
    if (!pendingProveedor?.nombre.trim()) return
    try {
      const { data } = await crearProveedor({ nombre: pendingProveedor.nombre, tipo: tipoProveedor })
      setProveedores((prev) => [...prev, data.data])
      setCabecera((c) => ({ ...c, proveedor_id: String(data.data.id) }))
      setPendingProveedor(null)
    } catch {
      setError('No se pudo crear el proveedor.')
    }
  }

  const handleSubmit = async () => {
    setError(null)

    if (!cabecera.proveedor_id) { setError('Selecciona un proveedor.'); return }
    if (lineas.some((l) => !l.producto_id || !l.cantidad_kg || !l.precio_unitario)) {
      setError('Completa todos los campos de cada línea.')
      return
    }

    setGuardando(true)
    try {
      await Promise.all(
        lineas.map((l) =>
          crearCompra({
            fecha: cabecera.fecha,
            proveedor_id: cabecera.proveedor_id,
            observaciones: cabecera.observaciones,
            producto_id: l.producto_id,
            cantidad_kg: l.cantidad_kg,
            precio_unitario: l.precio_unitario,
          })
        )
      )
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar la compra.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            value={cabecera.fecha}
            onChange={(e) => setCabecera((c) => ({ ...c, fecha: e.target.value }))}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Proveedor *</label>
          <SelectBuscable
            opciones={proveedores.map((p) => ({ value: p.id, label: `${p.nombre} (${p.tipo})` }))}
            value={cabecera.proveedor_id}
            onChange={(v) => setCabecera((c) => ({ ...c, proveedor_id: v }))}
            placeholder="Buscar proveedor..."
            onCrear={handleIniciarCrearProveedor}
          />
          {/* Panel inline para elegir tipo al crear proveedor */}
          {pendingProveedor && (
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-blue-700">
                Tipo de proveedor: <span className="font-bold">"{pendingProveedor.nombre}"</span>
              </p>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {['vecino', 'galeria', 'otro'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipoProveedor(t)}
                    className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                      tipoProveedor === t
                        ? 'bg-[#1a365d] text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'galeria' ? 'Galería' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmarProveedor}
                  className="flex-1 bg-[#1a365d] text-white py-2 rounded-lg text-xs font-medium"
                >
                  Crear proveedor
                </button>
                <button
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
          <div key={linea.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400">#{idx + 1}</span>
              {lineas.length > 1 && (
                <button onClick={() => eliminarLinea(linea.id)} className="text-xs text-red-400 hover:text-red-600">
                  Eliminar
                </button>
              )}
            </div>

            <SelectBuscable
              opciones={productos.map((p) => ({ value: p.id, label: p.nombre }))}
              value={linea.producto_id}
              onChange={(v) => actualizarLinea(linea.id, 'producto_id', v)}
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
                  value={linea.cantidad_kg}
                  onChange={(e) => actualizarLinea(linea.id, 'cantidad_kg', e.target.value)}
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
                  value={linea.precio_unitario}
                  onChange={(e) => actualizarLinea(linea.id, 'precio_unitario', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {linea.cantidad_kg && linea.precio_unitario && (
              <div className="text-right text-xs font-semibold text-blue-700">
                = {formatCOP(Number(linea.cantidad_kg) * Number(linea.precio_unitario))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      {totalGeneral > 0 && (
        <div className="bg-[#1a365d] text-white rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium opacity-80">Total compra</span>
          <span className="text-xl font-bold">{formatCOP(totalGeneral)}</span>
        </div>
      )}

      {/* Observaciones */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones (opcional)</label>
        <input
          type="text"
          placeholder="Ej: Producto llegó en buen estado..."
          value={cabecera.observaciones}
          onChange={(e) => setCabecera((c) => ({ ...c, observaciones: e.target.value }))}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCerrar}
          className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={guardando}
          className="flex-1 bg-[#f56523] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : `Registrar${lineas.length > 1 ? ` (${lineas.length} productos)` : ''}`}
        </button>
      </div>
    </div>
  )
}

const inputClass = 'w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent'
