import { useState, useEffect, useMemo } from 'react'
import {
  getRevisionDiaria,
  completarRevisionPrecios,
  omitirRevisionPrecios,
} from '../api/precios'
import Modal from './ui/Modal'
import Paginacion from './ui/Paginacion'
import InputPrecioCOP from './ui/InputPrecioCOP'
import { CATEGORY_LABEL } from '../constants/enums'
import {
  formatCOP,
  parsePrecioCOP,
  formatPrecioInput,
  detectarCambiosPrecios,
  esCambioSospechoso,
  validarPreciosEntrada,
} from '../lib/precios'

import { hoyLocal } from '../lib/fechas'

const hoy = hoyLocal
const POR_PAGINA = 10

export default function ModalRevisionPrecios({ onCerrar, onCompletado }) {
  const [productos, setProductos] = useState([])
  const [precios, setPrecios] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [paso, setPaso] = useState('editar')
  const [cambiosConfirmar, setCambiosConfirmar] = useState([])

  useEffect(() => {
    getRevisionDiaria()
      .then(({ data }) => {
        const lista = data.data ?? []
        setProductos(lista)
        const inicial = {}
        lista.forEach((p) => {
          inicial[p.id] = {
            retail:
              p.retail?.value != null ? formatPrecioInput(String(p.retail.value)) : '',
            wholesale:
              p.wholesale?.value != null ? formatPrecioInput(String(p.wholesale.value)) : '',
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

  const listaFiltrada = useMemo(
    () =>
      productos.filter((p) =>
        p.name.toLowerCase().includes(busqueda.toLowerCase()),
      ),
    [productos, busqueda],
  )

  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * POR_PAGINA
  const paginaItems = listaFiltrada.slice(inicio, inicio + POR_PAGINA)

  useEffect(() => {
    setPagina(1)
  }, [busqueda])

  const construirPayload = () =>
    productos
      .map((p) => {
        const fila = precios[p.id] ?? {}
        const payload = { product_id: p.id }
        const retail = parsePrecioCOP(fila.retail)
        const wholesale = parsePrecioCOP(fila.wholesale)
        if (retail != null && retail >= 0) payload.retail = retail
        if (wholesale != null && wholesale >= 0) payload.wholesale = wholesale
        return Object.keys(payload).length > 1 ? payload : null
      })
      .filter(Boolean)

  const ejecutarGuardado = async () => {
    setGuardando(true)
    try {
      const { data } = await completarRevisionPrecios(construirPayload())
      onCompletado(data.data)
      onCerrar()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al guardar los precios.')
      setPaso('editar')
    } finally {
      setGuardando(false)
    }
  }

  const handleGuardar = () => {
    setError(null)
    const msgInvalido = validarPreciosEntrada(productos, precios)
    if (msgInvalido) {
      setError(msgInvalido)
      return
    }

    const cambios = detectarCambiosPrecios(productos, precios)
    if (cambios.length === 0) {
      ejecutarGuardado()
      return
    }

    setCambiosConfirmar(cambios)
    setPaso('confirmar')
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

  const esSospechosoEnFila = (p, campo) => {
    const fila = precios[p.id] ?? {}
    const nuevo = parsePrecioCOP(fila[campo])
    const anterior = p[campo]?.value != null ? Number(p[campo].value) : null
    return esCambioSospechoso(anterior, nuevo)
  }

  const haySospechosos = cambiosConfirmar.some((c) => c.sospechoso)

  return (
    <Modal
      titulo={paso === 'confirmar' ? 'Confirmar cambios de precio' : `Precios del día — ${hoy()}`}
      onClose={onCerrar}
      ancho="lg"
    >
      {paso === 'confirmar' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Revisa los precios que cambiaron antes de guardar.
          </p>

          {haySospechosos && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Hay cambios muy grandes (más del triple o menos de un tercio). Verifica que no
              falte o sobre un cero.
            </div>
          )}

          <div className="max-h-[45vh] overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
            {cambiosConfirmar.map((c) => (
              <div
                key={`${c.productId}-${c.campo}`}
                className={`p-3 text-sm ${c.sospechoso ? 'bg-amber-50' : ''}`}
              >
                <p className="font-medium text-gray-800">{c.nombre}</p>
                <p className="text-gray-500 mt-0.5">
                  {c.tipoLabel}:{' '}
                  {c.anterior != null ? (
                    <>
                      <span className="line-through text-gray-400">{formatCOP(c.anterior)}</span>
                      {' → '}
                    </>
                  ) : (
                    'Nuevo: '
                  )}
                  <span className={c.sospechoso ? 'font-semibold text-amber-700' : 'font-semibold text-[#1a365d]'}>
                    {formatCOP(c.nuevo)}
                  </span>
                </p>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setPaso('editar'); setError(null) }}
              disabled={guardando}
              className="flex-1 border border-gray-300 text-gray-600 py-3 rounded-xl text-sm font-medium disabled:opacity-60"
            >
              Volver a editar
            </button>
            <button
              type="button"
              onClick={ejecutarGuardado}
              disabled={guardando}
              className="flex-1 bg-[#1a365d] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Sí, confirmar precios'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Confirma o actualiza los precios detal y mayorista. Escribe en miles (ej. 3.500).
            Solo se guardan cambios respecto al precio vigente.
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
                <p className="p-4 text-sm text-gray-400 text-center">
                  {busqueda ? `Sin resultados para "${busqueda}".` : 'Sin productos activos.'}
                </p>
              ) : (
                paginaItems.map((p) => {
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
                        <InputPrecioCOP
                          value={fila.retail}
                          onChange={(v) => actualizar(p.id, 'retail', v)}
                          placeholder={p.retail ? formatCOP(p.retail.value) : '0'}
                          sospechoso={esSospechosoEnFila(p, 'retail')}
                          className={inputClass}
                        />
                      </label>
                      <label className="text-xs">
                        <span className="text-gray-500 block mb-0.5">Mayorista</span>
                        <InputPrecioCOP
                          value={fila.wholesale}
                          onChange={(v) => actualizar(p.id, 'wholesale', v)}
                          placeholder={p.wholesale ? formatCOP(p.wholesale.value) : '0'}
                          sospechoso={esSospechosoEnFila(p, 'wholesale')}
                          className={inputClass}
                        />
                      </label>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {!cargando && listaFiltrada.length > 0 && (
            <Paginacion
              pagina={paginaActual}
              totalPaginas={totalPaginas}
              total={listaFiltrada.length}
              totalGeneral={productos.length}
              porPagina={POR_PAGINA}
              inicio={inicio}
              filtrado={!!busqueda}
              sustantivo="producto"
              compact
              onAnterior={() => setPagina((p) => Math.max(1, p - 1))}
              onSiguiente={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            />
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
      )}
    </Modal>
  )
}

const inputClass =
  'w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#f56523]'
