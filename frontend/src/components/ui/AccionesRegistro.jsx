const ICONO_EDITAR = '/assets/icons/editar%20icono.png'

export default function AccionesRegistro({
  etiqueta,
  onEditar,
  onEliminar,
  className = '',
  tamano = 'w-9 h-9',
}) {
  return (
    <div className={`flex items-center gap-1 shrink-0 ${className}`}>
      <button
        type="button"
        onClick={onEditar}
        aria-label={`Editar ${etiqueta}`}
        className={`inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-orange-50 hover:border-orange-200 transition-colors ${tamano}`}
      >
        <img src={ICONO_EDITAR} alt="" className="w-4 h-4 object-contain opacity-80" />
      </button>
      {onEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          aria-label={`Eliminar ${etiqueta}`}
          className={`inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors ${tamano}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
