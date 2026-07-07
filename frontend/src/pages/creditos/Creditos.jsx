import { useEffect, useState } from 'react'
import { getCreditos, registrarAbono } from '../../api/creditos'
import Modal from '../../components/ui/Modal'
import InputPrecioCOP from '../../components/ui/InputPrecioCOP'
import { parsePrecioCOP } from '../../lib/precios'

const hoy = () => new Date().toISOString().split('T')[0]

const formatCOP = (v) =>
  Number(v).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function Creditos() {
  const [clientes, setClientes] = useState([])
  const [meta, setMeta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [abonoCliente, setAbonoCliente] = useState(null)
  const [formAbono, setFormAbono] = useState({ date: hoy(), amount: '', sale_id: '', notes: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const cargar = () => {
    setCargando(true)
    getCreditos()
      .then(({ data }) => {
        setClientes(data.data ?? [])
        setMeta(data.meta ?? null)
      })
      .catch(() => setError('No se pudieron cargar los créditos.'))
      .finally(() => setCargando(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrirAbono = (cliente) => {
    setAbonoCliente(cliente)
    setFormAbono({ date: hoy(), amount: '', sale_id: '', notes: '' })
    setError(null)
  }

  const handleAbono = async () => {
    const monto = parsePrecioCOP(formAbono.amount)
    if (!monto || monto <= 0) {
      setError('Ingresa un monto válido.')
      return
    }
    setGuardando(true)
    try {
      await registrarAbono({
        customer_id: abonoCliente.id,
        sale_id: formAbono.sale_id || undefined,
        date: formAbono.date,
        amount: monto,
        notes: formAbono.notes || undefined,
      })
      setAbonoCliente(null)
      cargar()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Error al registrar el abono.')
    } finally {
      setGuardando(false)
    }
  }

  const conDeuda = clientes.filter((c) => Number(c.balance) > 0)

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6">
      <h2 className="text-xl font-bold text-[#1a365d] mb-1">Créditos / Fiado</h2>
      <p className="text-sm text-gray-500 mb-4">Clientes con saldo pendiente y abonos.</p>

      {meta && (
        <div className="bg-white rounded-xl border border-amber-100 shadow-sm p-4 mb-4 text-center">
          <p className="text-xs text-gray-400">Total por cobrar</p>
          <p className="text-2xl font-bold text-amber-600">{formatCOP(meta.total_balance)}</p>
        </div>
      )}

      {cargando ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : conDeuda.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          No hay créditos pendientes.
        </div>
      ) : (
        <div className="space-y-3">
          {conDeuda.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {[c.id_number, c.phone, c.address].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-amber-600">{formatCOP(c.balance)}</p>
                  <button
                    type="button"
                    onClick={() => abrirAbono(c)}
                    className="text-xs text-[#f56523] font-medium hover:underline mt-1"
                  >
                    Registrar abono
                  </button>
                </div>
              </div>
              {c.open_sales?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-50 space-y-1">
                  {c.open_sales.map((s) => (
                    <div key={s.id} className="flex justify-between text-xs text-gray-600">
                      <span>{s.date} · {s.product?.name ?? '—'}</span>
                      <span className="font-medium text-amber-700">{formatCOP(s.balance)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {abonoCliente && (
        <Modal titulo={`Abono — ${abonoCliente.name}`} onClose={() => setAbonoCliente(null)}>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Saldo pendiente: <span className="font-semibold text-amber-600">{formatCOP(abonoCliente.balance)}</span>
            </p>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Monto *</label>
              <InputPrecioCOP
                value={formAbono.amount}
                onChange={(v) => setFormAbono((f) => ({ ...f, amount: v }))}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Fecha</label>
              <input
                type="date"
                value={formAbono.date}
                onChange={(e) => setFormAbono((f) => ({ ...f, date: e.target.value }))}
                className={inputClass}
              />
            </div>
            {abonoCliente.open_sales?.length > 0 && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Aplicar a venta (opcional)</label>
                <select
                  value={formAbono.sale_id}
                  onChange={(e) => setFormAbono((f) => ({ ...f, sale_id: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Distribuir automáticamente</option>
                  {abonoCliente.open_sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.date} — {s.product?.name} ({formatCOP(s.balance)})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notas</label>
              <input
                type="text"
                value={formAbono.notes}
                onChange={(e) => setFormAbono((f) => ({ ...f, notes: e.target.value }))}
                className={inputClass}
                placeholder="Opcional"
              />
            </div>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="button"
              onClick={handleAbono}
              disabled={guardando}
              className="w-full bg-[#1a365d] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Registrar abono'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

const inputClass =
  'w-full border border-gray-300 bg-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f56523]'
