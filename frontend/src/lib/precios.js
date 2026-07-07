export const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const TIPO_LABEL = { retail: 'Detal', wholesale: 'Mayorista' }

/** Convierte texto con miles (35.000) a número entero COP. */
export function parsePrecioCOP(raw) {
  if (raw == null || raw === '') return null
  const digits = String(raw).replace(/\D/g, '')
  if (digits === '') return null
  return Number(digits)
}

/** Formatea para mostrar en el input mientras se escribe. */
export function formatPrecioInput(raw) {
  const n = parsePrecioCOP(raw)
  if (n == null) return ''
  return n.toLocaleString('es-CO')
}

export function labelTipoPrecio(tipo) {
  return TIPO_LABEL[tipo] ?? tipo
}

/** Lista de precios que cambiaron respecto al vigente. */
export function detectarCambiosPrecios(productos, precios) {
  const cambios = []

  productos.forEach((p) => {
    const fila = precios[p.id] ?? {}

    ;['retail', 'wholesale'].forEach((campo) => {
      const texto = fila[campo]
      if (texto == null || texto === '') return

      const nuevo = parsePrecioCOP(texto)
      if (nuevo == null || nuevo < 0) return

      const anterior = p[campo]?.value != null ? Number(p[campo].value) : null
      const cambioReal =
        anterior == null ? nuevo > 0 : Math.abs(nuevo - anterior) > 0.001

      if (cambioReal) {
        cambios.push({
          productId: p.id,
          nombre: p.name,
          campo,
          tipoLabel: labelTipoPrecio(campo),
          anterior,
          nuevo,
          sospechoso: esCambioSospechoso(anterior, nuevo),
        })
      }
    })
  })

  return cambios
}

/** Variación >3× o <⅓ del precio anterior (ej. un cero de más). */
export function esCambioSospechoso(anterior, nuevo) {
  if (anterior == null || anterior <= 0 || nuevo == null || nuevo <= 0) return false
  const ratio = nuevo / anterior
  return ratio >= 3 || ratio <= 1 / 3
}

export function validarPreciosEntrada(productos, precios) {
  for (const p of productos) {
    const fila = precios[p.id] ?? {}
    for (const campo of ['retail', 'wholesale']) {
      const texto = fila[campo]
      if (texto == null || texto === '') continue
      const n = parsePrecioCOP(texto)
      if (n == null || n < 0) {
        return `Precio inválido en ${p.name} (${labelTipoPrecio(campo)}).`
      }
    }
  }
  return null
}
