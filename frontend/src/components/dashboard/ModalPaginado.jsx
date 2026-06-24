import { useState } from 'react'
import Modal from '../ui/Modal'

export default function ModalPaginado({
  titulo,
  items = [],
  porPagina = 10,
  onClose,
  renderItem,
  vacio = 'No hay registros.',
}) {
  const [pagina, setPagina] = useState(1)
  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * porPagina
  const slice = items.slice(inicio, inicio + porPagina)

  return (
    <Modal titulo={titulo} onClose={onClose}>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">{vacio}</p>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">
            {items.length} registro{items.length !== 1 ? 's' : ''} en total
          </p>
          <div className="space-y-1 max-h-[55vh] overflow-y-auto">{slice.map(renderItem)}</div>
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={paginaActual <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-500">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
