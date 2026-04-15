const ResultPanel = ({ promptOriginal, score }) => (
  <div className="space-y-4 border-t border-slate-200/60 pt-6">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Resultados</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          El prompt original y el resultado se muestran cuando el envío se completa.
        </p>
      </div>
      <div className="inline-flex rounded-full border border-slate-200/60 px-4 py-2 text-sm font-medium text-slate-600">
        Score
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-[1.75rem] border border-slate-200/60 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Prompt original</p>
        <p className="mt-3 min-h-[4rem] text-base leading-7 text-slate-800">
          {promptOriginal}
        </p>
      </div>
      <div className="rounded-[1.75rem] border border-slate-200/60 p-6">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Estimación</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">{score}</p>
      </div>
    </div>
  </div>
)

export default ResultPanel
