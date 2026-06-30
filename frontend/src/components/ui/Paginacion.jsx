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
  compact = false,
  embedded = false,
}) {
  const fin = Math.min(inicio + porPagina, total)
  const etiqueta = total !== 1 ? `${sustantivo}s` : sustantivo

  const btnClass = compact
    ? 'text-xs px-2 py-1 rounded-md border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors'
    : 'text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40 hover:bg-gray-50 transition-colors'

  return (
    <div
      className={
        embedded
          ? 'flex items-center justify-between gap-2'
          : `flex items-center justify-between gap-2 ${
              compact ? 'mt-3' : 'flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-100'
            }`
      }
    >
      <p className={`text-gray-400 shrink-0 ${compact ? 'text-[11px]' : 'text-xs text-center sm:text-left'}`}>
        {totalPaginas > 1
          ? `${inicio + 1}–${fin} de ${total} ${etiqueta}`
          : `${total} ${etiqueta}`}
        {filtrado ? ` · ${totalGeneral} total` : ''}
      </p>

      {totalPaginas > 1 && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            disabled={pagina <= 1}
            onClick={onAnterior}
            aria-label="Página anterior"
            className={btnClass}
          >
            ‹
          </button>
          <span className={`text-gray-500 tabular-nums text-center ${compact ? 'text-[11px] min-w-[4.5rem]' : 'text-xs min-w-28'}`}>
            {pagina} / {totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={onSiguiente}
            aria-label="Página siguiente"
            className={btnClass}
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
