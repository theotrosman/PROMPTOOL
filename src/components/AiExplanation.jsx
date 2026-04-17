const AiExplanation = ({ explanation }) => (
  <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-100">
        <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-slate-900">Análisis Detallado de la IA</h3>
        <p className="mt-1 text-xs text-slate-500">
          Evaluación completa de tu prompt comparado con el original
        </p>
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="text-base leading-relaxed text-slate-800">
            {explanation}
          </p>
        </div>
      </div>
    </div>
  </div>
)

export default AiExplanation
