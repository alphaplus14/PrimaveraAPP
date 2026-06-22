import { useState, useEffect } from 'react'
import {
  crearProducto,
  actualizarProducto,
  getPrecioActual,
  crearPrecio,
} from '../../api/productos'
import { CATEGORY_LABEL, SALE_TYPE_LABEL } from '../../constants/enums'

const hoy = () => new Date().toISOString().split('T')[0]

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const CATEGORIAS = [
  { value: 'own', label: 'Propio', desc: 'Se produce en la finca' },
  { value: 'purchased', label: 'Comprado', desc: 'Se compra a proveedores' },
  { value: 'pulp', label: 'Pulpa', desc: 'Producto procesado' },
]

export default function FormProducto({ producto, onGuardado, onCerrar }) {
  const esEdicion = !!producto

  const [form, setForm] = useState({
    name: producto?.name ?? '',
    category: producto?.category ?? 'own',
    is_fruit_for_pulp: producto?.is_fruit_for_pulp ?? false,
    is_active: producto?.is_active ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [precios, setPrecios] = useState({ retail: null, wholesale: null })
  const [editandoPrecio, setEditandoPrecio] = useState(null)
  const [formPrecio, setFormPrecio] = useState({ amount: '', effective_from: hoy() })
  const [guardandoPrecio, setGuardandoPrecio] = useState(false)

  useEffect(() => {
    if (esEdicion && producto.id) {
      getPrecioActual(producto.id).then(({ data }) => {
        setPrecios({
          retail: data.data?.retail ?? null,
          wholesale: data.data?.wholesale ?? null,
        })
      }).catch(() => {})
    }
  }, [esEdicion, producto?.id])

  const handleSubmit = async () => {
    setError(null)
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }

    setGuardando(true)
    try {
      if (esEdicion) {
        await actualizarProducto(producto.id, form)
      } else {
        await crearProducto(form)
      }
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar.')
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardarPrecio = async () => {
    if (!formPrecio.amount || Number(formPrecio.amount) <= 0) {
      setError('El precio debe ser mayor a cero.')
      return
    }
    setGuardandoPrecio(true)
    try {
      const { data } = await crearPrecio(producto.id, {
        type: editandoPrecio,
        amount: formPrecio.amount,
        effective_from: formPrecio.effective_from,
      })
      setPrecios((prev) => ({ ...prev, [editandoPrecio]: data.data }))
      setEditandoPrecio(null)
      setFormPrecio({ amount: '', effective_from: hoy() })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar el precio.')
    } finally {
      setGuardandoPrecio(false)
    }
  }

  const abrirEditarPrecio = (type) => {
    setEditandoPrecio(type)
    setFormPrecio({
      amount: precios[type] ? String(Number(precios[type].amount)) : '',
      effective_from: hoy(),
    })
    setError(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
        <input
          type="text"
          autoFocus
          placeholder="Ej: Plátano, Maracuyá, Pulpa de Lulo..."
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Categoría *</label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
              className={`flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all ${
                form.category === cat.value
                  ? 'border-[#f56523] bg-orange-50 text-[#f56523]'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <span className="text-sm font-semibold">{cat.label}</span>
              <span className="text-xs mt-0.5 opacity-70 leading-tight">{cat.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {form.category !== 'pulp' && (
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm((f) => ({ ...f, is_fruit_for_pulp: !f.is_fruit_for_pulp }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.is_fruit_for_pulp ? 'bg-[#f56523]' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.is_fruit_for_pulp ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Se transforma en pulpa</p>
              <p className="text-xs text-gray-400">Activa la opción de transformación en inventario</p>
            </div>
          </label>
        </div>
      )}

      {esEdicion && (
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.is_active ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.is_active ? 'translate-x-5' : 'translate-x-1'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Producto activo</p>
              <p className="text-xs text-gray-400">Los productos inactivos no aparecen en formularios</p>
            </div>
          </label>
        </div>
      )}

      {esEdicion && (
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Precios de venta
          </label>
          <div className="space-y-2">
            {['retail', 'wholesale'].map((type) => (
              <div key={type}>
                {editandoPrecio === type ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-orange-700">
                      Nuevo precio {SALE_TYPE_LABEL[type] ?? type}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">$/kg *</label>
                        <input
                          type="number"
                          autoFocus
                          min="1"
                          step="100"
                          placeholder="0"
                          value={formPrecio.amount}
                          onChange={(e) => setFormPrecio((p) => ({ ...p, amount: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">Vigente desde</label>
                        <input
                          type="date"
                          value={formPrecio.effective_from}
                          onChange={(e) => setFormPrecio((p) => ({ ...p, effective_from: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGuardarPrecio}
                        disabled={guardandoPrecio}
                        className="flex-1 bg-[#f56523] text-white py-2 rounded-lg text-xs font-medium disabled:opacity-60"
                      >
                        {guardandoPrecio ? 'Guardando...' : 'Guardar precio'}
                      </button>
                      <button
                        onClick={() => setEditandoPrecio(null)}
                        className="px-3 border border-gray-300 rounded-lg text-xs text-gray-400"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-400">{SALE_TYPE_LABEL[type] ?? type}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {precios[type]
                          ? formatCOP(precios[type].amount) + ' / kg'
                          : <span className="text-gray-400 font-normal">Sin precio</span>
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => abrirEditarPrecio(type)}
                      className="text-xs text-[#f56523] font-medium hover:underline"
                    >
                      {precios[type] ? 'Actualizar' : 'Definir'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={onCerrar}
          className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium"
        >
          {esEdicion ? 'Cerrar' : 'Cancelar'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={guardando}
          className="flex-1 bg-[#f56523] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </div>
  )
}

const inputClass = 'w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent'
