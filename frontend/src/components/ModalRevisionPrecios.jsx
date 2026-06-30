import { useState, useEffect } from 'react'
import {
  getRevisionDiaria,
  completarRevisionPrecios,
  omitirRevisionPrecios,
} from '../api/precios'
import Modal from './ui/Modal'
import { CATEGORY_LABEL } from '../constants/enums'

const hoy = () => new Date().toISOString().split('T')[0]

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function ModalRevisionPrecios({ onCerrar, onCompletado }) {
  const [productos, setProductos] = useState([])
  const [precios, setPrecios] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    getRevisionDiaria()
      .then(({ data }) => {
        const lista = data.data ?? []
        setProductos(lista)
        const inicial = {}
        lista.forEach((p) => {
          inicial[p.id] = {
            retail: p.retail?.value != null ? String(p.retail.value) : '',
            wholesale: p.wholesale?.value != null ? String(p.wholesale.value) : '',
          }
        })
        setPrecios(inicial)
      })
      .catch(() => setError('No se pudieron cargar los precios.'))
      .finally(() => setCargando(false))
  }, [])

  const actualizar = (productId, campo, valor) => {
    setPrecios((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [campo]: valor },
    }))
  }

  const listaFiltrada = productos.filter((p) =>
    p.name.toLowerCase().includes(busqueda.toLowerCase()),
  )

  const construirPayload = () =>
    productos
      .map((p) => {
        const fila = precios[p.id] ?? {}
        const payload = { product_id: p.id }
        if (fila.retail !== '' && Number(fila.retail) >= 0) payload.retail = Number(fila.retail)
        if (fila.wholesale !== '' && Number(fila.wholesale) >= 0) payload.wholesale = Number(fila.wholesale)
        return Object.keys(payload).length > 1 ? payload : null
      })
      .filter(Boolean)

  const handleGuardar = async () => {
    setError(null)
    const invalido = productos.some((p) => {
      const fila = precios[p.id] ?? {}
      return (
        (fila.retail !== '' && Number(fila.retail) < 0) ||
        (fila.wholesale !== '' && Number(fila.wholesale) < 0)
      )
    })
    if (invalido) {
      setError('Los precios no pueden ser negativos.')
      return
    }

    setGuardando(true)
    try {
      const { data } = await completarRevisionPrecios(construirPayload())
      onCompletado(data.data)
      onCerrar()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar los precios.')
    } finally {
      setGuardando(false)
    }
  }

  const handleOmitir = async () => {
    setGuardando(true)
    setError(null)
    try {
      const { data } = await omitirRevisionPrecios()
      onCompletado(data.data)
      onCerrar()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al omitir la revisión.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      titulo={`Precios del día — ${hoy()}`}
      onClose={onCerrar}
      ancho="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Confirma o actualiza los precios detal y mayorista. Solo se guardan cambios respecto al
          precio vigente.
        </p>

        <input
          type="search"
          placeholder="Buscar producto..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523]"
        />

        {cargando ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
            {listaFiltrada.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">Sin productos activos.</p>
            ) : (
              listaFiltrada.map((p) => {
                const fila = precios[p.id] ?? { retail: '', wholesale: '' }
                return (
                  <div key={p.id} className="p-3 grid grid-cols-1 sm:grid-cols-[1fr_7rem_7rem] gap-2 sm:gap-3 items-center">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {CATEGORY_LABEL[p.category] ?? p.category} · {p.unit}
                      </p>
                    </div>
                    <label className="text-xs">
                      <span className="text-gray-500 block mb-0.5">Detal</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={fila.retail}
                        onChange={(e) => actualizar(p.id, 'retail', e.target.value)}
                        placeholder={p.retail ? formatCOP(p.retail.value) : '0'}
                        className={inputClass}
                      />
                    </label>
                    <label className="text-xs">
                      <span className="text-gray-500 block mb-0.5">Mayorista</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={fila.wholesale}
                        onChange={(e) => actualizar(p.id, 'wholesale', e.target.value)}
                        placeholder={p.wholesale ? formatCOP(p.wholesale.value) : '0'}
                        className={inputClass}
                      />
                    </label>
                  </div>
                )
              })
            )}
          </div>
        )}

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleOmitir}
            disabled={guardando || cargando}
            className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium disabled:opacity-60"
          >
            Omitir hasta mañana
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={guardando || cargando}
            className="flex-1 bg-[#1a365d] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar precios de hoy'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#f56523]'
