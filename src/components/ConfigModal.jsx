const ConfigModal = ({
  open,
  mode,
  difficulty,
  tema,
  onClose,
  onSave,
  onModeChange,
  onDifficultyChange,
  onTemaChange,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Configuración</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Ajusta el modo, dificultad y temática</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="space-y-3 rounded-[1.75rem] border border-slate-200/70 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Modo</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="config-mode"
                  value="random"
                  checked={mode === 'random'}
                  onChange={(event) => onModeChange(event.target.value)}
                  className="h-4 w-4 text-slate-900"
                />
                Random
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="config-mode"
                  value="daily"
                  checked={mode === 'daily'}
                  onChange={(event) => onModeChange(event.target.value)}
                  className="h-4 w-4 text-slate-900"
                />
                Diario
              </label>
            </div>
          </div>

          <div className="space-y-3 rounded-[1.75rem] border border-slate-200/70 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Dificultad</p>
            <select
              value={difficulty}
              onChange={(event) => onDifficultyChange(event.target.value)}
              className="w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value="Fácil">Fácil</option>
              <option value="Media">Media</option>
              <option value="Difícil">Difícil</option>
            </select>
          </div>

          <div className="space-y-3 rounded-[1.75rem] border border-slate-200/70 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Temática</p>
            <select
              value={tema}
              onChange={(event) => onTemaChange(event.target.value)}
              className="w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              <option value="Ciencia ficción">Ciencia ficción</option>
              <option value="Fantasía">Fantasía</option>
              <option value="Realista">Realista</option>
              <option value="Horror">Horror</option>
              <option value="Minimalista">Minimalista</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[1.25rem] border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-[1.25rem] bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfigModal
