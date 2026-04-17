import { useEffect, useState } from 'react'

const ScoreCircle = ({ value }) => {
  const [animatedValue, setAnimatedValue] = useState(0)
  const normalizedValue = Math.min(100, Math.max(0, animatedValue ?? 0))
  const circumference = 2 * Math.PI * 44
  const dashOffset = circumference * (1 - normalizedValue / 100)
  const strokeColor = normalizedValue >= 60 ? '#16a34a' : '#ef4444'

  useEffect(() => {
    setAnimatedValue(0)
    const id = window.requestAnimationFrame(() => {
      setAnimatedValue(value ?? 0)
    })
    return () => window.cancelAnimationFrame(id)
  }, [value])

  return (
    <div className="relative inline-flex h-[120px] w-[120px] items-center justify-center">
      <svg className="h-full w-full" viewBox="0 0 120 120" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r="44"
          className="fill-transparent stroke-slate-200"
          strokeWidth="12"
        />
        <circle
          cx="60"
          cy="60"
          r="44"
          className="fill-transparent"
          strokeWidth="12"
          strokeLinecap="round"
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1.1s ease-out, stroke 0.3s ease' }}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-semibold text-slate-900">{normalizedValue}%</span>
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">Score</span>
      </div>
    </div>
  )
}

const ResultPanel = ({ scorePercent, suggestions }) => {
  const label = scorePercent >= 60 ? 'Bueno' : 'Débil'

  return (
    <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Resultados</h3>
          <p className="mt-1 text-xs text-slate-500">
            Aquí se muestra el score y el estado de tu prompt.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${scorePercent >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {label}
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]">
        <div className="flex items-center justify-center rounded-[1.75rem] bg-slate-50 p-6">
          <ScoreCircle value={scorePercent} />
        </div>

        <div className="flex flex-col justify-between rounded-[1.75rem] bg-slate-50 p-6">
          {suggestions && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-2">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-700">Sugerencias para mejorar</p>
                  <p className="mt-2 text-sm leading-relaxed text-blue-900">{suggestions}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResultPanel
