import { useState, useEffect } from 'react'
import { crearLabor, getInsumos, crearInsumo } from '../../api/labores'
import SelectBuscable from '../../components/ui/SelectBuscable'

const hoy = () => new Date().toISOString().split('T')[0]

const TIPOS_LABOR = [
  'Siembra', 'Cosecha', 'Fumigación', 'Fertilización',
  'Poda', 'Riego', 'Limpieza', 'Control de plagas', 'Otro',
]

const lineaInsumoVacia = () => ({ id: Math.random(), supply_id: '', quantity_used: '' })

export default function FormLabor({ onGuardado, onCerrar }) {
  const [insumos, setInsumos] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [mostrarInsumos, setMostrarInsumos] = useState(false)

  const [pendingInsumo, setPendingInsumo] = useState(null) // { name, lineaId }
  const [formInsumo, setFormInsumo] = useState({ type: 'other', unit: '' })

  const [form, setForm] = useState({
    date:        hoy(),
    task_type:   '',
    crop:        '',
    responsible: '',
    description: '',
  })
  const [lineasInsumo, setLineasInsumo] = useState([lineaInsumoVacia()])

  useEffect(() => {
    getInsumos().then(({ data }) => setInsumos(data.data)).catch(() => {})
  }, [])

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))

  const actualizarLinea = (id, campo, valor) =>
    setLineasInsumo((prev) => prev.map((l) => l.id === id ? { ...l, [campo]: valor } : l))

  const agregarLinea = () => setLineasInsumo((prev) => [...prev, lineaInsumoVacia()])
  const eliminarLinea = (id) => setLineasInsumo((prev) => prev.filter((l) => l.id !== id))

  const handleIniciarCrearInsumo = (name, lineaId) => {
    setPendingInsumo({ name, lineaId })
    setFormInsumo({ type: 'other', unit: '' })
  }

  const handleConfirmarInsumo = async () => {
    if (!formInsumo.unit.trim()) {
      setError('Indica la unidad de medida del insumo (Ej: litros, kg, gramos).')
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
    } catch (err) {
      setError(err.response?.data?.message ?? 'No se pudo crear el insumo.')
    }
  }

  const handleSubmit = async () => {
    setError(null)
    if (!form.task_type.trim()) { setError('El tipo de labor es obligatorio.'); return }

    if (mostrarInsumos) {
      if (lineasInsumo.some((l) => (l.supply_id && !l.quantity_used) || (!l.supply_id && l.quantity_used))) {
        setError('Completa todos los campos de cada insumo o elimina las líneas vacías.')
        return
      }
    }

    setGuardando(true)
    try {
      const payload = {
        date:        form.date,
        task_type:   form.task_type,
        crop:        form.crop        || undefined,
        responsible: form.responsible || undefined,
        description: form.description || undefined,
      }

      if (mostrarInsumos) {
        const lineasValidas = lineasInsumo.filter((l) => l.supply_id && l.quantity_used)
        if (lineasValidas.length > 0) {
          payload.supplies = lineasValidas.map((l) => ({
            supply_id:     l.supply_id,
            quantity_used: l.quantity_used,
          }))
        }
      }

      await crearLabor(payload)
      onGuardado()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al registrar la labor.')
    } finally {
      setGuardando(false)
    }
  }

  const tipoSeleccionado = TIPOS_LABOR.includes(form.task_type) || form.task_type === ''

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Cultivo / Lote</label>
          <input
            type="text"
            placeholder="Ej: Plátano, Lote 3..."
            value={form.crop}
            onChange={(e) => set('crop', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">Tipo de labor *</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {TIPOS_LABOR.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set('task_type', t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                form.task_type === t
                  ? 'bg-[#1a365d] text-white'
                  : 'bg-white border border-gray-200 text-gray-500 hover:border-[#1a365d]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {(form.task_type === 'Otro' || !tipoSeleccionado) && (
          <input
            type="text"
            autoFocus={form.task_type === 'Otro'}
            placeholder="Describir labor..."
            value={form.task_type === 'Otro' ? '' : form.task_type}
            onChange={(e) => set('task_type', e.target.value)}
            className={inputClass}
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Responsable</label>
        <input
          type="text"
          placeholder="Nombre de quien realizó la labor"
          value={form.responsible}
          onChange={(e) => set('responsible', e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Descripción (opcional)</label>
        <textarea
          placeholder="Detalles adicionales..."
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setMostrarInsumos((v) => !v)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              mostrarInsumos ? 'bg-[#f56523]' : 'bg-gray-300'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              mostrarInsumos ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Se usaron insumos</p>
            <p className="text-xs text-gray-400">Abonos, químicos u otros materiales</p>
          </div>
        </label>
      </div>

      {mostrarInsumos && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Insumos usados</label>
            <button
              type="button"
              onClick={agregarLinea}
              className="text-xs text-[#f56523] font-semibold hover:underline"
            >
              + Agregar
            </button>
          </div>

          {lineasInsumo.map((linea, idx) => (
            <div key={linea.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">#{idx + 1}</span>
                {lineasInsumo.length > 1 && (
                  <button onClick={() => eliminarLinea(linea.id)} className="text-xs text-red-400 hover:text-red-600">
                    Eliminar
                  </button>
                )}
              </div>

              <SelectBuscable
                opciones={insumos.map((i) => ({
                  value: i.id,
                  label: `${i.name} (${i.unit})`,
                }))}
                value={linea.supply_id}
                onChange={(v) => actualizarLinea(linea.id, 'supply_id', v)}
                placeholder="Buscar insumo..."
                onCrear={(name) => handleIniciarCrearInsumo(name, linea.id)}
              />

              {pendingInsumo?.lineaId === linea.id && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                  <p className="text-xs font-semibold text-blue-700">
                    Nuevo insumo: "{pendingInsumo.name}"
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-0.5 block">Tipo</label>
                      <div className="flex rounded-lg overflow-hidden border border-gray-300">
                        {[['chemical', 'Químico'], ['fertilizer', 'Abono'], ['other', 'Otro']].map(([v, l]) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setFormInsumo((f) => ({ ...f, type: v }))}
                            className={`flex-1 py-2 text-xs font-medium transition-colors ${
                              formInsumo.type === v
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
                      <label className="text-xs text-gray-400 mb-0.5 block">Unidad *</label>
                      <input
                        type="text"
                        autoFocus
                        placeholder="kg, litros, g..."
                        value={formInsumo.unit}
                        onChange={(e) => setFormInsumo((f) => ({ ...f, unit: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmarInsumo}
                      className="flex-1 bg-[#1a365d] text-white py-2 rounded-lg text-xs font-medium"
                    >
                      Crear insumo
                    </button>
                    <button
                      onClick={() => setPendingInsumo(null)}
                      className="px-3 border border-gray-300 rounded-lg text-xs text-gray-400"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 mb-0.5 block">
                  Cantidad *
                  {linea.supply_id && (() => {
                    const ins = insumos.find((i) => String(i.id) === String(linea.supply_id))
                    return ins ? <span className="ml-1 text-gray-300">({ins.unit})</span> : null
                  })()}
                </label>
                <input
                  type="number"
                  min="0.001"
                  step="0.1"
                  placeholder="0"
                  value={linea.quantity_used}
                  onChange={(e) => actualizarLinea(linea.id, 'quantity_used', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
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
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={guardando}
          className="flex-1 bg-[#f56523] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Registrar labor'}
        </button>
      </div>
    </div>
  )
}

const inputClass = 'w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523] focus:border-transparent'
