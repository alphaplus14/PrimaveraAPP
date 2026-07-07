import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatKg } from '../../lib/dashboard'

export default function GraficoOrigen({ rows = [] }) {
  const activos = rows
    .filter((r) => Number(r.harvest_kg) > 0 || Number(r.purchase_kg) > 0)
    .slice(0, 10)
    .map((r) => ({
      nombre: (r.product?.name ?? '—').length > 12
        ? `${(r.product?.name ?? '—').slice(0, 10)}…`
        : (r.product?.name ?? '—'),
      nombreCompleto: r.product?.name ?? '—',
      producido: Number(r.harvest_kg),
      comprado: Number(r.purchase_kg),
    }))

  if (activos.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow-sm p-3">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Kg cosechados vs comprados
      </p>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activos} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              formatter={(v, name) => [formatKg(v), name === 'producido' ? 'Cosechado' : 'Comprado']}
              labelFormatter={(_l, p) => p[0]?.payload?.nombreCompleto}
              contentStyle={{ borderRadius: 8, fontSize: 11, border: '1px solid #e2e8f0' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(v) => (v === 'producido' ? 'Cosechado' : 'Comprado')}
            />
            <Bar dataKey="producido" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="comprado" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
