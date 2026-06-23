import { useState, useEffect } from 'react'
import { crearVenta, getClientes, crearCliente } from '../../api/ventas'
import { getProductos, getPrecioActual } from '../../api/productos'
import { getInventario } from '../../api/inventario'
import SelectBuscable from '../../components/ui/SelectBuscable'

const hoy = () => new Date().toISOString().split('T')[0]

const lineaVacia = () => ({
  id: Math.random(),
  producto_id:    '',
  tipo_venta:     'detal',
  cantidad_kg:    '',
  precio_unitario: '',
})

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function FormVenta({ onGuardado, onCerrar }) {
  const [productos, setProductos] = useState([])
  const [clientes, setClientes] = useState([])
  const [inventario, setInventario] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [advertencias, setAdvertencias] = useState({})
  const [confirmarForzar, setConfirmarForzar] = useState(false)

  const [cabecera, setCabecera] = useState({ fecha: hoy(), cliente_id: '' })
  const [lineas, setLineas] = useState([lineaVacia()])

  useEffect(() => {
    Promise.all([getProductos(), getClientes(), getInventario()]).then(([p, c, i]) => {
      setProductos(p.data.data.filter((x) => x.activo))
      setClientes(c.data.data.filter((x) => x.activo))
      setInventario(i.data.data)
    })
  }, [])

  const actualizarLinea = async (id, campo, valor) => {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)))

    const linea = lineas.find((l) => l.id === id)
    const producto_id = campo === 'producto_id' ? valor : linea.producto_id
    const tipo_venta  = campo === 'tipo_venta'  ? valor : linea.tipo_venta

    // Auto-completar precio desde el catálogo
    if ((campo === 'producto_id' || campo === 'tipo_venta') && producto_id) {
      try {
        const { data } = await getPrecioActual(producto_id)
        const precio = data.data?.[tipo_venta]
        setLineas((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, [campo]: valor, precio_unitario: precio ? Number(precio.valor) : '' }
              : l
          )
        )
      } catch {
        // sin precio, dejar vacío
      }
    }

    // Verificar stock
    if (campo === 'cantidad_kg' || campo === 'producto_id') {
      const pid = campo === 'producto_id' ? valor : linea.producto_id
      const kg  = campo === 'cantidad_kg'  ? valor : linea.cantidad_kg
      if (pid && kg) {
        const inv   = inventario.find((i) => i.producto_id === Number(pid))
        const stock = inv ? Number(inv.cantidad_kg) : 0
        if (Number(kg) > stock) {
          setAdvertencias((prev) => ({ ...prev, [id]: stock }))
        } else {
          setAdvertencias((prev) => { const n = { ...prev }; delete n[id]; return n })
        }
      }
    }
  }

  const agregarLinea  = () => setLineas((prev) => [...prev, lineaVacia()])
  const eliminarLinea = (id) => setLineas((prev) => prev.filter((l) => l.id !== id))

  const totalGeneral = lineas.reduce((sum, l) =>
    sum + (l.cantidad_kg && l.precio_unitario
      ? Number(l.cantidad_kg) * Number(l.precio_unitario)
      : 0), 0)

  const handleCrearCliente = async (nombre) => {
    try {
      const { data } = await crearCliente({ nombre, tipo: 'individual' })
      setClientes((prev) => [...prev, data.data])
      setCabecera((c) => ({ ...c, cliente_id: String(data.data.id) }))
    } catch {
      setError('No se pudo crear el cliente.')
    }
  }

  const handleSubmit = async (forzar = false) => {
    setError(null)
    if (!cabecera.cliente_id) { setError('Selecciona un cliente.'); return }
    if (lineas.some((l) => !l.producto_id || !l.cantidad_kg || !l.precio_unitario)) {
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
            fecha:           cabecera.fecha,
            cliente_id:      cabecera.cliente_id,
            producto_id:     l.producto_id,
            tipo_venta:      l.tipo_venta,
            cantidad_kg:     l.cantidad_kg,
            precio_unitario: l.precio_unitario,
            force:           forzar,
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
          <label className="block text-xs font-medium text-gray-500 mb-1">Cliente *</label>
          <SelectBuscable
            opciones={clientes.map((c) => ({ value: c.id, label: c.nombre }))}
            value={cabecera.cliente_id}
            onChange={(v) => setCabecera((c) => ({ ...c, cliente_id: v }))}
            placeholder="Buscar cliente..."
            onCrear={handleCrearCliente}
          />
        </div>
      </div>

      {/* Líneas */}
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
            <div className="flex items-center justify-between mb-1">
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

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">Tipo</label>
                <div className="flex rounded-lg overflow-hidden border border-gray-300">
                  {[['detal', 'Det.'], ['mayorista', 'May.']].map(([v, l]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => actualizarLinea(linea.id, 'tipo_venta', v)}
                      className={`flex-1 py-2 text-xs font-medium transition-colors ${
                        v === linea.tipo_venta
                          ? 'bg-[#1a365d] text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {l}
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
                  value={linea.cantidad_kg}
                  onChange={(e) => actualizarLinea(linea.id, 'cantidad_kg', e.target.value)}
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
                  value={linea.precio_unitario}
                  onChange={(e) => actualizarLinea(linea.id, 'precio_unitario', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              {advertencias[linea.id] !== undefined && (
                <span className="text-xs text-amber-600">
                  ⚠️ Stock: {Number(advertencias[linea.id]).toFixed(1)} kg
                </span>
              )}
              {linea.cantidad_kg && linea.precio_unitario && (
                <span className="text-xs font-semibold text-green-700 ml-auto">
                  = {formatCOP(Number(linea.cantidad_kg) * Number(linea.precio_unitario))}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalGeneral > 0 && (
        <div className="bg-[#1a365d] text-white rounded-xl px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium opacity-80">Total venta</span>
          <span className="text-xl font-bold">{formatCOP(totalGeneral)}</span>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

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
