import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getResumenHoy, getVentasUltimasSemanas } from '../../api/reportes'
import GraficoVentasSemanal from '../../components/dashboard/GraficoVentasSemanal'
import PanelWidget from '../../components/dashboard/PanelWidget'
import BotonOjo from '../../components/dashboard/BotonOjo'
import ModalPaginado from '../../components/dashboard/ModalPaginado'
import Modal from '../../components/ui/Modal'
import { CATEGORY_LABEL, SALE_TYPE_LABEL } from '../../constants/enums'
import {
  agruparVentasPorSemana,
  filtrarStockBajo,
  formatCOP,
  formatKg,
  formatStock,
  tiempoRelativo,
} from '../../lib/dashboard'

const PREVIEW_ITEMS = 8

const ACCIONES_RAPIDAS = [
  { to: '/transformaciones', label: 'Transformaciones', icon: '/assets/icons/transformaciones%20icon.png', accent: 'purple' },
  { to: '/labores', label: 'Labores', icon: '/assets/icons/labores%20icono.png', accent: 'cyan' },
  { to: '/compras', label: 'Compras', icon: '/assets/icons/compras%20icon.png', accent: 'indigo' },
  { to: '/inventario', label: 'Inventario', icon: '/assets/icons/inventario%20icon.png', accent: 'warning' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [datos, setDatos] = useState(null)
  const [ventasSemanal, setVentasSemanal] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoGrafico, setCargandoGrafico] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)
  const [modalStock, setModalStock] = useState(false)
  const [detalleStock, setDetalleStock] = useState(null)
  const [detalleVenta, setDetalleVenta] = useState(null)

  useEffect(() => {
    getResumenHoy()
      .then(([ventasRes, comprasRes, invRes, prodRes]) => {
        const ventas = ventasRes.data?.data ?? []
        const compras = comprasRes.data?.data ?? []
        const inventario = invRes.data?.data ?? []
        const productos = prodRes.data?.data ?? []
        const stockBajo = filtrarStockBajo(inventario)

        setDatos({
          ventasHoy: ventas.reduce((s, v) => s + Number(v.total), 0),
          ventasKgHoy: ventas.reduce((s, v) => s + Number(v.quantity_kg), 0),
          comprasHoy: compras.reduce((s, c) => s + Number(c.total), 0),
          comprasKgHoy: compras.reduce((s, c) => s + Number(c.quantity_kg), 0),
          productosActivos: productos.filter((p) => p.active).length,
          stockBajo,
          ventasHoyLista: [...ventas].sort((a, b) => b.id - a.id),
        })
        setErrorCarga(null)
      })
      .catch(() => {
        setDatos(null)
        setErrorCarga('No se pudo conectar con el servidor. Verifica tu conexión e intenta de nuevo.')
      })
      .finally(() => setCargando(false))

    getVentasUltimasSemanas(8)
      .then((res) => {
        const ventas = res.data?.data?.ventas ?? res.data?.ventas ?? []
        setVentasSemanal(agruparVentasPorSemana(ventas, 8))
      })
      .catch(() => setVentasSemanal(agruparVentasPorSemana([], 8)))
      .finally(() => setCargandoGrafico(false))
  }, [])

  const hoy = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col h-full min-h-0 overflow-y-auto md:overflow-hidden p-4 md:p-6 pb-24 md:pb-6 bg-[#F8F9FA]">
      <div className="shrink-0 mb-4 md:mb-5 sticky top-0 z-10 bg-[#F8F9FA]/95 backdrop-blur-sm py-1 md:static md:backdrop-blur-none md:py-0">
        <h2 className="text-xl font-bold text-slate-800">Hola, {user?.name} </h2>
        <p className="text-slate-400 text-sm capitalize">{hoy}</p>
      </div>

      {cargando ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : errorCarga || !datos ? (
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 text-center">
          <p className="text-sm text-slate-600 mb-2">{errorCarga ?? 'No hay datos disponibles.'}</p>
          <p className="text-xs text-slate-400">
            Si el problema continúa, contacta al administrador del sistema.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 md:mb-5 shrink-0">
            <TarjetaStat
              label="Ventas hoy"
              valor={formatCOP(datos.ventasHoy)}
              sub={`${formatKg(datos.ventasKgHoy)} vendidos`}
              accent="purple"
            />
            <TarjetaStat
              label="Compras hoy"
              valor={formatCOP(datos.comprasHoy)}
              sub={`${formatKg(datos.comprasKgHoy)} comprados`}
              accent="cyan"
            />
            <TarjetaStat
              label="Productos"
              valor={datos.productosActivos}
              sub="activos en catálogo"
              accent="indigo"
            />
            <TarjetaStat
              label="Stock bajo"
              valor={datos.stockBajo.length}
              sub="muy bajos o por acabarse"
              accent="warning"
            />
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 md:overflow-hidden">
            <div className="lg:col-span-2 flex flex-col gap-4 md:gap-5 min-h-0 md:overflow-y-auto">
              <GraficoVentasSemanal datos={ventasSemanal} cargando={cargandoGrafico} />

              <div className="shrink-0">
                <h3 className="font-semibold text-slate-800 text-sm mb-3">Accesos rápidos</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ACCIONES_RAPIDAS.map((accion) => (
                    <BotonAccionRapida
                      key={accion.to}
                      {...accion}
                      onClick={() => navigate(accion.to)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 md:gap-5 min-h-0 lg:overflow-hidden">
              <PanelWidget
                titulo="Productos en bajo stock"
                subtitulo="Menos de 5 kg o paquetes"
                onVerTodo={() => setModalStock(true)}
                className="flex-1 min-h-[200px] lg:min-h-0"
              >
                {datos.stockBajo.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8 px-4">
                    Todo el inventario está en buen nivel.
                  </p>
                ) : (
                  datos.stockBajo.slice(0, PREVIEW_ITEMS).map((item) => (
                    <FilaStockBajo
                      key={item.id}
                      item={item}
                      onVer={() => setDetalleStock(item)}
                    />
                  ))
                )}
              </PanelWidget>

              <PanelWidget
                titulo="Ventas del día"
                subtitulo="Últimas registradas hoy"
                onVerTodo={() => navigate('/ventas')}
                className="flex-1 min-h-[200px] lg:min-h-0"
              >
                {datos.ventasHoyLista.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <p className="text-sm text-gray-400 mb-2">No hay ventas hoy.</p>
                    <button
                      type="button"
                      onClick={() => navigate('/ventas')}
                      className="text-xs text-[#5C27FE] font-medium hover:underline"
                    >
                      Registrar venta →
                    </button>
                  </div>
                ) : (
                  datos.ventasHoyLista.slice(0, 10).map((venta) => (
                    <FilaVentaDia key={venta.id} venta={venta} onVer={() => setDetalleVenta(venta)} />
                  ))
                )}
              </PanelWidget>
            </div>
          </div>
        </>
      )}

      {modalStock && datos && (
        <ModalPaginado
          titulo="Productos en bajo stock"
          items={datos.stockBajo}
          onClose={() => setModalStock(false)}
          vacio="No hay productos con stock bajo."
          renderItem={(item) => (
            <FilaStockBajo
              key={item.id}
              item={item}
              onVer={() => {
                setModalStock(false)
                setDetalleStock(item)
              }}
              enModal
            />
          )}
        />
      )}

      {detalleStock && (
        <Modal titulo="Detalle de inventario" onClose={() => setDetalleStock(null)}>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Producto</p>
              <p className="font-semibold text-gray-900">{detalleStock.product?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Categoría</p>
                <p className="font-medium text-gray-700">
                  {CATEGORY_LABEL[detalleStock.product?.category] ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Stock actual</p>
                <p
                  className={`font-bold ${
                    Number(detalleStock.quantity_kg) < 5 ? 'text-[#F59E0B]' : 'text-slate-900'
                  }`}
                >
                  {formatStock(detalleStock.product, detalleStock.quantity_kg)}
                </p>
              </div>
            </div>
            {detalleStock.stock_updated_at && (
              <div>
                <p className="text-xs text-gray-400">Última actualización</p>
                <p className="text-gray-600">
                  {new Date(detalleStock.stock_updated_at).toLocaleString('es-CO')}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                setDetalleStock(null)
                navigate('/inventario')
              }}
              className="w-full mt-2 bg-[#6366F1] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#5C27FE] transition-colors"
            >
              Ir a inventario
            </button>
          </div>
        </Modal>
      )}

      {detalleVenta && (
        <Modal titulo="Detalle de venta" onClose={() => setDetalleVenta(null)}>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Producto</p>
              <p className="font-semibold text-gray-900">{detalleVenta.product?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400">Cliente</p>
                <p className="font-medium text-gray-700">{detalleVenta.customer?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Fecha</p>
                <p className="font-medium text-gray-700">{detalleVenta.date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cantidad</p>
                <p className="font-medium text-gray-700">{formatKg(detalleVenta.quantity_kg)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Tipo</p>
                <p className="font-medium text-gray-700">
                  {SALE_TYPE_LABEL[detalleVenta.sale_type] ?? detalleVenta.sale_type}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Precio / kg</p>
                <p className="font-medium text-gray-700">{formatCOP(detalleVenta.unit_price)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="font-bold text-[#10B981]">{formatCOP(detalleVenta.total)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setDetalleVenta(null)
                navigate('/ventas')
              }}
              className="w-full mt-2 bg-[#6366F1] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#5C27FE] transition-colors"
            >
              Ver todas las ventas
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function FilaStockBajo({ item, onVer, enModal = false }) {
  const qty = Number(item.quantity_kg)
  const critico = qty <= 0

  const contenido = (
    <>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{item.product?.name}</p>
        <p className="text-xs text-slate-400">
          <span className={critico ? 'text-rose-500 font-medium' : 'text-[#F59E0B] font-medium'}>
            {formatStock(item.product, item.quantity_kg)}
          </span>
          {' · '}
          {CATEGORY_LABEL[item.product?.category] ?? item.product?.category}
        </p>
      </div>
      <BotonOjo onClick={onVer} label={`Ver ${item.product?.name}`} />
    </>
  )

  if (enModal) {
    return (
      <div className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[#F3F0FF]/60">{contenido}</div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-[#F3F0FF]/40 transition-colors">
      {contenido}
    </div>
  )
}

function FilaVentaDia({ venta, onVer }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-[#F3F0FF]/40 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{venta.product?.name}</p>
        <p className="text-xs text-slate-400 truncate">
          {venta.customer?.name} · {formatKg(venta.quantity_kg)}
        </p>
      </div>
      <div className="text-right shrink-0 mr-1 hidden sm:block">
        <p className="text-xs font-semibold text-[#10B981]">{formatCOP(venta.total)}</p>
        <p className="text-[10px] text-slate-400">{tiempoRelativo(venta.date)}</p>
      </div>
      <BotonOjo onClick={onVer} label={`Ver venta de ${venta.product?.name}`} />
    </div>
  )
}

function BotonAccionRapida({ label, icon, accent, onClick }) {
  const acentos = {
    purple: 'border-indigo-100 hover:bg-[#F3F0FF] hover:border-indigo-200',
    cyan: 'border-cyan-100 hover:bg-cyan-50 hover:border-cyan-200',
    indigo: 'border-violet-100 hover:bg-violet-50 hover:border-violet-200',
    warning: 'border-amber-100 hover:bg-amber-50 hover:border-amber-200',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border bg-white shadow-sm transition-colors ${
        acentos[accent] ?? acentos.purple
      }`}
    >
      <img src={icon} alt="" className="w-8 h-8 object-contain opacity-75" />
      <span className="text-xs font-medium text-slate-700 text-center leading-tight">{label}</span>
    </button>
  )
}

function TarjetaStat({ label, valor, sub, accent }) {
  const acentos = {
    purple: { border: 'border-indigo-100', valor: 'text-[#5C27FE]', sub: 'text-indigo-400' },
    cyan: { border: 'border-cyan-100', valor: 'text-[#06B6D4]', sub: 'text-cyan-500' },
    indigo: { border: 'border-violet-100', valor: 'text-[#6366F1]', sub: 'text-violet-400' },
    warning: { border: 'border-amber-100', valor: 'text-[#F59E0B]', sub: 'text-amber-500' },
  }
  const a = acentos[accent] ?? acentos.purple

  return (
    <div className={`rounded-2xl p-4 border bg-white shadow-sm ${a.border}`}>
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <p className={`text-xl font-bold leading-tight mt-1 ${a.valor}`}>{valor}</p>
      <p className={`text-xs mt-1 ${a.sub}`}>{sub}</p>
    </div>
  )
}
