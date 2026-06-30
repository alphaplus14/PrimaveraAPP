import { Component } from 'react'

/**
 * Captura errores de render de React para evitar la pantalla en blanco.
 * Muestra una pantalla amigable y permite recargar la app.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // En producción se podría enviar a un servicio de logging.
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary capturó un error:', error, info)
    }
  }

  handleRecargar = () => {
    this.setState({ hasError: false })
    window.location.assign('/')
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h1 className="text-xl font-bold text-[#1a365d] mb-2">Algo salió mal</h1>
          <p className="text-sm text-gray-500 mb-6">
            Ocurrió un error inesperado en la aplicación. Puedes volver al inicio e
            intentarlo de nuevo. Si el problema continúa, cierra sesión y vuelve a entrar.
          </p>
          <button
            type="button"
            onClick={this.handleRecargar}
            className="w-full bg-[#f56523] hover:bg-[#d9541a] text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }
}
