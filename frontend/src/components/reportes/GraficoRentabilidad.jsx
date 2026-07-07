import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCOP } from '../../lib/dashboard'

const COLORES = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F56523', '#8B5CF6', '#EC4899', '#14B8A6']

export default function GraficoRentabilidad({ rows = [], meta }) {
  const conMargen = rows.filter((r) => Number(r.margin) !== 0 || Number(r.sales_total) > 0)
  if (conMargen.length === 0) return null

  const topMargen = [...conMargen]
    .sort((a, b) => Number(b.margin) - Number(a.margin))
    .slice(0, 8)
    .map((r) => ({
      nombre: r.product?.name ?? '—',
      margen: Number(r.margin),
      ventas: Number(r.sales_total),
    }))

  const topVentas = [...conMargen]
    .filter((r) => Number(r.sales_total) > 0)
    .sort((a, b) => Number(b.sales_total) - Number(a.sales_total))
    .slice(0, 6)
    .map((r) => ({
      nombre: r.product?.name ?? '—',
      valor: Number(r.sales_total),
    }))

  const masRentables = [...conMargen].sort((a, b) => Number(b.margin) - Number(a.margin)).slice(0, 3)
  const menosRentables = [...conMargen]
    .filter((r) => Number(r.sales_total) > 0)
    .sort((a, b) => Number(a.margin) - Number(b.margin))
    .slice(0, 3)

  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="bg-white rounded-lg shadow-sm p-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Margen por producto (top 8)
          </p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMargen} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <YAxis type="category" dataKey="nombre" width={72} tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [formatCOP(v), 'Margen']}
                  contentStyle={{ borderRadius: 8, fontSize: 11, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="margen" radius={[0, 4, 4, 0]}>
                  {topMargen.map((entry, i) => (
                    <Cell key={entry.nombre} fill={entry.margen >= 0 ? COLORES[i % COLORES.length] : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Ventas por producto
          </p>
          <div className="h-44 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topVentas}
                  dataKey="valor"
                  nameKey="nombre"
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={64}
                  paddingAngle={2}
                >
                  {topVentas.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, _n, p) => [formatCOP(v), p.payload.nombre]}
                  contentStyle={{ borderRadius: 8, fontSize: 11, border: '1px solid #e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <RankingRentabilidad titulo="Más rentables" items={masRentables} positivo />
        <RankingRentabilidad titulo="Menos rentables" items={menosRentables} positivo={false} />
      </div>

      {meta && (
        <p className="text-[10px] text-gray-400 text-center">
          Margen total del período: {formatCOP(meta.margin)}
        </p>
      )}
    </div>
  )
}

function RankingRentabilidad({ titulo, items, positivo }) {
  if (items.length === 0) return null
  return (
    <div className="bg-white rounded-lg shadow-sm p-2.5">
      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{titulo}</p>
      <div className="space-y-1">
        {items.map((r, i) => (
          <div key={r.product_id} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-gray-700 truncate">
              <span className="text-gray-400 mr-1">{i + 1}.</span>
              {r.product?.name ?? '—'}
            </span>
            <span className={`font-semibold shrink-0 tabular-nums ${positivo ? 'text-green-700' : 'text-red-600'}`}>
              {formatCOP(r.margin)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
