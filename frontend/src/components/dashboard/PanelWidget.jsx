export default function PanelWidget({ titulo, subtitulo, verTodoLabel = 'Ver todo', onVerTodo, children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-0 ${className}`}>
      <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-slate-100 shrink-0">
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 text-sm">{titulo}</h3>
          {subtitulo && <p className="text-xs text-slate-400 mt-0.5">{subtitulo}</p>}
        </div>
        {onVerTodo && (
          <button
            type="button"
            onClick={onVerTodo}
            className="text-xs font-medium text-[#5C27FE] hover:text-[#6366F1] hover:underline shrink-0"
          >
            {verTodoLabel} →
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">{children}</div>
    </div>
  )
}
