import { useEffect, useState } from 'react'
import GUIDE_LIBRARY from '../data/guides'

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

// Lógica de normalización de dificultad para matchear con Supabase
const getDifficultyConfig = (difficulty = 'Media') => {
  const normalized = difficulty.toString().toLowerCase()
  if (normalized.includes('dificil')) return { minPassScore: 82, label: 'Nivel difícil' }
  if (normalized.includes('facil')) return { minPassScore: 55, label: 'Nivel fácil' }
  return { minPassScore: 70, label: 'Nivel medio' }
}

const ResultPanel = ({
  scorePercent,
  explanation,
  suggestions,
  difficulty,
  strengths = [],
  improvements = [],
  recommendedGuideIds = [],
}) => {
  const safeScore = Math.max(0, Math.min(100, Number(scorePercent) || 0))
  const difficultyConfig = getDifficultyConfig(difficulty)
  const isPass = safeScore >= difficultyConfig.minPassScore
  
  // Filtrar guías recomendadas de tu librería local
  const recommendedGuides = GUIDE_LIBRARY.filter((guide) => 
    recommendedGuideIds?.includes(guide.id)
  )

  return (
    <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6 animate-in fade-in zoom-in duration-500">
      <div className="grid gap-3">
        <div className="grid gap-3 md:grid-cols-[120px_1fr]">
          <div className="flex items-center justify-center rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
            <ScoreCircle value={safeScore} />
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                {difficultyConfig.label}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isPass ? 'Nivel Superado' : 'Sigue intentando'}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Análisis de la IA</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">
              {explanation || "Análisis no disponible en este momento."}
            </p>
          </div>
        </div>

        {/* Puntos Fuertes */}
        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Fortalezas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {strengths.length > 0 ? strengths.map((s, i) => (
              <span key={i} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                {s}
              </span>
            )) : <span className="text-xs text-emerald-600 italic">Analizando...</span>}
          </div>
        </div>

        {/* Puntos a mejorar */}
        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Oportunidades de mejora</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {improvements.length > 0 ? improvements.map((m, i) => (
              <span key={i} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
                {m}
              </span>
            )) : <span className="text-xs text-rose-600 italic">¡Excelente trabajo!</span>}
          </div>
        </div>

        {/* Guías Dinámicas */}
        {recommendedGuides.length > 0 && (
          <div className="rounded-[1.25rem] border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Aprende más</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {recommendedGuides.map((guide) => (
                <a
                  key={guide.id}
                  href={`/guides.html#guia-${guide.id}`}
                  className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-800 ring-1 ring-indigo-200 transition hover:bg-indigo-100"
                >
                  {guide.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResultPanel