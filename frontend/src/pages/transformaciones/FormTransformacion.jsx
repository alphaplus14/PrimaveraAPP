import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { crearTransformacion } from '../../api/transformaciones'
import { getProductos } from '../../api/productos'
import { getInventario } from '../../api/inventario'
import SelectBuscable from '../../components/ui/SelectBuscable'

import { hoyLocal } from '../../lib/fechas'

const hoy = hoyLocal

export default function FormTransformacion({ onGuardado, onCerrar }) {
  const [frutas, setFrutas] = useState([])
  const [pulpas, setPulpas] = useState([])
  const [inventario, setInventario] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    date: hoy(),
    source_product_id: '',
    fruit_quantity_kg: '',
    pulp_product_id: '',
    pulp_quantity_packages: '',
    notes: '',
  })

  useEffect(() => {
    Promise.all([getProductos(), getInventario()]).then(([p, inv]) => {
      const todos = p.data.data
      setFrutas(todos.filter((x) => x.active && x.is_pulp_fruit))
      setPulpas(todos.filter((x) => x.active && x.category === 'pulp'))
      setInventario(inv.data.data)
    })
  }, [])

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  // Al seleccionar fruta, auto-asignar la pulpa relacionada
  const handleFrutaChange = (frutaId) => {
    const fruta = frutas.find((f) => f.id === Number(frutaId))
    const pulpaId = fruta?.related_pulp_id ?? ''
    setForm((f) => ({
      ...f,
      source_product_id: frutaId,
      pulp_product_id: pulpaId ? String(pulpaId) : '',
    }))
  }

  // Al cambiar kg de fruta, auto-calcular paquetes con Math.ceil
  const handleFruitKgChange = (valor) => {
    const kg = parseFloat(valor)
    setForm((f) => ({
      ...f,
      fruit_quantity_kg: valor,
      pulp_quantity_packages: !isNaN(kg) && kg > 0 ? Math.ceil(kg) : '',
    }))
  }

  const frutaSeleccionada = frutas.find((f) => f.id === Number(form.source_product_id))
  const pulpaAsignada = pulpas.find((p) => p.id === Number(form.pulp_product_id))

  const stockFruta = (() => {
    if (!form.source_product_id) return null
    const inv = inventario.find((i) => i.product_id === Number(form.source_product_id))
    return inv ? Number(inv.quantity_kg) : 0
  })()

  const sinStock = stockFruta !== null && stockFruta < 1

  const stockInsuficiente =
    !sinStock &&
    stockFruta !== null &&
    form.fruit_quantity_kg &&
    Number(form.fruit_quantity_kg) > stockFruta

  const handleSubmit = async () => {
    setError(null)
    if (!form.source_product_id) { setError('Selecciona la fruta de origen.'); return }
    if (sinStock) {
      setError('Esta fruta no tiene stock suficiente. Se necesita mínimo 1 kg.')
      return
    }
    if (!form.fruit_quantity_kg || Number(form.fruit_quantity_kg) <= 0) {
      setError('Ingresa la cantidad de fruta usada.')
      return
    }
    if (!form.pulp_product_id) {
      setError('La fruta seleccionada no tiene una pulpa relacionada configurada.')
      return
    }
    if (!form.pulp_quantity_packages || Number(form.pulp_quantity_packages) < 1) {
      setError('La cantidad de paquetes debe ser al menos 1.')
      return
    }

    setGuardando(true)
    try {
      await crearTransformacion({
        ...form,
        pulp_quantity_packages: Number(form.pulp_quantity_packages),
      })
      await Swal.fire({
        icon: 'success',
        title: '¡Transformación registrada!',
        html: `<b>${Number(form.fruit_quantity_kg).toFixed(1)} kg</b> de <b>${frutaSeleccionada?.name}</b>
               → <b>${form.pulp_quantity_packages} paquetes</b> de <b>${pulpaAsignada?.name}</b>`,
        confirmButtonColor: '#f56523',
        timer: 3000,
        timerProgressBar: true,
      })
      onGuardado()
    } catch (err) {
      const msg = err.response?.data?.message ?? 'Error al registrar la transformación.'
      setError(msg)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg,
        confirmButtonColor: '#1a365d',
      })
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
          value={form.date}
          onChange={(e) => set('date', e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Fruta de entrada */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-3">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">🌿 Fruta de entrada</p>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Producto *</label>
          {frutas.length === 0 ? (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              No hay frutas configuradas. En <strong>Productos</strong>, activa "Se transforma en pulpa".
            </p>
          ) : (
            <SelectBuscable
              opciones={frutas.map((f) => ({ value: f.id, label: f.name }))}
              value={form.source_product_id}
              onChange={handleFrutaChange}
              placeholder="Seleccionar fruta..."
            />
          )}
        </div>

        {form.source_product_id && stockFruta !== null && (
          <div>
            <p className={`text-xs font-medium ${sinStock ? 'text-red-600' : 'text-green-700'}`}>
              Stock disponible: {stockFruta.toLocaleString('es-CO', { maximumFractionDigits: 1 })} kg
            </p>
            {sinStock && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-2">
                🚫 Stock insuficiente. Se necesita mínimo 1 kg para iniciar una transformación.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad usada (kg) *</label>
          <input
            type="number"
            min="0.001"
            step="0.1"
            placeholder="0.0"
            value={form.fruit_quantity_kg}
            onChange={(e) => handleFruitKgChange(e.target.value)}
            className={`${inputClass} ${stockInsuficiente ? 'border-amber-400 focus:ring-amber-400' : ''}`}
          />
          {stockInsuficiente && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Supera el stock disponible ({stockFruta.toFixed(1)} kg)
            </p>
          )}
        </div>
      </div>

      {/* Pulpa resultante — solo lectura */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-3">
        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">🧃 Pulpa resultante</p>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Producto</label>
          {pulpaAsignada ? (
            <div className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg px-3 py-2.5">
              <span className="text-sm font-medium text-gray-800">{pulpaAsignada.name}</span>
              <span className="ml-auto text-xs text-orange-500 font-medium">Auto-asignado</span>
            </div>
          ) : form.source_product_id ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <p className="text-xs text-amber-700">
                Esta fruta no tiene una pulpa relacionada. Configúrala en <strong>Productos</strong>.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-orange-200 rounded-lg px-3 py-2.5">
              <p className="text-xs text-gray-400">Se asignará automáticamente al seleccionar la fruta</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Paquetes obtenidos *
            {form.fruit_quantity_kg && (
              <span className="ml-1 text-orange-500 font-normal">
                (sugerido: {Math.ceil(Number(form.fruit_quantity_kg))} paquetes)
              </span>
            )}
          </label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="0"
            value={form.pulp_quantity_packages}
            onChange={(e) => set('pulp_quantity_packages', e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-gray-400 mt-1">
            Puedes ajustar si el resultado fue diferente al calculado automáticamente.
          </p>
        </div>
      </div>

      {/* Resumen */}
      {form.fruit_quantity_kg && form.pulp_quantity_packages && pulpaAsignada && (
        <div className="flex items-center justify-between bg-[#1a365d] text-white rounded-xl px-4 py-3">
          <div className="text-sm opacity-80">
            {Number(form.fruit_quantity_kg).toFixed(1)} kg fruta →{' '}
            <span className="font-bold text-white">{form.pulp_quantity_packages} paquetes</span>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">≈ kg/paquete</p>
            <p className="text-lg font-bold">
              {(Number(form.fruit_quantity_kg) / Number(form.pulp_quantity_packages)).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones (opcional)</label>
        <input
          type="text"
          placeholder="Ej: Fruta en buen estado, pulpa fina..."
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
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
          disabled={guardando || !pulpaAsignada || sinStock}
          className="flex-1 bg-[#f56523] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {guardando ? 'Registrando...' : 'Registrar transformación'}
        </button>
      </div>
    </div>
  )
}

const inputClass = 'w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent'
