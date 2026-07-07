import { useState, useEffect } from 'react'
import {
  crearProducto,
  actualizarProducto,
  getPrecioActual,
  crearPrecio,
} from '../../api/productos'
import InputPrecioCOP from '../../components/ui/InputPrecioCOP'
import {
  formatCOP,
  parsePrecioCOP,
  formatPrecioInput,
  esCambioSospechoso,
  labelTipoPrecio,
} from '../../lib/precios'

const hoy = () => new Date().toISOString().split('T')[0]

const TIPO_PRECIO_LABEL = { retail: 'Detal', wholesale: 'Mayorista' }

const CATEGORIAS = [
  { value: 'own',       label: 'Propio',   desc: 'Se produce en la finca' },
  { value: 'purchased', label: 'Comprado', desc: 'Se compra a proveedores' },
  { value: 'pulp',      label: 'Pulpa',    desc: 'Producto procesado' },
]

export default function FormProducto({ producto, onGuardado, onCerrar }) {
  const esEdicion = !!producto

  const [form, setForm] = useState({
    name:          producto?.name          ?? '',
    category:      producto?.category      ?? 'own',
    is_pulp_fruit: producto?.is_pulp_fruit ?? false,
    active:        producto?.active        ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [precios, setPrecios] = useState({ retail: null, wholesale: null })
  const [editandoPrecio, setEditandoPrecio] = useState(null)
  const [formPrecio, setFormPrecio] = useState({ value: '', valid_from: hoy() })
  const [guardandoPrecio, setGuardandoPrecio] = useState(false)
  const [confirmarPrecio, setConfirmarPrecio] = useState(null)

  useEffect(() => {
    if (esEdicion && producto.id) {
      getPrecioActual(producto.id).then(({ data }) => {
        setPrecios({
          retail:    data.data?.retail    ?? null,
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

  const ejecutarGuardarPrecio = async () => {
    const valor = parsePrecioCOP(formPrecio.value)
    setGuardandoPrecio(true)
    try {
      const { data } = await crearPrecio(producto.id, {
        type:       editandoPrecio,
        value:      valor,
        valid_from: formPrecio.valid_from,
      })
      setPrecios((prev) => ({ ...prev, [editandoPrecio]: data.data }))
      setEditandoPrecio(null)
      setConfirmarPrecio(null)
      setFormPrecio({ value: '', valid_from: hoy() })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar el precio.')
    } finally {
      setGuardandoPrecio(false)
    }
  }

  const handleGuardarPrecio = () => {
    const valor = parsePrecioCOP(formPrecio.value)
    if (valor == null || valor <= 0) {
      setError('El precio debe ser mayor a cero.')
      return
    }

    const anterior = precios[editandoPrecio]?.value != null
      ? Number(precios[editandoPrecio].value)
      : null

    if (anterior != null && Math.abs(valor - anterior) > 0.001) {
      setConfirmarPrecio({ anterior, nuevo: valor, tipo: editandoPrecio })
      setError(null)
      return
    }

    ejecutarGuardarPrecio()
  }

  const abrirEditarPrecio = (tipo) => {
    setEditandoPrecio(tipo)
    setConfirmarPrecio(null)
    setFormPrecio({
      value: precios[tipo] ? formatPrecioInput(String(precios[tipo].value)) : '',
      valid_from: hoy(),
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
              onClick={() => setForm((f) => ({ ...f, is_pulp_fruit: !f.is_pulp_fruit }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.is_pulp_fruit ? 'bg-[#f56523]' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.is_pulp_fruit ? 'translate-x-5' : 'translate-x-1'
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
              onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                form.active ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                form.active ? 'translate-x-5' : 'translate-x-1'
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
            {['retail', 'wholesale'].map((tipo) => (
              <div key={tipo}>
                {editandoPrecio === tipo ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
                    {confirmarPrecio?.tipo === tipo ? (
                      <>
                        <p className="text-xs font-semibold text-[#1a365d]">
                          Confirmar cambio de precio {labelTipoPrecio(tipo)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {confirmarPrecio.anterior != null && (
                            <>
                              <span className="line-through text-gray-400">
                                {formatCOP(confirmarPrecio.anterior)}
                              </span>
                              {' → '}
                            </>
                          )}
                          <span className="font-semibold">{formatCOP(confirmarPrecio.nuevo)}</span>
                          {' '}/ kg
                        </p>
                        {esCambioSospechoso(confirmarPrecio.anterior, confirmarPrecio.nuevo) && (
                          <p className="text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded-lg px-2 py-1.5">
                            El cambio es muy grande. ¿Seguro que no falta o sobra un cero?
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmarPrecio(null)}
                            disabled={guardandoPrecio}
                            className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-xs font-medium"
                          >
                            Volver
                          </button>
                          <button
                            onClick={ejecutarGuardarPrecio}
                            disabled={guardandoPrecio}
                            className="flex-1 bg-[#1a365d] text-white py-2 rounded-lg text-xs font-medium disabled:opacity-60"
                          >
                            {guardandoPrecio ? 'Guardando...' : 'Confirmar'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                    <p className="text-xs font-semibold text-orange-700">
                      Nuevo precio {TIPO_PRECIO_LABEL[tipo]}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">$/kg *</label>
                        <InputPrecioCOP
                          autoFocus
                          placeholder="0"
                          value={formPrecio.value}
                          onChange={(v) => setFormPrecio((p) => ({ ...p, value: v }))}
                          sospechoso={esCambioSospechoso(
                            precios[tipo]?.value != null ? Number(precios[tipo].value) : null,
                            parsePrecioCOP(formPrecio.value),
                          )}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-0.5 block">Vigente desde</label>
                        <input
                          type="date"
                          value={formPrecio.valid_from}
                          onChange={(e) => setFormPrecio((p) => ({ ...p, valid_from: e.target.value }))}
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
                        onClick={() => { setEditandoPrecio(null); setConfirmarPrecio(null) }}
                        className="px-3 border border-gray-300 rounded-lg text-xs text-gray-400"
                      >
                        ×
                      </button>
                    </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-gray-400">{TIPO_PRECIO_LABEL[tipo]}</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {precios[tipo]
                          ? formatCOP(precios[tipo].value) + ' / kg'
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
