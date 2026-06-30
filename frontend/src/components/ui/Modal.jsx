import { useEffect } from 'react'

export default function Modal({ titulo, onClose, children, ancho = 'md' }) {
  const anchoClass = ancho === 'lg' ? 'md:max-w-2xl' : 'md:max-w-md'
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Fondo oscuro */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel — desliza desde abajo en móvil, centrado en desktop */}
      <div className={`relative bg-white w-full ${anchoClass} md:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{titulo}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
