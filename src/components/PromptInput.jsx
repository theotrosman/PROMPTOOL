import { useEffect, useMemo, useState } from 'react'

const normalizeDifficulty = (difficulty = 'Media') =>
  difficulty
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const getTimerConfig = (mode = 'random', difficulty = 'Media') => {
  const normalized = normalizeDifficulty(difficulty)
  const isDaily = mode === 'daily'

  if (normalized.includes('facil')) {
    return isDaily
      ? { recommendedSeconds: 70, targetWords: 12, graceSeconds: 15 }
      : { recommendedSeconds: 85, targetWords: 14, graceSeconds: 20 }
  }
  if (normalized.includes('dificil')) {
    return isDaily
      ? { recommendedSeconds: 145, targetWords: 24, graceSeconds: 22 }
      : { recommendedSeconds: 165, targetWords: 28, graceSeconds: 28 }
  }
  return isDaily
    ? { recommendedSeconds: 105, targetWords: 18, graceSeconds: 18 }
    : { recommendedSeconds: 120, targetWords: 20, graceSeconds: 22 }
}

const formatTime = (seconds = 0) => {
  const safe = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

const PromptInput = ({ promptUsuario, setPromptUsuario, onSubmit, isLoading, mode, difficulty, tema, onTimingChange }) => {
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerConfig = useMemo(() => getTimerConfig(mode, difficulty), [mode, difficulty])

  useEffect(() => {
    if (!startedAt) return

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [startedAt])

  useEffect(() => {
    if (!promptUsuario.trim()) {
      setStartedAt(null)
      setElapsedSeconds(0)
    }
  }, [promptUsuario])

  const estimatedSeconds = timerConfig.recommendedSeconds
  const remainingSeconds = Math.max(0, estimatedSeconds - elapsedSeconds)
  const wordsCount = promptUsuario.trim().split(/\s+/).filter(Boolean).length
  const overtimeSeconds = Math.max(0, elapsedSeconds - estimatedSeconds)
  const penaltyStartSeconds = estimatedSeconds + timerConfig.graceSeconds
  const penaltyOvertimeSeconds = Math.max(0, elapsedSeconds - penaltyStartSeconds)
  const remainingRatio = estimatedSeconds > 0 ? remainingSeconds / estimatedSeconds : 0

  useEffect(() => {
    if (!onTimingChange) return
    onTimingChange({
      elapsedSeconds,
      recommendedSeconds: estimatedSeconds,
      overtimeSeconds,
      graceSeconds: timerConfig.graceSeconds,
      penaltyStartSeconds,
      penaltyOvertimeSeconds,
    })
  }, [elapsedSeconds, estimatedSeconds, overtimeSeconds, timerConfig.graceSeconds, penaltyStartSeconds, penaltyOvertimeSeconds, onTimingChange])

  const handleAntiPaste = (event) => {
    event.preventDefault()
  }

  const handleKeyDown = (event) => {
    const blockedShortcuts = ['c', 'v', 'x', 'Insert']
    if ((event.ctrlKey || event.metaKey) && blockedShortcuts.includes(event.key)) {
      event.preventDefault()
    }
    if (event.shiftKey && event.key === 'Insert') {
      event.preventDefault()
    }
  }

  const timeBadgeClass =
    overtimeSeconds > 0
      ? 'bg-rose-100 text-rose-700'
      : remainingRatio > 0.66
        ? 'bg-emerald-100 text-emerald-700'
        : remainingRatio > 0.33
          ? 'bg-amber-100 text-amber-700'
          : 'bg-rose-100 text-rose-700'

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <label className="block text-sm font-medium text-slate-700">
        Escribe tu prompt
      </label>
      <div className="relative">
        <textarea
          value={promptUsuario}
          onChange={(event) => {
            if (!startedAt && event.target.value.trim()) {
              setStartedAt(Date.now())
            }
            setPromptUsuario(event.target.value)
          }}
          onCopy={handleAntiPaste}
          onPaste={handleAntiPaste}
          onCut={handleAntiPaste}
          onDrop={handleAntiPaste}
          onKeyDown={handleKeyDown}
          rows="4"
          placeholder="Ingresa el Prompt que crees que generó la imagen de la derecha"
          className="w-full min-h-[130px] resize-none rounded-[1.75rem] border border-slate-200 bg-transparent px-5 py-4 pr-14 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-0"
        />
        <div className="pointer-events-none absolute right-4 top-3 rounded-full bg-slate-900/5 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700">
          {wordsCount}
        </div>
      </div>

      <div className="grid gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1">
          Modo: {mode === 'daily' ? 'Diario' : 'Random'}
        </span>
        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1">
          Dificultad: {difficulty}
        </span>
        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1">
          Tematica: {String(tema || 'Ciencia ficción')}
        </span>
        <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 ${timeBadgeClass}`}>
          Tiempo sugerido: {formatTime(remainingSeconds)}
        </span>
      </div>
      {overtimeSeconds > 0 && penaltyOvertimeSeconds === 0 && (
        <p className="text-sm font-semibold text-amber-700">
          Tiempo recomendado superado. Tenés {formatTime(timerConfig.graceSeconds - overtimeSeconds)} de margen antes de penalización.
        </p>
      )}
      {penaltyOvertimeSeconds > 0 && (
        <p className="text-sm font-semibold text-rose-700">
          Tardaste demasiado: {formatTime(penaltyOvertimeSeconds)} extra sobre el margen. Se aplicará penalización de score.
        </p>
      )}
      <p className="text-sm text-slate-500">
        Recomendación: menciona ambiente, estilo o iluminación, y enfócate en objetos concretos.
      </p>
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex w-full items-center justify-center rounded-[1.75rem] bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isLoading ? 'Analizando...' : 'Analizar con IA'}
      </button>
    </form>
  )
}

export default PromptInput
