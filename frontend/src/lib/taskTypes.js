/** Tipos canónicos de labor en la finca (fuente única para formulario e íconos). */
export const TIPOS_LABOR = [
  'Siembra',
  'Cosecha',
  'Fumigación',
  'Fertilización',
  'Poda',
  'Riego',
  'Limpieza',
  'Control de plagas',
  'Otro',
]

export const TIPO_ICONO = {
  Siembra: '🌱',
  Cosecha: '🧺',
  Fumigación: '💨',
  Fertilización: '🪣',
  Poda: '✂️',
  Riego: '💧',
  Limpieza: '🧹',
  'Control de plagas': '🐛',
  Otro: '🔧',
}

const TIPOS_ORDENADOS = Object.keys(TIPO_ICONO)
  .filter((t) => t !== 'Otro')
  .sort((a, b) => b.length - a.length)

/** Tipo canónico por coincidencia exacta o prefijo ("Cosecha de guayaba" → "Cosecha"). */
export function findCanonicalType(taskType) {
  if (!taskType?.trim()) return null
  const t = taskType.trim().toLowerCase()
  for (const tipo of TIPOS_ORDENADOS) {
    const canon = tipo.toLowerCase()
    if (t === canon || t.startsWith(canon)) {
      return tipo
    }
  }
  return null
}

export function iconoLabor(taskType) {
  const canon = findCanonicalType(taskType)
  if (canon) return TIPO_ICONO[canon]
  return TIPO_ICONO.Otro
}

/**
 * Prepara task_type para el formulario al editar registros viejos o con texto libre.
 * @returns {{ task_type: string, otroTexto: string, cropExtra: string|null }}
 */
export function parseTaskTypeForForm(taskType, crop = '') {
  if (!taskType?.trim()) {
    return { task_type: '', otroTexto: '', cropExtra: null }
  }

  if (TIPOS_LABOR.includes(taskType)) {
    return { task_type: taskType, otroTexto: '', cropExtra: null }
  }

  const canon = findCanonicalType(taskType)
  if (canon) {
    const suffix = taskType
      .slice(canon.length)
      .trim()
      .replace(/^[-–:]\s*/, '')
    return {
      task_type: canon,
      otroTexto: '',
      cropExtra: suffix && !crop?.trim() ? suffix : null,
    }
  }

  return { task_type: 'Otro', otroTexto: taskType, cropExtra: null }
}

/** Valor final a guardar según selección del formulario. */
export function buildTaskTypeValue(selected, otroTexto) {
  if (selected === 'Otro') {
    return otroTexto.trim()
  }
  return selected
}

export function esLaborCosecha(taskType) {
  return findCanonicalType(taskType) === 'Cosecha'
}

export function calcularPagoColaborador({ payment_mode, quantity_kg, rate }) {
  const r = Number(rate) || 0
  if (payment_mode === 'per_kg') {
    return Math.round((Number(quantity_kg) || 0) * r)
  }
  return Math.round(r)
}
