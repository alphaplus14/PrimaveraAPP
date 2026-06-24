export default function Paginacion({
  pagina,
  totalPaginas,
  total,
  totalGeneral,
  porPagina,
  inicio,
  filtrado,
  onAnterior,
  onSiguiente,
  sustantivo = 'registro',
}) {
  const fin = Math.min(inicio + porPagina, total)
  const etiqueta = total !== 1 ? `${sustantivo}s` : sustantivo

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-400 text-center sm:text-left">
        {totalPaginas > 1
          ? `Mostrando ${inicio + 1}–${fin} de ${total} ${etiqueta}`
          : `${total} ${etiqueta}`}
        {filtrado ? ` (filtrado de ${totalGeneral})` : ''}
      </p>

      {totalPaginas > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={onAnterior}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Anterior
          </button>
          <span className="text-xs text-gray-500 min-w-28 text-center">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={onSiguiente}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
