import { useEffect, useMemo, useState } from 'react'
import { useLang } from '../contexts/LangContext'
import flameLitGif from '../assets/flame-lit.gif'

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

const PromptInput = ({ promptUsuario, setPromptUsuario, onSubmit, isLoading, disabled = false, mode, difficulty, onTimingChange, paused = false, isRanked = true, onToggleRanked = null, streak = 0, imageId = null, onDifficultyChange = null, availableDiffs = [] }) => {
  const { t, lang } = useLang()
  const [startedAt, setStartedAt] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [pausedElapsed, setPausedElapsed] = useState(0)
  const [showShortWarning, setShowShortWarning] = useState(false)
  const [restoredDraft, setRestoredDraft] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const timerConfig = useMemo(() => getTimerConfig(mode, difficulty), [mode, difficulty])

  const DRAFT_KEY = `promptdraft_${mode}_${imageId || 'noimg'}`

  const DRAFT_TTL = 5 * 60 * 1000 // 5 minutos en ms

  // Restaurar borrador al montar (solo si hay texto, corresponde a la misma imagen y no expiró)
  useEffect(() => {
    if (!imageId || promptUsuario.trim()) return
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (!saved) return
      const { text, elapsed, savedAt } = JSON.parse(saved)
      if (savedAt && Date.now() - savedAt > DRAFT_TTL) {
        localStorage.removeItem(DRAFT_KEY)
        return
      }
      if (text?.trim()) {
        setPromptUsuario(text)
        if (elapsed > 0) {
          setPausedElapsed(elapsed)
          setElapsedSeconds(elapsed)
        }
        setRestoredDraft(true)
        setTimeout(() => setRestoredDraft(false), 3000)
      }
    } catch { /* silencioso */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageId])

  // Guardar borrador en localStorage continuamente (solo si no se ha enviado)
  useEffect(() => {
    if (!imageId || !promptUsuario.trim() || submitted) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ text: promptUsuario, elapsed: elapsedSeconds, savedAt: Date.now() }))
    } catch { /* silencioso */ }
  }, [promptUsuario, elapsedSeconds, DRAFT_KEY, imageId, submitted])

  // Limpiar borrador al enviar
  const clearDraft = () => {
    setSubmitted(true)
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* silencioso */ }
  }

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
    <form className="space-y-3" onSubmit={e => {
      if (wordsCount < 5 && !showShortWarning) {
        e.preventDefault()
        setShowShortWarning(true)
        return
      }
      setShowShortWarning(false)
      clearDraft()
      onSubmit(e)
    }}>
      {/* Banner de borrador restaurado */}
      {restoredDraft && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {lang === 'en' ? 'Draft restored' : 'Borrador restaurado'}
        </div>
      )}
      {/* Racha — junto al label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">{t('writePrompt')}</label>
        {streak >= 2 && (
          <div className="flex items-center gap-0.5">
            <img src={flameLitGif} alt="" className="h-6 w-6 object-contain" />
            <span className="text-base font-black tabular-nums translate-y-px" style={{ color: '#fb923c', letterSpacing: '-0.02em' }}>{streak}</span>
          </div>
        )}
      </div>
      <div className="relative">
        <textarea
          value={promptUsuario}
          onChange={(e) => {
            if (!startedAt && e.target.value.trim() && !paused) setStartedAt(Date.now())
            setPromptUsuario(e.target.value)
            if (showShortWarning) setShowShortWarning(false)
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
          <span className="text-slate-700 font-semibold">{mode === 'daily' ? t('daily') : mode === 'challenge' ? (lang === 'en' ? 'Challenge' : 'Desafío') : t('random')}</span>
        </span>
        {onDifficultyChange && availableDiffs.length > 1 ? (
          <button
            type="button"
            onClick={() => {
              const diffs = availableDiffs
              const current = diffs.findIndex(d => d.toLowerCase() === (difficulty || 'Medium').toLowerCase())
              const next = diffs[(current + 1) % diffs.length]
              onDifficultyChange(next)
            }}
            title={lang === 'en' ? 'Click to change difficulty' : 'Click para cambiar dificultad'}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 transition hover:bg-slate-200 cursor-pointer"
          >
            <span className="text-slate-400">{t('difficulty')}</span>
            <span className={`font-semibold transition ${
              normalizeDifficulty(difficulty) === 'easy' ? 'text-emerald-600' :
              normalizeDifficulty(difficulty) === 'hard' ? 'text-rose-600' :
              'text-amber-600'
            }`}>{difficulty}</span>
            <svg className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5">
            <span className="text-slate-400">{t('difficulty')}</span>
            <span className={`font-semibold ${
              normalizeDifficulty(difficulty) === 'easy' ? 'text-emerald-600' :
              normalizeDifficulty(difficulty) === 'hard' ? 'text-rose-600' :
              'text-amber-600'
            }`}>{difficulty}</span>
          </span>
        )}
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${timeBadgeClass}`}>
          <span className="font-semibold">{formatTime(remainingSeconds)}</span>
        </span>
        {/* Toggle rankeado — solo si no es challenge */}
        {onToggleRanked && (
          <div className="relative group">
            <button
              type="button"
              onClick={() => onToggleRanked(!isRanked)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                isRanked
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-semibold">
                {isRanked
                  ? (lang === 'en' ? 'Ranked' : 'Rankeado')
                  : (lang === 'en' ? 'Unranked' : 'Sin rankeo')}
              </span>
            </button>
            {/* Tooltip explicativo */}
            <div className="pointer-events-none absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-56">
              <div className="rounded-xl bg-slate-900 px-3 py-2.5 text-xs text-white shadow-xl space-y-1.5">
                {isRanked ? (
                  <>
                    <p className="font-semibold text-violet-300">{lang === 'en' ? 'Ranked mode ON' : 'Modo rankeado ACTIVADO'}</p>
                    <p className="text-slate-300 leading-relaxed">
                      {lang === 'en'
                        ? 'This game counts toward your ELO and the leaderboard. You need 5 ranked games to appear in the league.'
                        : 'Esta partida cuenta para tu ELO y la leaderboard. Necesitás 5 partidas rankeadas para aparecer en la liga.'}
                    </p>
                    <p className="text-slate-400">{lang === 'en' ? 'Click to play without affecting your rank.' : 'Click para jugar sin afectar tu ranking.'}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-slate-400">{lang === 'en' ? 'Unranked mode' : 'Modo sin rankeo'}</p>
                    <p className="text-slate-300 leading-relaxed">
                      {lang === 'en'
                        ? 'This game won\'t affect your ELO or leaderboard position. Good for practicing without pressure.'
                        : 'Esta partida no afecta tu ELO ni tu posición en la liga. Ideal para practicar sin presión.'}
                    </p>
                    <p className="text-slate-400">{lang === 'en' ? 'Click to play ranked.' : 'Click para jugar rankeado.'}</p>
                  </>
                )}
              </div>
              <div className="ml-3 h-2 w-2 rotate-45 bg-slate-900 -mt-1" />
            </div>
          </div>
        )}
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

      {showShortWarning && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            {lang === 'en' ? 'Your prompt is very short' : 'Tu prompt es muy corto'}
          </p>
          <p className="text-xs text-amber-600 mt-0.5">
            {lang === 'en'
              ? `Only ${wordsCount} word${wordsCount !== 1 ? 's' : ''}. A good prompt usually has 10+ words with visual details, style and lighting. Submit anyway?`
              : `Solo ${wordsCount} palabra${wordsCount !== 1 ? 's' : ''}. Un buen prompt suele tener 10+ palabras con detalles visuales, estilo e iluminación. ¿Enviar igual?`}
          </p>
        </div>
      )}

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
