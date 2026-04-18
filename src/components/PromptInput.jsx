import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'

const normalizeDifficulty = (difficulty = 'Medium') => difficulty.toLowerCase()

const getTimerConfig = (mode = 'random', difficulty = 'Medium') => {
  const normalized = normalizeDifficulty(difficulty)
  const isDaily = mode === 'daily'
  if (normalized === 'easy') return isDaily
    ? { recommendedSeconds: 120, targetWords: 12, graceSeconds: 30 }
    : { recommendedSeconds: 150, targetWords: 14, graceSeconds: 40 }
  if (normalized === 'hard') return isDaily
    ? { recommendedSeconds: 240, targetWords: 24, graceSeconds: 60 }
    : { recommendedSeconds: 270, targetWords: 28, graceSeconds: 60 }
  // Medium
  return isDaily
    ? { recommendedSeconds: 180, targetWords: 18, graceSeconds: 45 }
    : { recommendedSeconds: 210, targetWords: 20, graceSeconds: 50 }
}

const formatTime = (seconds = 0) => {
  const safe = Math.max(0, Math.floor(seconds))
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

const PromptInput = ({ promptUsuario, setPromptUsuario, onSubmit, isLoading, disabled = false, mode, difficulty, onTimingChange }) => {
  const { t } = useLang()
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerConfig = useMemo(() => getTimerConfig(mode, difficulty), [mode, difficulty])

  useEffect(() => {
    if (!startedAt) return
    const id = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => window.clearInterval(id)
  }, [startedAt])

  useEffect(() => {
    if (!promptUsuario.trim()) { setStartedAt(null); setElapsedSeconds(0) }
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
    onTimingChange({ elapsedSeconds, recommendedSeconds: estimatedSeconds, overtimeSeconds, graceSeconds: timerConfig.graceSeconds, penaltyStartSeconds, penaltyOvertimeSeconds })
  }, [elapsedSeconds, estimatedSeconds, overtimeSeconds, timerConfig.graceSeconds, penaltyStartSeconds, penaltyOvertimeSeconds, onTimingChange])

  const handleAntiPaste = (e) => e.preventDefault()
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && ['c','v','x','Insert'].includes(e.key)) e.preventDefault()
    if (e.shiftKey && e.key === 'Insert') e.preventDefault()
  }

  const timeBadgeClass = overtimeSeconds > 0 ? 'bg-rose-100 text-rose-700'
    : remainingRatio > 0.66 ? 'bg-emerald-100 text-emerald-700'
    : remainingRatio > 0.33 ? 'bg-amber-100 text-amber-700'
    : 'bg-rose-100 text-rose-700'

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <label className="block text-sm font-medium text-slate-700">{t('writePrompt')}</label>
      <div className="relative">
        <textarea
          value={promptUsuario}
          onChange={(e) => {
            if (!startedAt && e.target.value.trim()) setStartedAt(Date.now())
            setPromptUsuario(e.target.value)
          }}
          onCopy={handleAntiPaste} onPaste={handleAntiPaste} onCut={handleAntiPaste}
          onDrop={handleAntiPaste} onKeyDown={handleKeyDown}
          rows="4"
          placeholder={t('promptPlaceholder')}
          disabled={disabled}
          className="w-full min-h-[130px] resize-none rounded-[1.75rem] border border-slate-200 bg-transparent px-5 py-4 pr-14 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
        <div className="pointer-events-none absolute right-4 top-3 rounded-full bg-slate-900/5 px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-700">
          {wordsCount}
        </div>
      </div>

      <div className="grid gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1">
          {t('mode')}: {mode === 'daily' ? t('daily') : t('random')}
        </span>
        <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1">
          {t('difficulty')}: {difficulty}
        </span>
        <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 ${timeBadgeClass}`}>
          {t('suggestedTime')}: {formatTime(remainingSeconds)}
        </span>
      </div>

      {overtimeSeconds > 0 && penaltyOvertimeSeconds === 0 && (
        <p className="text-sm font-semibold text-amber-700">
          {t('mode') === 'Modo'
            ? `Tiempo recomendado superado. Tenés ${formatTime(timerConfig.graceSeconds - overtimeSeconds)} de margen antes de penalización.`
            : `Recommended time exceeded. You have ${formatTime(timerConfig.graceSeconds - overtimeSeconds)} left before penalty.`}
        </p>
      )}
      {penaltyOvertimeSeconds > 0 && (
        <p className="text-sm font-semibold text-rose-700">
          {t('mode') === 'Modo'
            ? `Tardaste demasiado: ${formatTime(penaltyOvertimeSeconds)} extra sobre el margen. Se aplicará penalización de score.`
            : `Too slow: ${formatTime(penaltyOvertimeSeconds)} over the grace period. A score penalty will apply.`}
        </p>
      )}

      <p className="text-sm text-slate-500">{t('promptRecommendation')}</p>

      <button type="submit" disabled={isLoading || disabled}
        className="inline-flex w-full items-center justify-center rounded-[1.75rem] bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400">
        {isLoading ? t('analyzing') : disabled ? t('noImageAvailable') : t('analyzeWithAI')}
      </button>
    </form>
  )
}

export default PromptInput
