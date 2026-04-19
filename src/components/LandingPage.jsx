import { useLang } from '../contexts/LangContext'

const LandingPage = ({ onOpenAuth, onTryApp }) => {
  const { lang } = useLang()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-12 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-10%] h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute right-[-10%] top-1/3 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute left-[-8%] bottom-12 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.85fr] items-center">
          <div className="space-y-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1 text-sm text-slate-200 shadow-lg shadow-slate-950/20">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              Juega hoy y mejora tus prompts con IA.
            </span>

            <div className="space-y-6">
              <h1 className="max-w-3xl text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Adiviná el prompt. <span className="text-violet-300">Domina la IA.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-200/85">
                PROMPTOOL es un juego diario inspirado en Wordle donde tu misión es recrear el prompt original de una imagen generada por IA.
                Al jugar, recibís score, explicación y sugerencias para que tus prompts sean cada vez más precisos.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onTryApp}
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-950 shadow-xl shadow-white/10 transition hover:bg-slate-100"
              >
                Probar la app
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-slate-900/70 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Iniciar sesión
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white">Juego diario</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Un desafío nuevo cada día para practicar prompts con estilo y precisión.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white">Evaluación con IA</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Feedback realista que valora estilo, detalles y coherencia visual, no solo coincidencias exactas.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-xl">
                <h3 className="text-sm font-semibold text-white">Sin registro inmediato</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Probá la experiencia como invitado y luego guardá tu progreso creando cuenta.
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,106,255,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_30%)]" />
            <div className="relative space-y-6">
              <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-5">
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>PROMPTOOL</span>
                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-violet-200">Nuevo</span>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-slate-950/90 p-4">
                    <p className="text-sm font-semibold text-white">Adiviná el prompt de la imagen</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Escribí tu mejor intento y compará con el prompt original usando IA avanzada.
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/90 p-4">
                    <p className="text-sm font-semibold text-white">Feedback instantáneo</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Recibí score, fortalezas y sugerencias para afinar tu prompt al instante.
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-slate-100">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Qué vas a encontrar</p>
                <div className="mt-4 space-y-4 text-sm leading-6">
                  <p>• Juego diario con una sola imagen nueva cada día.</p>
                  <p>• Modo invitado para probar sin crear cuenta.</p>
                  <p>• Estadísticas y progreso si decidís registrarte.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
