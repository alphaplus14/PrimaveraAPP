import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { FLUX, formatCOP } from '../../lib/dashboard'

export default function GraficoVentasSemanal({ datos = [], cargando }) {
  if (cargando) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-[320px]">
        <div className="h-5 w-40 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-3 w-56 bg-gray-100 rounded animate-pulse mb-6" />
        <div className="h-52 bg-[#F8F9FA] rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 min-h-[320px] flex flex-col">
      <div className="mb-4 shrink-0">
        <h3 className="font-semibold text-slate-800 text-sm md:text-base">Ventas por semana</h3>
        <p className="text-xs text-slate-400 mt-0.5">Total en pesos — últimas 8 semanas</p>
      </div>

      {datos.every((d) => d.total === 0) ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center px-4">
          Aún no hay ventas en las últimas semanas.
        </div>
      ) : (
        <div className="flex-1 min-h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={240}>
            <AreaChart data={datos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="ventasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={FLUX.purple} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={FLUX.purple} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={48}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
                }}
                formatter={(value) => [formatCOP(value), 'Ventas']}
                labelStyle={{ color: '#64748b', marginBottom: 4 }}
                itemStyle={{ color: FLUX.purpleDark }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke={FLUX.purple}
                strokeWidth={2.5}
                fill="url(#ventasGradient)"
                dot={{ r: 3, fill: FLUX.purple, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: FLUX.purpleDark, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
