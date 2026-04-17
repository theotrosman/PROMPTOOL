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

const normalizeDifficulty = (difficulty = 'Media') =>
  difficulty
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const getDifficultyConfig = (difficulty = 'Media') => {
  const normalized = normalizeDifficulty(difficulty)
  if (normalized.includes('dificil')) {
    return { minPassScore: 82, label: 'Nivel dificil' }
  }
  if (normalized.includes('facil')) {
    return { minPassScore: 55, label: 'Nivel facil' }
  }
  return { minPassScore: 70, label: 'Nivel medio' }
}

const sanitizeAiText = (text = '') =>
  text
    .replace(/el prompt del usuario/gi, 'su prompt')
    .replace(/tu prompt/gi, 'su prompt')
    .replace(/prompt del usuario/gi, 'su prompt')
    .trim()

const compactSummary = (text = '') => {
  const safeText = sanitizeAiText(text) || 'No hay analisis disponible.'
  const sentences = safeText.split(/(?<=[.!?])\s+/).filter(Boolean)
  if (sentences.length <= 3) return safeText
  return sentences.slice(0, 3).join(' ')
}

const buildFallbackPoints = (score = 0, suggestions = '', minPassScore = 70) => {
  const normalizedSuggestions = sanitizeAiText(suggestions).toLowerCase()
  const chunks = sanitizeAiText(suggestions)
    .split(/(?<=[.!?])\s+|\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const strengths = []
  const improvements = []

  if (score >= minPassScore + 12) strengths.push('Direccion visual clara')
  if (score >= minPassScore) strengths.push('Base de prompt solida')
  if (score >= 55) strengths.push('Intencion reconocible')
  if (chunks[0]) strengths.push(chunks[0].slice(0, 110))

  if (normalizedSuggestions.includes('detalle')) improvements.push('Mas micro-detalles')
  if (normalizedSuggestions.includes('luz') || normalizedSuggestions.includes('ilumin')) improvements.push('Mejorar iluminacion')
  if (normalizedSuggestions.includes('estilo')) improvements.push('Definir estilo artistico')
  if (normalizedSuggestions.includes('compos') || normalizedSuggestions.includes('encuadre')) improvements.push('Ajustar composicion')
  if (normalizedSuggestions.includes('atm') || normalizedSuggestions.includes('ambiente')) improvements.push('Reforzar atmosfera')
  if (chunks[1]) improvements.push(chunks[1].slice(0, 110))

  if (strengths.length === 0) strengths.push('Buen punto de partida')
  if (improvements.length === 0) {
    improvements.push('Mas precision semantica', 'Especificar sujeto, estilo y contexto')
  }

  return {
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
  }
}

const ResultPanel = ({
  scorePercent,
  explanation,
  suggestions,
  difficulty,
  strengths = [],
  improvements = [],
  timePenaltyMessage = '',
  recommendedGuideIds = [],
}) => {
  const safeScore = Math.max(0, Math.min(100, Number(scorePercent) || 0))
  const difficultyConfig = getDifficultyConfig(difficulty)
  const isPass = safeScore >= difficultyConfig.minPassScore
  const rankLabel = isPass ? 'Cumple nivel' : 'No cumple nivel'
  const shortSummary = compactSummary(explanation)
  const fallback = buildFallbackPoints(safeScore, suggestions, difficultyConfig.minPassScore)
  const finalStrengths = Array.isArray(strengths) && strengths.length ? strengths.slice(0, 3) : fallback.strengths
  const finalImprovements = Array.isArray(improvements) && improvements.length ? improvements.slice(0, 3) : fallback.improvements
  const recommendedGuides = GUIDE_LIBRARY.filter((guide) => recommendedGuideIds.includes(guide.id))

  return (
    <div className="rounded-[1.75rem] border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
      <div className="grid gap-3">
        {timePenaltyMessage && (
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-700">{timePenaltyMessage}</p>
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-[120px_1fr]">
          <div className="flex items-center justify-center rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
            <ScoreCircle value={safeScore} />
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">{difficultyConfig.label}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isPass ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {rankLabel}
              </span>
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Descripcion general</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">
              {shortSummary}
            </p>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Tus puntos fuertes</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {finalStrengths.map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Tus puntos a mejorar</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {finalImprovements.map((item) => (
              <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
                {item}
              </span>
            ))}
          </div>
        </div>

        {recommendedGuides.length > 0 && (
          <div className="rounded-[1.25rem] border border-indigo-200 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Guias recomendadas</p>
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
