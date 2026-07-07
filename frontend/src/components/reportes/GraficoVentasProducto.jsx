import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FLUX, formatCOP } from '../../lib/dashboard'

export default function GraficoVentasProducto({ datos = [] }) {
  const top = [...datos]
    .sort((a, b) => b.total_pesos - a.total_pesos)
    .slice(0, 8)
    .map((d) => ({
      nombre: d.nombre.length > 14 ? `${d.nombre.slice(0, 12)}…` : d.nombre,
      nombreCompleto: d.nombre,
      total: d.total_pesos,
      kg: d.quantity_kg,
    }))

  if (top.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 mb-2">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Ventas por producto (gráfico)
      </p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
            />
            <Tooltip
              formatter={(v, _n, p) => [formatCOP(v), p.payload.nombreCompleto]}
              labelFormatter={(_l, p) => `${Number(p[0]?.payload?.kg).toFixed(1)} kg`}
              contentStyle={{ borderRadius: 8, fontSize: 11, border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="total" fill={FLUX.purple} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
