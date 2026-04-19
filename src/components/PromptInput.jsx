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

const PromptInput = ({ promptUsuario, setPromptUsuario, onSubmit, isLoading, disabled = false, mode, difficulty, onTimingChange, paused = false }) => {
  const { t } = useLang()
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [pausedElapsed, setPausedElapsed] = useState(0) // segundos acumulados antes de pausar
  const timerConfig = useMemo(() => getTimerConfig(mode, difficulty), [mode, difficulty])

  useEffect(() => {
    if (!startedAt || paused) return
    const id = window.setInterval(() => {
      setElapsedSeconds(pausedElapsed + Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(id)
  }, [startedAt, paused, pausedElapsed])

  // Al pausar: guardar los segundos acumulados y resetear startedAt
  useEffect(() => {
    if (!startedAt) return
    if (paused) {
      setPausedElapsed(prev => prev + Math.floor((Date.now() - startedAt) / 1000))
      setStartedAt(null)
    } else {
      // Al reanudar: nuevo startedAt desde ahora
      setStartedAt(Date.now())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused])

  useEffect(() => {
    if (!promptUsuario.trim()) { setStartedAt(null); setElapsedSeconds(0); setPausedElapsed(0) }
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
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block text-sm font-medium text-slate-700">{t('writePrompt')}</label>
      <div className="relative">
        <textarea
          value={promptUsuario}
          onChange={(e) => {
            if (!startedAt && e.target.value.trim() && !paused) setStartedAt(Date.now())
            setPromptUsuario(e.target.value)
          }}
          onCopy={handleAntiPaste} onPaste={handleAntiPaste} onCut={handleAntiPaste}
          onDrop={handleAntiPaste} onKeyDown={handleKeyDown}
          rows="4"
          placeholder={t('promptPlaceholder')}
          disabled={disabled}
          className="w-full min-h-[130px] resize-none rounded-xl border border-slate-200 bg-transparent px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-0 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
        <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-slate-900/5 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-500">
          {wordsCount}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5">
          <span className="text-slate-400">{t('mode')}</span>
          <span className="text-slate-700 font-semibold">{mode === 'daily' ? t('daily') : t('random')}</span>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5">
          <span className="text-slate-400">{t('difficulty')}</span>
          <span className="text-slate-700 font-semibold">{difficulty}</span>
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${timeBadgeClass}`}>
          <span className="font-semibold">{formatTime(remainingSeconds)}</span>
        </span>
      </div>

      {overtimeSeconds > 0 && penaltyOvertimeSeconds === 0 && (
        <p className="text-xs text-amber-600">
          {t('mode') === 'Modo'
            ? `Tiempo superado. ${formatTime(timerConfig.graceSeconds - overtimeSeconds)} antes de penalización.`
            : `Time exceeded. ${formatTime(timerConfig.graceSeconds - overtimeSeconds)} before penalty.`}
        </p>
      )}
      {penaltyOvertimeSeconds > 0 && (
        <p className="text-xs text-rose-600">
          {t('mode') === 'Modo'
            ? `Penalización activa — ${formatTime(penaltyOvertimeSeconds)} extra.`
            : `Penalty active — ${formatTime(penaltyOvertimeSeconds)} over.`}
        </p>
      )}

      <p className="text-xs text-slate-400">{t('promptRecommendation')}</p>

      <button type="submit" disabled={isLoading || disabled}
        className="inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        style={{ backgroundColor: 'rgb(var(--color-accent))' }}
        onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = 'rgb(var(--color-accent-2))')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgb(var(--color-accent))')}>
        {isLoading ? t('analyzing') : disabled ? t('noImageAvailable') : t('analyzeWithAI')}
      </button>
    </form>
  )
}

export default PromptInput
