import { useState, useRef, useEffect } from 'react'

// Select con búsqueda en tiempo real
// Props:
//   opciones: [{ value, label }]
//   value: string (value seleccionado)
//   onChange: (value) => void
//   placeholder: string
//   onCrear: (texto) => void  (opcional — muestra botón "Crear X" si se pasa)
export default function SelectBuscable({ opciones = [], value, onChange, placeholder = 'Buscar...', onCrear }) {
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  // Texto del ítem seleccionado
  const seleccionado = opciones.find((o) => String(o.value) === String(value))

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtradas = opciones.filter((o) =>
    o.label.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleSeleccionar = (opcion) => {
    onChange(String(opcion.value))
    setBusqueda('')
    setAbierto(false)
  }

  const handleAbrir = () => {
    setBusqueda('')
    setAbierto(true)
  }

  const handleCrear = () => {
    if (onCrear && busqueda.trim()) {
      onCrear(busqueda.trim())
      setBusqueda('')
      setAbierto(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Input principal */}
      {abierto ? (
        <input
          autoFocus
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setAbierto(false)
            if (e.key === 'Enter' && filtradas.length === 1) handleSeleccionar(filtradas[0])
          }}
          placeholder="Escribir para buscar..."
          className="w-full border border-[#f56523] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523]"
        />
      ) : (
        <button
          type="button"
          onClick={handleAbrir}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-left flex items-center justify-between hover:border-gray-400 transition-colors bg-white"
        >
          <span className={seleccionado ? 'text-gray-800' : 'text-gray-400'}>
            {seleccionado ? seleccionado.label : placeholder}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Dropdown */}
      {abierto && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtradas.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              {onCrear && busqueda.trim() ? (
                <button
                  type="button"
                  onClick={handleCrear}
                  className="w-full text-left text-[#f56523] font-medium"
                >
                  + Crear "{busqueda}"
                </button>
              ) : (
                'Sin resultados'
              )}
            </div>
          ) : (
            <>
              {filtradas.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => handleSeleccionar(o)}
                  className={`w-full text-left px-3 py-2.5 text-sm hover:bg-orange-50 transition-colors ${
                    String(o.value) === String(value) ? 'bg-orange-50 text-[#f56523] font-medium' : 'text-gray-700'
                  }`}
                >
                  {o.label}
                </button>
              ))}
              {onCrear && busqueda.trim() && filtradas.length > 0 && (
                <button
                  type="button"
                  onClick={handleCrear}
                  className="w-full text-left px-3 py-2.5 text-sm text-[#f56523] font-medium border-t border-gray-100 hover:bg-orange-50"
                >
                  + Crear "{busqueda}"
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
