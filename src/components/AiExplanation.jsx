const AiExplanation = ({ promptOriginal, explanation }) => (
  <div className="space-y-4">
    <div className="space-y-2 border-b border-slate-200/60 pb-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Explicación de la IA</p>
      <p className="text-base leading-7 text-slate-700">
        {explanation}
      </p>
    </div>

    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Prompt enviado</p>
      <p className="text-base leading-7 text-slate-900">
        {promptOriginal}
      </p>
    </div>
  </div>
)

export default AiExplanation
