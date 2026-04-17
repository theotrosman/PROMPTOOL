import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import AiExplanation from './components/AiExplanation'
import ConfigModal from './components/ConfigModal'
import ImageCard from './components/ImageCard'
import PromptInput from './components/PromptInput'
import ResultPanel from './components/ResultPanel'
import { comparePrompts } from './services/geminiService'

function App() {
  const [promptUsuario, setPromptUsuario] = useState('')
  const [aiExplanation, setAiExplanation] = useState('')
  const [scorePercent, setScorePercent] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [mode, setMode] = useState('random')
  const [difficulty, setDifficulty] = useState('Media')
  const [tema, setTema] = useState('Ciencia ficción')
  const [configOpen, setConfigOpen] = useState(false)
  const [draftMode, setDraftMode] = useState('random')
  const [draftDifficulty, setDraftDifficulty] = useState('Media')
  const [draftTema, setDraftTema] = useState('Ciencia ficción')
  const [imageData, setImageData] = useState(null)
  const [loadingImage, setLoadingImage] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestions, setSuggestions] = useState('')
  const [error, setError] = useState('')


  useEffect(() => {
    const fetchImageData = async () => {
      try {
        const response = await fetch('/dailyChallenge.json')
        const data = await response.json()
        setImageData(data)
      } catch (error) {
        console.error('Error cargando datos de la imagen:', error)
      } finally {
        setLoadingImage(false)
      }
    }

    fetchImageData()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const submittedPrompt = promptUsuario.trim()
    if (!submittedPrompt) {
      return
    }

    if (!imageData || !imageData.prompt) {
      setError('No se pudo cargar el prompt original. Por favor, recarga la página.')
      return
    }

    setAnalyzing(true)
    setError('')
    setSubmitted(true)

    try {
      const result = await comparePrompts(submittedPrompt, imageData.prompt)
      setScorePercent(result.score)
      setAiExplanation(result.explanation)
      setSuggestions(result.suggestions)
    } catch (err) {
      setError(err.message)
      setScorePercent(0)
      setAiExplanation('Hubo un error al analizar tu prompt.')
      setSuggestions('')
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
    setError('')
    setAnalyzing(false)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-6 rounded-[2rem] bg-white px-4 py-5 shadow-sm sm:px-6">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 text-center sm:flex-row sm:justify-center">
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
          </div>
          <p className="mt-4 text-center text-xs uppercase tracking-[0.32em] text-slate-500">
            Usa el botón Configurar para ajustar modo, dificultad y temática.
          </p>
        </div>

        <div className="overflow-hidden rounded-[2.5rem] bg-slate-50">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <section className="space-y-6 p-6 lg:p-8">
              <div className="space-y-6">
                {!submitted ? (
                  <PromptInput
                    promptUsuario={promptUsuario}
                    setPromptUsuario={setPromptUsuario}
                    onSubmit={handleSubmit}
                    isLoading={loadingImage || analyzing}
                  />
                ) : (
                  <div className="space-y-6">
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
                        <AiExplanation explanation={aiExplanation} />
                        <ResultPanel scorePercent={scorePercent} suggestions={suggestions} />
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
