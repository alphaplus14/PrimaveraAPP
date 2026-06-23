import { ICONO_OJO } from '../../lib/dashboard'

export default function BotonOjo({ onClick, label = 'Ver detalle' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-[#F3F0FF] hover:bg-indigo-100 hover:border-indigo-200 active:bg-indigo-100 transition-colors"
    >
      <img src={ICONO_OJO} alt="" className="w-3.5 h-3.5 object-contain opacity-80" />
    </button>
  )
}
