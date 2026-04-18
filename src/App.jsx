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


const getTodayIsoDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeChallenges = (payload) => (Array.isArray(payload) ? payload : payload ? [payload] : [])

const resolveDailyChallenge = (challenges = []) => {
  if (!challenges.length) return null
  const today = getTodayIsoDate()
  return challenges.find((item) => item?.date === today) ?? challenges[challenges.length - 1]
}

const getRandomChallenge = (challenges = []) => {
  if (!challenges.length) return null
  const randomIndex = Math.floor(Math.random() * challenges.length)
  return challenges[randomIndex]
}

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

// Asegura que imageData tenga los campos necesarios para la relación en Supabase
const normalizeImageData = (challenge) => {
  if (!challenge) return null
  
  const normalizedImageUrl =
    challenge.imageUrl ||
    challenge.image_url ||
    challenge.image ||
    challenge.url ||
    challenge.imagen ||
    challenge.imagen_url ||
    challenge.imagenUrl ||
    null

  return {
    ...challenge,
    // Campo id_imagen: usar id_imagen si existe, sino usar id
    id_imagen: challenge.id_imagen ?? challenge.id,
    // Campo id_desafio: usar id_desafio si existe, sino null
    id_desafio: challenge.id_desafio ?? null,
    // Mapea el campo de imagen desde distintas columnas posibles
    imageUrl: normalizedImageUrl,
    image: normalizedImageUrl,
    image_url: normalizedImageUrl,
    // Normaliza la temática y dificultad si vienen con diferentes nombres
    tematica: challenge.tematica ?? challenge['temática'] ?? challenge.temática ?? challenge.topic ?? '',
    dificultad: challenge.dificultad ?? challenge.difficulty ?? '',
  }
}

const getFilteredRandomChallenge = (challenges = [], difficulty = '', tema = '') => {
  if (!challenges.length) return null

  const targetDifficulty = normalizeText(difficulty)
  const targetTema = normalizeText(tema)

  const filtered = challenges.filter((c) => {
    const cd = normalizeText(c?.dificultad)
    const ct = normalizeText(c?.tematica)
    const okDifficulty = !targetDifficulty || cd === targetDifficulty
    const okTema = !targetTema || ct === targetTema
    return okDifficulty && okTema
  })

  return getRandomChallenge(filtered.length ? filtered : challenges)
}

const normalizeDifficulty = (difficulty = 'Media') =>
  difficulty
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const formatDuration = (seconds = 0) => {
  const safe = Math.max(0, Math.floor(seconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
}

const getTimePenalty = ({ elapsedSeconds = 0, recommendedSeconds = 0 }, difficulty = 'Media', mode = 'random') => {
  if (!recommendedSeconds || elapsedSeconds <= recommendedSeconds) {
    return { penalty: 0, message: '' }
  }

  const overtimeSeconds = elapsedSeconds - recommendedSeconds
  const overtimeRatio = overtimeSeconds / Math.max(recommendedSeconds, 1)
  const normalizedDifficulty = normalizeDifficulty(difficulty)
  const difficultyFactor = normalizedDifficulty.includes('facil')
    ? 0.85
    : normalizedDifficulty.includes('dificil')
      ? 1.2
      : 1.05
  const modeFactor = mode === 'daily' ? 1.12 : 0.95

  const penalty = Math.min(
    30,
    Math.max(
      4,
      Math.round((overtimeRatio * 22 + overtimeSeconds / 18) * difficultyFactor * modeFactor)
    )
  )

  return {
    penalty,
    message: `Tardaste demasiado (${formatDuration(overtimeSeconds)} extra). Se descontaron ${penalty} puntos por exceder el tiempo recomendado.`,
  }
}

function App() {
  const [promptUsuario, setPromptUsuario] = useState('')
  const [aiExplanation, setAiExplanation] = useState('')
  const [scorePercent, setScorePercent] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [mode, setMode] = useState('daily')
  const [difficulty, setDifficulty] = useState('Media')
  const [tema, setTema] = useState('Ciencia ficción')
  const [configOpen, setConfigOpen] = useState(false)
  const [draftMode, setDraftMode] = useState('daily')
  const [draftDifficulty, setDraftDifficulty] = useState('Media')
  const [draftTema, setDraftTema] = useState('Ciencia ficción')
  const [challenges, setChallenges] = useState([])
  const [imageData, setImageData] = useState(null)
  const [loadingImage, setLoadingImage] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState('')
  const [strengths, setStrengths] = useState([])
  const [improvements, setImprovements] = useState([])
  const [timingData, setTimingData] = useState({ elapsedSeconds: 0, recommendedSeconds: 0, overtimeSeconds: 0 })
  const [timePenaltyMessage, setTimePenaltyMessage] = useState('')
  const [error, setError] = useState('')
  const recommendedGuideIds = getRecommendedGuides(improvements, suggestions)

  useEffect(() => {
    const fetchImageData = async () => {
      try {
        // Pedimos todas las imágenes de tu tabla en Supabase
        const { data, error } = await supabase
          .from('imagenes_ia')
          .select('*')
        
        if (error) throw error
        const normalized = normalizeChallenges(data).map(normalizeImageData)
        setChallenges(normalized)
      } catch (error) {
        console.error('Error cargando datos de Supabase:', error)
        setError('No se pudieron cargar los desafíos desde la base de datos.')
      } finally {
        setLoadingImage(false)
      }
    }

    fetchImageData()
  }, [])

  useEffect(() => {
    if (!challenges.length) return

    const selectedChallenge =
      mode === 'daily'
        ? resolveDailyChallenge(challenges)
        : getFilteredRandomChallenge(challenges, difficulty, tema)
    if (!selectedChallenge) return

    // Normalizar los datos para asegurar que incluya id_imagen e id_desafio
    setImageData(normalizeImageData(selectedChallenge))

    if (mode === 'daily') {
      if (selectedChallenge.dificultad) setDifficulty(selectedChallenge.dificultad)
      if (selectedChallenge.tematica) setTema(selectedChallenge.tematica)
    }
  }, [mode, challenges, difficulty, tema])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const submittedPrompt = promptUsuario.trim()
    
    if (!submittedPrompt) return

    // Ajusté 'imageData.prompt' a 'imageData.prompt_original' si es que así lo pusiste en Supabase
    const promptReferencia = imageData?.prompt_original || imageData?.prompt

    if (!imageData || !promptReferencia) {
      setError('No se pudo cargar el prompt original. Por favor, recarga la página.')
      return
    }

    setAnalyzing(true)
    setError('')
    setSubmitted(true)

    try {
      // 1. Ejecutamos tu lógica actual de comparación con Gemini
      const result = await comparePrompts(submittedPrompt, promptReferencia, difficulty)
      const timePenalty = getTimePenalty(timingData, difficulty, mode)
      const finalScore = Math.max(0, (result.score ?? 0) - timePenalty.penalty)

      // 2. Actualizamos los estados de la interfaz
      setScorePercent(finalScore)
      setAiExplanation(result.explanation)
      setSuggestions(result.suggestions)
      setStrengths(result.strengths ?? [])
      setImprovements(result.improvements ?? [])
      setTimePenaltyMessage(timePenalty.message)

      // 3. ENVIAR A SUPABASE (El nuevo paso)
      // Guardamos el intento para las estadísticas que planeaste
      const { error: dbError } = await supabase
        .from('intentos')
        .insert([
          {
            prompt_usuario: submittedPrompt,
            puntaje_similitud: finalScore,
            // Los campos id_imagen e id_desafio están garantizados por normalizeImageData
            id_imagen: imageData.id_imagen,
            id_desafio: imageData.id_desafio,
            fecha_hora: new Date().toISOString()
          }
        ])

      if (dbError) {
        console.error('Error al guardar el intento en Supabase:', dbError.message)
        // No bloqueamos al usuario si falla el guardado, pero lo logueamos
      }

    } catch (err) {
      setError(err.message)
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
    setDraftTema(tema)
    setConfigOpen(true)
  }

  const closeConfig = () => {
    setConfigOpen(false)
  }

  const saveConfig = () => {
    setMode(draftMode)
    setDifficulty(draftDifficulty)
    setTema(draftTema)
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
    setError('')
    setAnalyzing(false)
  }

  const renderControls = () => (
    <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={openConfig}
        className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
      >
        Configurar
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 17a9 9 0 1 0 4-7.5" />
          <polyline points="3 10 3 17 10 17" />
        </svg>
        Reset
      </button>
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        Ajusta modo, dificultad y temática.
      </p>
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
                    {error && (
                      <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-4">
                        <p className="text-sm text-rose-700">{error}</p>
                      </div>
                    )}
                    <PromptInput
                      promptUsuario={promptUsuario}
                      setPromptUsuario={setPromptUsuario}
                      onSubmit={handleSubmit}
                      isLoading={loadingImage || analyzing}
                      mode={mode}
                      difficulty={difficulty}
                      tema={tema}
                      onTimingChange={setTimingData}
                    />
                    {renderControls()}
                  </>
                ) : (
                  <div className="space-y-6 rounded-[2rem] border border-slate-200/70 bg-white/60 p-4 sm:p-5">
                    {renderControls()}
                    {error && (
                      <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-4">
                        <p className="text-sm text-rose-700">{error}</p>
                      </div>
                    )}
                    {analyzing ? (
                      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
                        <p className="mt-4 text-sm text-slate-600">Analizando tu prompt con IA...</p>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                )}
              </div>
            </section>

            <aside className="flex flex-col justify-start gap-4 p-6">
              <ImageCard mode={mode} data={{ ...imageData, dificultad: difficulty, tematica: tema }} loading={loadingImage} />
            </aside>
          </div>
        </div>
      </main>

      <ConfigModal
        open={configOpen}
        mode={draftMode}
        difficulty={draftDifficulty}
        tema={draftTema}
        onClose={closeConfig}
        onSave={saveConfig}
        onModeChange={setDraftMode}
        onDifficultyChange={setDraftDifficulty}
        onTemaChange={setDraftTema}
      />

      <Footer />
    </div>
  )
}

export default App
