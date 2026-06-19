import { useState, useEffect, useCallback } from 'react'

// Hook genérico para cargar datos de la API
// Uso: const { data, cargando, error, recargar } = useApi(fn, [deps])
export function useApi(fn, deps = []) {
  const [data, setData] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const ejecutar = useCallback(() => {
    setCargando(true)
    setError(null)
    fn()
      .then((res) => setData(res.data?.data ?? res.data))
      .catch((err) => setError(err.response?.data?.message ?? 'Error al cargar datos.'))
      .finally(() => setCargando(false))
  }, deps)

  useEffect(() => {
    ejecutar()
  }, [ejecutar])

  return { data, cargando, error, recargar: ejecutar }
}
