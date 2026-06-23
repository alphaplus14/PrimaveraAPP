import { useState, useEffect } from 'react'
import { crearTransformacion } from '../../api/transformaciones'
import { getProductos } from '../../api/productos'
import { getInventario } from '../../api/inventario'
import SelectBuscable from '../../components/ui/SelectBuscable'

const hoy = () => new Date().toISOString().split('T')[0]

export default function FormTransformacion({ onGuardado, onCerrar }) {
  const [frutas, setFrutas] = useState([])
  const [pulpas, setPulpas] = useState([])
  const [inventario, setInventario] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    fecha:              hoy(),
    producto_origen_id: '',
    cantidad_fruta_kg:  '',
    producto_pulpa_id:  '',
    cantidad_pulpa_kg:  '',
    observaciones:      '',
  })

  useEffect(() => {
    Promise.all([getProductos(), getInventario()]).then(([p, inv]) => {
      const todos = p.data.data
      setFrutas(todos.filter((x) => x.activo && x.es_fruta_para_pulpa))
      setPulpas(todos.filter((x) => x.activo && x.categoria === 'pulpa'))
      setInventario(inv.data.data)
    })
  }, [])

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const stockFruta = (() => {
    if (!form.producto_origen_id) return null
    const inv = inventario.find((i) => i.producto_id === Number(form.producto_origen_id))
    return inv ? Number(inv.cantidad_kg) : 0
  })()

  const stockInsuficiente =
    stockFruta !== null &&
    form.cantidad_fruta_kg &&
    Number(form.cantidad_fruta_kg) > stockFruta

  const rendimiento =
    form.cantidad_fruta_kg && form.cantidad_pulpa_kg && Number(form.cantidad_fruta_kg) > 0
      ? ((Number(form.cantidad_pulpa_kg) / Number(form.cantidad_fruta_kg)) * 100).toFixed(1)
      : null

  const handleSubmit = async () => {
    setError(null)
    if (!form.producto_origen_id) { setError('Selecciona la fruta de origen.'); return }
    if (!form.cantidad_fruta_kg || Number(form.cantidad_fruta_kg) <= 0) {
      setError('Ingresa la cantidad de fruta usada.')
      return
    }
    if (!form.producto_pulpa_id) { setError('Selecciona el producto pulpa resultante.'); return }
    if (!form.cantidad_pulpa_kg || Number(form.cantidad_pulpa_kg) <= 0) {
      setError('Ingresa la cantidad de pulpa obtenida.')
      return
    }

    setGuardando(true)
    try {
      await crearTransformacion(form)
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al registrar la transformación.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
        <input
          type="date"
          value={form.fecha}
          onChange={(e) => set('fecha', e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-3">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">🌿 Fruta de entrada</p>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Producto *</label>
          {frutas.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No hay frutas configuradas. En <strong>Productos</strong>, activa "Se transforma en pulpa" en el producto correspondiente.
            </p>
          ) : (
            <SelectBuscable
              opciones={frutas.map((f) => ({ value: f.id, label: f.nombre }))}
              value={form.producto_origen_id}
              onChange={(v) => set('producto_origen_id', v)}
              placeholder="Seleccionar fruta..."
            />
          )}
        </div>

        {form.producto_origen_id && stockFruta !== null && (
          <p className={`text-xs font-medium ${stockFruta === 0 ? 'text-red-600' : 'text-green-700'}`}>
            Stock disponible: {stockFruta.toLocaleString('es-CO', { maximumFractionDigits: 1 })} kg
          </p>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad usada (kg) *</label>
          <input
            type="number"
            min="0.001"
            step="0.1"
            placeholder="0.0"
            value={form.cantidad_fruta_kg}
            onChange={(e) => set('cantidad_fruta_kg', e.target.value)}
            className={`${inputClass} ${stockInsuficiente ? 'border-amber-400 focus:ring-amber-400' : ''}`}
          />
          {stockInsuficiente && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Supera el stock disponible ({stockFruta.toFixed(1)} kg)
            </p>
          )}
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-3">
        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">🧃 Pulpa resultante</p>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Producto *</label>
          {pulpas.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No hay pulpas creadas. Ve a <strong>Productos</strong> y crea un producto con categoría "Pulpa".
            </p>
          ) : (
            <SelectBuscable
              opciones={pulpas.map((p) => ({ value: p.id, label: p.nombre }))}
              value={form.producto_pulpa_id}
              onChange={(v) => set('producto_pulpa_id', v)}
              placeholder="Seleccionar pulpa..."
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad obtenida (kg) *</label>
          <input
            type="number"
            min="0.001"
            step="0.1"
            placeholder="0.0"
            value={form.cantidad_pulpa_kg}
            onChange={(e) => set('cantidad_pulpa_kg', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {rendimiento && (
        <div className="flex items-center justify-between bg-[#1a365d] text-white rounded-xl px-4 py-3">
          <span className="text-sm opacity-80">Rendimiento</span>
          <span className="text-xl font-bold">{rendimiento}%</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones (opcional)</label>
        <input
          type="text"
          placeholder="Ej: Fruta en buen estado, pulpa fina..."
          value={form.observaciones}
          onChange={(e) => set('observaciones', e.target.value)}
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
          {guardando ? 'Registrando...' : 'Registrar transformación'}
        </button>
      </div>
    </div>
  )
}

const inputClass = 'w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent'
