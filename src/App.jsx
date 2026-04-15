import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import AiExplanation from './components/AiExplanation'
import ImageCard from './components/ImageCard'
import PromptInput from './components/PromptInput'
import ResultPanel from './components/ResultPanel'

function App() {
  const [promptUsuario, setPromptUsuario] = useState('')
  const [promptOriginal, setPromptOriginal] = useState('')
  const [aiExplanation, setAiExplanation] = useState('')
  const [score, setScore] = useState('—')
  const [submitted, setSubmitted] = useState(false)
  const [dailyChallenge, setDailyChallenge] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDailyChallenge = async () => {
      try {
        const response = await fetch('/dailyChallenge.json')
        const data = await response.json()
        setDailyChallenge(data)
      } catch (error) {
        console.error('Error cargando el desafío diario:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDailyChallenge()
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    const submittedPrompt = promptUsuario.trim()
    if (!submittedPrompt || !dailyChallenge) {
      return
    }

    setPromptOriginal(submittedPrompt)
    setAiExplanation(
      'La IA ha analizado tu prompt y lo adapta para reforzar la atmósfera, la escena y los detalles visuales. De esta manera se prepara un prompt más preciso para generar la imagen diaria.'
    )
    setScore('Pendiente')
    setSubmitted(true)
    setPromptUsuario('')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="overflow-hidden rounded-[2.5rem] bg-slate-50">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <section className="space-y-6 p-6">
              <div className="space-y-2">
                <span className="inline-flex rounded-full border border-slate-200/70 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-500">
                  Desafío diario
                </span>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                  Promptle diario
                </h1>
                <p className="max-w-2xl text-xs leading-6 text-slate-600">
                  Envía tu prompt y recibe una explicación clara de cómo la IA interpreta tu intención. El panel se mantiene limpio, profesional y unificado.
                </p>
              </div>

              <div className="space-y-6">
                {submitted ? (
                  <AiExplanation promptOriginal={promptOriginal} explanation={aiExplanation} />
                ) : (
                  <PromptInput
                    promptUsuario={promptUsuario}
                    setPromptUsuario={setPromptUsuario}
                    onSubmit={handleSubmit}
                    isLoading={loading}
                  />
                )}

                {submitted && <ResultPanel promptOriginal={promptOriginal} score={score} />}
              </div>
            </section>

            <aside className="flex flex-col justify-start gap-4 p-6">
              <ImageCard challenge={dailyChallenge} loading={loading} />
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default App
