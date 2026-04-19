import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import ConfigModal from './components/ConfigModal'
import ImageCard from './components/ImageCard'
import LandingPage from './components/LandingPage'
import AuthModal from './components/AuthModal'
import PromptInput from './components/PromptInput'
import ResultPanel from './components/ResultPanel'
import { comparePrompts } from './services/geminiService'
import { analyzePlagiarism, checkSuspension } from './services/plagiarismService'
import { calculateElo } from './services/eloService'
import { getRecommendedGuides } from './data/guides'
import { supabase } from './supabaseClient'
import { useAuth } from './hooks/useAuth'
import { useLang } from './contexts/LangContext'

// Columnas reales: id_imagen, url_image, prompt_original, seed, fecha, image_diff, image_theme
const normalizeImageData = (row) => {
  if (!row) return null
  return {
    id_imagen: row.id_imagen ?? null,
    url_image: row.url_image ?? null,
    prompt_original: row.prompt_original ?? '',
    seed: row.seed ?? null,
    fecha: row.fecha ?? null,
    image_diff: row.image_diff ?? 'Medium',
    image_theme: row.image_theme ?? '',
  }
}

const normalizeDifficulty = (difficulty = 'Medium') => difficulty.toLowerCase()

const formatDuration = (seconds = 0) => {
  const safe = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

const getTimePenalty = ({ elapsedSeconds = 0, recommendedSeconds = 0 }, difficulty = 'Medium', mode = 'random') => {
  if (!recommendedSeconds || elapsedSeconds <= recommendedSeconds) {
    return { penalty: 0, message: '' }
  }
  const overtimeSeconds = elapsedSeconds - recommendedSeconds
  const overtimeRatio = overtimeSeconds / Math.max(recommendedSeconds, 1)
  const nd = normalizeDifficulty(difficulty)
  const difficultyFactor = nd === 'easy' ? 0.85 : nd === 'hard' ? 1.2 : 1.05
  const modeFactor = mode === 'daily' ? 1.12 : 0.95
  const penalty = Math.min(30, Math.max(4, Math.round((overtimeRatio * 22 + overtimeSeconds / 18) * difficultyFactor * modeFactor)))
  return {
    penalty,
    message: `Tardaste demasiado (${formatDuration(overtimeSeconds)} extra). Se descontaron ${penalty} puntos por exceder el tiempo recomendado.`,
  }
}

function App() {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const { t } = useLang()
  const [showLanding, setShowLanding] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [promptUsuario, setPromptUsuario] = useState('')
  const [aiExplanation, setAiExplanation] = useState('')
  const [scorePercent, setScorePercent] = useState(null)
  const [eloDelta, setEloDelta] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [mode, setMode] = useState('daily')
  const [draftMode, setDraftMode] = useState('daily')
  const [difficulty, setDifficulty] = useState('Medium')
  const [configOpen, setConfigOpen] = useState(false)
  const [draftDifficulty, setDraftDifficulty] = useState('Medium')
  const [imageData, setImageData] = useState(null)
  const [imageStatus, setImageStatus] = useState('loading')
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState('')
  const [strengths, setStrengths] = useState([])
  const [improvements, setImprovements] = useState([])
  const [timingData, setTimingData] = useState({ elapsedSeconds: 0, recommendedSeconds: 0, overtimeSeconds: 0 })
  const [timePenaltyMessage, setTimePenaltyMessage] = useState('')
  const [availableDiffs, setAvailableDiffs] = useState([])
  const [dailyDone, setDailyDone] = useState(false)
  const [suspensionInfo, setSuspensionInfo] = useState(null)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  // Para no logueados: límite de 1 partida diaria (guardada en sessionStorage)
  const [guestDailyDone, setGuestDailyDone] = useState(() => {
    const stored = sessionStorage.getItem('guestDailyDate')
    return stored === new Date().toDateString()
  })
  const recommendedGuideIds = getRecommendedGuides(improvements, suggestions)

  // Verificar suspensión al cargar
  useEffect(() => {
    if (!user) return
    checkSuspension(user.id).then(result => {
      if (!result.allowed) setSuspensionInfo(result)
    })
  }, [user?.id])

  useEffect(() => {
    if (user) setShowLanding(false)
  }, [user])

  // Cuando el usuario se loguea, asignar intento pendiente de guest si existe
  useEffect(() => {
    if (!user) return
    const pending = sessionStorage.getItem('pendingAttempt')
    if (!pending) return
    try {
      const attempt = JSON.parse(pending)
      supabase.from('intentos').insert([{ ...attempt, id_usuario: user.id }])
        .then(() => sessionStorage.removeItem('pendingAttempt'))
    } catch { sessionStorage.removeItem('pendingAttempt') }
  }, [user?.id])

  // Fetch inicial: extrae las dificultades disponibles en la BD
  useEffect(() => {
    const fetchFilters = async () => {
      const { data } = await supabase
        .from('imagenes_ia')
        .select('image_diff')

      if (!data) return
      const diffOrder = ['Easy', 'Medium', 'Hard']
      const found = [...new Set(data.map((r) => r.image_diff).filter(Boolean))]
      setAvailableDiffs(diffOrder.filter((d) => found.includes(d)))
    }
    fetchFilters()
  }, [])

  // Verificar si el usuario ya hizo el modo diario hoy (solo al montar o cambiar usuario)
  useEffect(() => {
    if (!user) {
      setDailyDone(false)
      setMode('daily')
      setDraftMode('daily')
      return
    }
    const dailyKey = `dailyDoneDate_${user.id}`
    const checkDaily = async () => {
      // Primero chequear localStorage con clave específica del usuario
      const stored = localStorage.getItem(dailyKey)
      if (stored === new Date().toDateString()) {
        setDailyDone(true)
        if (!submitted) { setMode('random'); setDraftMode('random') }
        return
      }
      // Verificar en BD
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const { data } = await supabase
        .from('intentos')
        .select('id_intento')
        .eq('id_usuario', user.id)
        .eq('modo', 'daily')
        .gte('fecha_hora', hoy.toISOString())
        .limit(1)
      const done = !!(data && data.length > 0)
      setDailyDone(done)
      if (done) {
        localStorage.setItem(dailyKey, new Date().toDateString())
        if (!submitted) { setMode('random'); setDraftMode('random') }
      }
    }
    checkDaily()
  }, [user?.id])

  // Fetch de la imagen activa
  useEffect(() => {
    let cancelled = false

    const fetchImageData = async () => {
      setImageStatus('loading')

      try {
        let query = supabase.from('imagenes_ia').select('*')

        if (mode === 'daily') {
          const hoy = new Date()
          hoy.setHours(23, 59, 59, 999)
          query = query
            .lte('fecha', hoy.toISOString())
            .order('fecha', { ascending: false })
            .limit(1)
        } else {
          if (difficulty) query = query.eq('image_diff', difficulty)
        }

        const { data, error } = await query
        if (cancelled) return
        if (error) throw error

        if (!data || data.length === 0) {
          setImageStatus('empty')
          return
        }

        let rows = data.map(normalizeImageData)

        if (mode === 'random') {
          const dailyId = [...rows].sort((a, b) =>
            new Date(b.fecha) - new Date(a.fecha)
          )[0]?.id_imagen
          const withoutDaily = rows.filter(r => r.id_imagen !== dailyId)
          if (withoutDaily.length > 0) rows = withoutDaily
        }

        if (cancelled) return

        const selected = mode === 'daily'
          ? rows[0]
          : rows[Math.floor(Math.random() * rows.length)]

        setImageData(selected)
        setImageStatus('ok')
      } catch (err) {
        if (!cancelled) {
          console.error('[imagenes_ia] Error:', err)
          setImageStatus('error')
        }
      }
    }

    fetchImageData()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, difficulty])

  // El modo ya se inicializa correctamente desde localStorage en el useState — no hace falta useEffect

  const hasImage = imageStatus === 'ok' && imageData !== null
  const isDisabled = !hasImage || (mode === 'daily' && (user ? dailyDone : guestDailyDone))

  const handleSubmit = async (event) => {
    event.preventDefault()
    const submittedPrompt = promptUsuario.trim()
    if (!submittedPrompt || !hasImage) return

    const promptReferencia = imageData?.prompt_original
    if (!promptReferencia) return

    // Verificar suspensión antes de procesar
    if (user) {
      const suspension = await checkSuspension(user.id)
      if (!suspension.allowed) { setSuspensionInfo(suspension); return }
    }

    setAnalyzing(true)
    setSubmitted(true)

    try {
      const result = await comparePrompts(submittedPrompt, promptReferencia, imageData?.image_diff ?? difficulty)
      const timePenalty = getTimePenalty(timingData, imageData?.image_diff ?? difficulty, mode)
      const finalScore = Math.max(0, (result.score ?? 0) - timePenalty.penalty)

      setScorePercent(finalScore)
      setAiExplanation(result.explanation)
      setSuggestions(result.suggestions)
      setStrengths(result.strengths ?? [])
      setImprovements(result.improvements ?? [])
      setTimePenaltyMessage(timePenalty.message)

      const { error: dbError } = await supabase
        .from('intentos')
        .insert([{
          prompt_usuario: submittedPrompt,
          puntaje_similitud: finalScore,
          id_imagen: imageData.id_imagen,
          id_usuario: user?.id || null,
          fecha_hora: new Date().toISOString(),
          strengths: result.strengths ?? [],
          improvements: result.improvements ?? [],
          modo: mode,
          elo_delta: null, // se actualiza abajo si hay usuario
        }])

      if (dbError) console.error('[intentos] Error al guardar:', dbError.message)
      else {
        // Incrementar total_intentos en la BD para que el leaderboard lo refleje inmediatamente
        if (user) {
          supabase.from('usuarios')
            .select('total_intentos')
            .eq('id_usuario', user.id)
            .maybeSingle()
            .then(({ data }) => {
              supabase.from('usuarios')
                .update({ total_intentos: (data?.total_intentos ?? 0) + 1 })
                .eq('id_usuario', user.id)
            })
        }

        if (mode === 'daily') {
          if (user) {
            setDailyDone(true)
            localStorage.setItem(`dailyDoneDate_${user.id}`, new Date().toDateString())
          }
          else {
            sessionStorage.setItem('guestDailyDate', new Date().toDateString())
            setGuestDailyDone(true)
            sessionStorage.setItem('pendingAttempt', JSON.stringify({
              prompt_usuario: submittedPrompt,
              puntaje_similitud: finalScore,
              id_imagen: imageData.id_imagen,
              fecha_hora: new Date().toISOString(),
              strengths: result.strengths ?? [],
              improvements: result.improvements ?? [],
              modo: mode,
            }))
          }
        }

        // Actualizar ELO del usuario logueado
        if (user) {
          try {
            const { data: userData } = await supabase
              .from('usuarios')
              .select('elo_rating, total_intentos')
              .eq('id_usuario', user.id)
              .maybeSingle()

            const currentElo = userData?.elo_rating ?? 1000
            const totalAttempts = userData?.total_intentos ?? 0

            // No calcular ELO hasta tener 5 intentos
            if (totalAttempts < 5) {
              console.log(`[ELO] Awaiting rank (${totalAttempts}/5)`)
            } else {
              const { newElo, delta } = calculateElo({
                userElo: currentElo,
                totalAttempts,
                score: finalScore,
                difficulty: imageData?.image_diff ?? difficulty,
                timing: {
                  elapsedSeconds: timingData.elapsedSeconds,
                  recommendedSeconds: timingData.recommendedSeconds,
                  penaltyOvertimeSeconds: timingData.penaltyOvertimeSeconds ?? 0,
                },
              })

              await supabase
                .from('usuarios')
                .update({ elo_rating: newElo })
                .eq('id_usuario', user.id)

              // Guardar delta en el intento más reciente
              await supabase
                .from('intentos')
                .update({ elo_delta: delta })
                .eq('id_usuario', user.id)
                .order('fecha_hora', { ascending: false })
                .limit(1)

              setEloDelta(delta)
              console.log(`[ELO] ${currentElo} → ${newElo} (${delta > 0 ? '+' : ''}${delta})`)
            }
          } catch (eloErr) {
            console.warn('[ELO] Error actualizando:', eloErr.message)
          }
        }
      }

      // Análisis antiplagio — async, no bloquea la UI
      if (user) {
        analyzePlagiarism({
          userId: user.id,
          prompt: submittedPrompt,
          score: finalScore,
          elapsedSeconds: timingData.elapsedSeconds,
          difficulty,
          imageId: imageData.id_imagen,
        }).then(({ suspicious, severity }) => {
          if (suspicious && severity === 'high') {
            console.warn('[antiplagio] Intento sospechoso detectado')
          }
        })
      }
    } catch (err) {
      console.error('[handleSubmit] Error:', err)
      setScorePercent(0)
      setAiExplanation('Hubo un error al analizar tu prompt.')
      setSuggestions('')
      setStrengths([])
      setImprovements([])
      setTimePenaltyMessage('')
    } finally {
      setAnalyzing(false)
    }
  }

  const openConfig = () => {
    setDraftMode(mode)
    setDraftDifficulty(difficulty)
    setConfigOpen(true)
  }

  const handleTryApp = () => {
    setShowLanding(false)
    setMode('random')
    setDraftMode('random')
  }

  const handleOpenAuth = () => {
    setAuthModalOpen(true)
  }

  const handleCloseAuth = () => {
    setAuthModalOpen(false)
  }

  const saveConfig = () => {
    setMode(draftMode)
    setDifficulty(draftDifficulty)
    setConfigOpen(false)
  }

  const handleReset = () => {
    setPromptUsuario('')
    setAiExplanation('')
    setScorePercent(null)
    setEloDelta(null)
    setSubmitted(false)
    setSuggestions('')
    setStrengths([])
    setImprovements([])
    setTimingData({ elapsedSeconds: 0, recommendedSeconds: 0, overtimeSeconds: 0 })
    setTimePenaltyMessage('')
    setAnalyzing(false)
  }

  // Retry: vuelve al input con el mismo prompt y misma imagen, sin guardar nuevo intento
  const handleRetry = () => {
    setAiExplanation('')
    setScorePercent(null)
    setEloDelta(null)
    setSubmitted(false)
    setSuggestions('')
    setStrengths([])
    setImprovements([])
    setTimingData({ elapsedSeconds: 0, recommendedSeconds: 0, overtimeSeconds: 0 })
    setTimePenaltyMessage('')
    setAnalyzing(false)
    // promptUsuario se mantiene para que el usuario lo vea y mejore
  }

  // Nueva imagen aleatoria — resetea todo y fuerza refetch en modo random
  const handleNewRandom = () => {
    handleReset()
    if (mode !== 'random') {
      setMode('random')
      setDraftMode('random')
    } else {
      // Forzar refetch cambiando a un valor temporal y volviendo
      setImageStatus('loading')
      setImageData(null)
      const fetchRandom = async () => {
        try {
          let query = supabase.from('imagenes_ia').select('*')
          if (difficulty) query = query.eq('image_diff', difficulty)
          const { data } = await query
          if (!data || data.length === 0) { setImageStatus('empty'); return }
          let rows = data.map(normalizeImageData)

          // Excluir imagen del día
          const dailyId = [...rows].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0]?.id_imagen
          const withoutDaily = rows.filter(r => r.id_imagen !== dailyId)
          if (withoutDaily.length > 0) rows = withoutDaily

          // Excluir dominadas
          if (user) {
            try {
              const { data: mastered } = await supabase
                .from('intentos').select('id_imagen')
                .eq('id_usuario', user.id).gt('puntaje_similitud', 93)
              if (mastered?.length) {
                const masteredIds = new Set(mastered.map(i => i.id_imagen))
                const filtered = rows.filter(r => !masteredIds.has(r.id_imagen))
                if (filtered.length > 0) rows = filtered
              }
            } catch { /* fail open */ }
          }

          const selected = rows[Math.floor(Math.random() * rows.length)]
          setImageData(selected)
          setDifficulty(selected.image_diff ?? 'Medium')
          setImageStatus('ok')
        } catch { setImageStatus('error') }
      }
      fetchRandom()
    }
  }

  const renderControls = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <button type="button" onClick={openConfig}
        className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200">
        {t('configure')}
      </button>
      {submitted ? (
        <>
          <button type="button" onClick={handleNewRandom}
            className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200">
            {t('newRandom')}
          </button>
          <button type="button" onClick={handleReset}
            className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200">
            {t('reset')}
          </button>
        </>
      ) : (
        mode === 'random' && (
          <button type="button" onClick={handleNewRandom}
            className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-200">
            {t('newRandom')}
          </button>
        )
      )}
    </div>
  )

  if (!user && showLanding) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <LandingPage onOpenAuth={handleOpenAuth} onTryApp={handleTryApp} />
        <AuthModal
          open={authModalOpen}
          onClose={handleCloseAuth}
          onSignInWithGoogle={signInWithGoogle}
          onSignInWithEmail={signInWithEmail}
          onSignUpWithEmail={signUpWithEmail}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />

      {suspensionInfo && (
        <div className="bg-rose-600 px-4 py-3 text-center text-sm font-medium text-white">
          {suspensionInfo.reason}
          {suspensionInfo.until && ` Hasta el ${suspensionInfo.until}.`}
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-2">
        <div className="overflow-hidden rounded-2xl bg-slate-50">
          <div className={`grid lg:items-stretch ${submitted && scorePercent > 93 ? 'lg:grid-cols-1 max-w-2xl mx-auto w-full' : 'lg:grid-cols-[1.2fr_1fr]'}`}>
            <section className="flex flex-col justify-center space-y-4 p-6 lg:p-8">
              <div className="space-y-4">
                {renderControls()}
                {!submitted ? (
                  <>
                    {mode === 'daily' && dailyDone ? (
                      <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6 text-center">
                        <p className="text-base font-semibold text-emerald-800">{t('dailyDoneTitle')}</p>
                        <p className="mt-1 text-sm text-emerald-600">{t('dailyDoneDesc')}</p>
                        <button onClick={() => { setMode('random'); setDraftMode('random') }}
                          className="mt-4 rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800">
                          {t('goToRandom')}
                        </button>
                      </div>
                    ) : (
                      <PromptInput
                        promptUsuario={promptUsuario}
                        setPromptUsuario={setPromptUsuario}
                        onSubmit={handleSubmit}
                        isLoading={imageStatus === 'loading' || analyzing}
                        disabled={isDisabled}
                        mode={mode}
                        difficulty={imageData?.image_diff ?? difficulty}
                        onTimingChange={setTimingData}
                        paused={imagePreviewOpen}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {analyzing ? (
                      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
                        <p className="mt-4 text-sm text-slate-600">{t('analyzingPrompt')}</p>
                      </div>
                    ) : (
                      <ResultPanel
                        scorePercent={scorePercent}
                        explanation={aiExplanation}
                        suggestions={suggestions}
                        difficulty={imageData?.image_diff ?? difficulty}
                        improvements={improvements}
                        timePenaltyMessage={timePenaltyMessage}
                        recommendedGuideIds={recommendedGuideIds}
                        eloDelta={eloDelta}
                        onRetry={scorePercent !== null && scorePercent < 60 ? handleRetry : undefined}
                      />
                    )}
                  </>
                )}
              </div>
            </section>

            <aside className={`flex flex-col items-stretch justify-center gap-4 p-4 transition-all duration-500 ${submitted && scorePercent > 93 ? 'hidden' : ''}`}>
              <div className="w-full" style={{ height: 'calc(100vh - 120px)' }}>
                <ImageCard
                  mode={mode}
                  data={imageData ?? {}}
                  imageStatus={imageStatus}
                  onPreviewChange={setImagePreviewOpen}
                />
              </div>
            </aside>

          </div>
        </div>
      </main>

      <ConfigModal
        open={configOpen}
        mode={draftMode}
        difficulty={draftDifficulty}
        availableDiffs={availableDiffs}
        onClose={() => setConfigOpen(false)}
        onSave={saveConfig}
        onModeChange={setDraftMode}
        onDifficultyChange={setDraftDifficulty}
      />

      <Footer />
    </div>
  )
}

export default App
