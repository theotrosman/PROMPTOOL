import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import ConfigModal from './components/ConfigModal'
import ImageCard from './components/ImageCard'
import PromptInput from './components/PromptInput'
import ResultPanel from './components/ResultPanel'
import { comparePrompts } from './services/geminiService'
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
  const { user } = useAuth()
  const { t } = useLang()
  const [promptUsuario, setPromptUsuario] = useState('')
  const [aiExplanation, setAiExplanation] = useState('')
  const [scorePercent, setScorePercent] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [mode, setMode] = useState('daily')
  const [difficulty, setDifficulty] = useState('Medium')
  const [configOpen, setConfigOpen] = useState(false)
  const [draftMode, setDraftMode] = useState('daily')
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
  const [dailyDone, setDailyDone] = useState(false) // ya hizo el diario hoy
  const recommendedGuideIds = getRecommendedGuides(improvements, suggestions)

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

  // Verificar si el usuario ya hizo el modo diario hoy
  useEffect(() => {
    if (!user || mode !== 'daily') { setDailyDone(false); return }
    const checkDaily = async () => {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const { data } = await supabase
        .from('intentos')
        .select('id_intento')
        .eq('id_usuario', user.id)
        .eq('modo', 'daily')
        .gte('fecha_hora', hoy.toISOString())
        .limit(1)
      setDailyDone(!!(data && data.length > 0))
    }
    checkDaily()
  }, [user, mode])

  // Fetch de la imagen activa
  useEffect(() => {
    const fetchImageData = async () => {
      setImageStatus('loading')
      setImageData(null)

      try {
        let query = supabase.from('imagenes_ia').select('*')

        if (mode === 'daily') {
          // Modo diario: imagen más reciente, sin filtros
          query = query.order('fecha', { ascending: false }).limit(1)
        } else {
          // Modo random: filtra solo por dificultad
          if (difficulty) query = query.eq('image_diff', difficulty)
        }

        const { data, error } = await query
        if (error) throw error

        if (!data || data.length === 0) {
          setImageStatus('empty')
          return
        }

        const rows = data.map(normalizeImageData)
        const selected = mode === 'daily'
          ? rows[0]
          : rows[Math.floor(Math.random() * rows.length)]

        setImageData(selected)
        setDifficulty(selected.image_diff ?? 'Medium')
        setImageStatus('ok')
      } catch (err) {
        console.error('[imagenes_ia] Error:', err)
        setImageStatus('error')
      }
    }

    fetchImageData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, difficulty])

  const hasImage = imageStatus === 'ok' && imageData !== null
  const isDisabled = !hasImage || (mode === 'daily' && dailyDone)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const submittedPrompt = promptUsuario.trim()
    if (!submittedPrompt || !hasImage) return

    const promptReferencia = imageData?.prompt_original
    if (!promptReferencia) return

    setAnalyzing(true)
    setSubmitted(true)

    try {
      const result = await comparePrompts(submittedPrompt, promptReferencia, difficulty)
      const timePenalty = getTimePenalty(timingData, difficulty, mode)
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
        }])

      if (dbError) console.error('[intentos] Error al guardar:', dbError.message)
      else if (mode === 'daily') setDailyDone(true)
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

  const saveConfig = () => {
    setMode(draftMode)
    setDifficulty(draftDifficulty)
    setConfigOpen(false)
  }

  const handleReset = () => {
    setPromptUsuario('')
    setAiExplanation('')
    setScorePercent(null)
    setSubmitted(false)
    setSuggestions('')
    setStrengths([])
    setImprovements([])
    setTimingData({ elapsedSeconds: 0, recommendedSeconds: 0, overtimeSeconds: 0 })
    setTimePenaltyMessage('')
    setAnalyzing(false)
  }

  const renderControls = () => (
    <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <button type="button" onClick={openConfig}
        className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
        {t('configure')}
      </button>
      <button type="button" onClick={handleReset}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 17a9 9 0 1 0 4-7.5" /><polyline points="3 10 3 17 10 17" />
        </svg>
        {t('reset')}
      </button>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{t('adjustModeAndDifficulty')}</p>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4">
        <div className="overflow-hidden rounded-[2.5rem] bg-slate-50">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">

            <section className="space-y-6 p-6 lg:p-8">
              <div className="space-y-6">
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
                        difficulty={difficulty}
                        onTimingChange={setTimingData}
                      />
                    )}
                    {renderControls()}
                  </>
                ) : (
                  <div className="space-y-6 rounded-[2rem] border border-slate-200/70 bg-white/60 p-4 sm:p-5">
                    {renderControls()}
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
                        difficulty={difficulty}
                        strengths={strengths}
                        improvements={improvements}
                        timePenaltyMessage={timePenaltyMessage}
                        recommendedGuideIds={recommendedGuideIds}
                      />
                    )}
                  </div>
                )}
              </div>
            </section>

            <aside className="flex flex-col justify-start gap-4 p-6">
              <ImageCard
                mode={mode}
                data={imageData ?? {}}
                imageStatus={imageStatus}
              />
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
