import { useState, useEffect } from 'react'
import {
  crearProducto,
  actualizarProducto,
  getPrecioActual,
  crearPrecio,
} from '../../api/productos'

const hoy = () => new Date().toISOString().split('T')[0]

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const TIPO_PRECIO_LABEL = { detal: 'Detal', mayorista: 'Mayorista' }

const CATEGORIAS = [
  { value: 'propio',    label: 'Propio',   desc: 'Se produce en la finca' },
  { value: 'comprado',  label: 'Comprado', desc: 'Se compra a proveedores' },
  { value: 'pulpa',     label: 'Pulpa',    desc: 'Producto procesado' },
]

export default function FormProducto({ producto, onGuardado, onCerrar }) {
  const esEdicion = !!producto

  const [form, setForm] = useState({
    nombre:              producto?.nombre ?? '',
    categoria:           producto?.categoria ?? 'propio',
    es_fruta_para_pulpa: producto?.es_fruta_para_pulpa ?? false,
    activo:              producto?.activo ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [precios, setPrecios] = useState({ detal: null, mayorista: null })
  const [editandoPrecio, setEditandoPrecio] = useState(null)
  const [formPrecio, setFormPrecio] = useState({ valor: '', fecha_vigencia_desde: hoy() })
  const [guardandoPrecio, setGuardandoPrecio] = useState(false)

  useEffect(() => {
    if (esEdicion && producto.id) {
      getPrecioActual(producto.id).then(({ data }) => {
        setPrecios({
          detal:     data.data?.detal     ?? null,
          mayorista: data.data?.mayorista ?? null,
        })
      }).catch(() => {})
    }
  }, [esEdicion, producto?.id])

  const handleSubmit = async () => {
    setError(null)
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }

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
    if (!formPrecio.valor || Number(formPrecio.valor) <= 0) {
      setError('El precio debe ser mayor a cero.')
      return
    }
    setGuardandoPrecio(true)
    try {
      const { data } = await crearPrecio(producto.id, {
        tipo:                 editandoPrecio,
        valor:                formPrecio.valor,
        fecha_vigencia_desde: formPrecio.fecha_vigencia_desde,
      })
      setPrecios((prev) => ({ ...prev, [editandoPrecio]: data.data }))
      setEditandoPrecio(null)
      setFormPrecio({ valor: '', fecha_vigencia_desde: hoy() })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar el precio.')
    } finally {
      setGuardandoPrecio(false)
    }
  }

  const abrirEditarPrecio = (tipo) => {
    setEditandoPrecio(tipo)
    setFormPrecio({
      valor:                precios[tipo] ? String(Number(precios[tipo].valor)) : '',
      fecha_vigencia_desde: hoy(),
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
          value={form.nombre}
          onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
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
              onClick={() => setForm((f) => ({ ...f, categoria: cat.value }))}
              className={`flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all ${
                form.categoria === cat.value
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

      {form.categoria !== 'pulpa' && (
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setForm((f) => ({ ...f, es_fruta_para_pulpa: !f.es_fruta_para_pulpa }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.es_fruta_para_pulpa ? 'bg-[#f56523]' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.es_fruta_para_pulpa ? 'translate-x-5' : 'translate-x-1'
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
              onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.activo ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.activo ? 'translate-x-5' : 'translate-x-1'
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
            {['detal', 'mayorista'].map((tipo) => (
              <div key={tipo}>
                {editandoPrecio === tipo ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-orange-700">
                      Nuevo precio {TIPO_PRECIO_LABEL[tipo]}
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
                          value={formPrecio.valor}
                          onChange={(e) => setFormPrecio((p) => ({ ...p, valor: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">Vigente desde</label>
                        <input
                          type="date"
                          value={formPrecio.fecha_vigencia_desde}
                          onChange={(e) => setFormPrecio((p) => ({ ...p, fecha_vigencia_desde: e.target.value }))}
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
                      <p className="text-xs text-gray-400">{TIPO_PRECIO_LABEL[tipo]}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {precios[tipo]
                          ? formatCOP(precios[tipo].valor) + ' / kg'
                          : <span className="text-gray-400 font-normal">Sin precio</span>
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => abrirEditarPrecio(tipo)}
                      className="text-xs text-[#f56523] font-medium hover:underline"
                    >
                      {precios[tipo] ? 'Actualizar' : 'Definir'}
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
