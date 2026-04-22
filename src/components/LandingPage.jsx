import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useTheme } from '../contexts/ThemeContext'

// Filtra prompts que valgan la pena: >10 palabras y sin contenido inapropiado
const BLOCKED_WORDS = [
  'nude', 'naked', 'porn', 'sex', 'nsfw', 'explicit', 'gore', 'blood',
  'violence', 'kill', 'murder', 'hate', 'racist', 'drug', 'weapon',
  'desnud', 'porno', 'sexo', 'sangre', 'matar', 'odio', 'droga',
]

const isPromptAppropriate = (prompt) => {
  if (!prompt || typeof prompt !== 'string') return false
  const lower = prompt.toLowerCase()
  if (BLOCKED_WORDS.some(w => lower.includes(w))) return false
  const wordCount = prompt.trim().split(/\s+/).length
  return wordCount > 10
}

// Componente de una slide individual
const Slide = ({ item, visible }) => (
  <div
    className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
  >
    {/* Imagen — protegida contra descarga */}
    <div
      className="relative flex-1 overflow-hidden rounded-2xl select-none"
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
    >
      <img
        src={item.url_image}
        alt="Imagen generada por IA"
        className="h-full w-full object-cover pointer-events-none"
        draggable={false}
        loading="lazy"
      />
      {/* Overlay transparente que bloquea interacción directa con la imagen */}
      <div className="absolute inset-0" onContextMenu={e => e.preventDefault()} />
      {/* Overlay degradado inferior */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-950/90 to-transparent" />
    </div>

    {/* Info del usuario y prompt — protegido contra copia */}
    <div
      className="mt-3 space-y-2 px-1 select-none"
      onCopy={e => e.preventDefault()}
    >
      <div className="flex items-center gap-2.5">
        {item.avatar_url ? (
          <img
            src={item.avatar_url}
            alt={item.username || 'Usuario'}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-black/10 pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500/30 text-xs font-bold text-violet-600 ring-1 ring-black/10">
            {(item.username || '?')[0].toUpperCase()}
          </div>
        )}
        <span className="text-xs font-medium text-slate-500">{item.username || 'Anónimo'}</span>
        {item.score != null && (
          <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-600">
            {item.score}%
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-xs leading-5 text-slate-400 italic">
        "{item.prompt_usuario}"
      </p>
    </div>
  </div>
)

// Dots de navegación
const Dots = ({ total, current, onSelect }) => (
  <div className="flex items-center justify-center gap-1.5 pt-1">
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => onSelect(i)}
        aria-label={`Slide ${i + 1}`}
        className={`rounded-full transition-all duration-300 ${
          i === current
            ? 'h-1.5 w-5 bg-violet-400'
            : 'h-1.5 w-1.5 bg-white/20 hover:bg-white/40'
        }`}
      />
    ))}
  </div>
)

const SLIDE_INTERVAL = 4500

const CommunitySlideshow = ({ dark = true }) => {
  const [slides, setSlides] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef(null)

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        // Traer intentos con score alto, prompt del usuario y datos del usuario
        const { data, error } = await supabase
          .from('intentos')
          .select(`
            prompt_usuario,
            puntaje_similitud,
            id_usuario,
            id_imagen,
            imagenes_ia ( url_image ),
            usuarios ( username, avatar_url )
          `)
          .gte('puntaje_similitud', 65)
          .not('prompt_usuario', 'is', null)
          .order('puntaje_similitud', { ascending: false })
          .limit(60)

        if (error || !data) return

        // Filtrar y deduplicar por imagen
        const seen = new Set()
        const eligible = data
          .filter(row => {
            if (!row.imagenes_ia?.url_image) return false
            if (seen.has(row.id_imagen)) return false
            if (!isPromptAppropriate(row.prompt_usuario)) return false
            seen.add(row.id_imagen)
            return true
          })

        // Mezclar aleatoriamente para que cada carga muestre slides distintos
        for (let i = eligible.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [eligible[i], eligible[j]] = [eligible[j], eligible[i]]
        }

        const filtered = eligible
          .slice(0, 8)
          .map(row => ({
            url_image: row.imagenes_ia.url_image,
            prompt_usuario: row.prompt_usuario,
            score: row.puntaje_similitud,
            username: row.usuarios?.username || null,
            avatar_url: row.usuarios?.avatar_url || null,
          }))

        setSlides(filtered)
      } catch (_) {
        // silencioso
      } finally {
        setLoading(false)
      }
    }

    fetchSlides()
  }, [])

  // Auto-avance
  useEffect(() => {
    if (slides.length < 2) return
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length)
    }, SLIDE_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [slides.length])

  const goTo = (i) => {
    clearInterval(timerRef.current)
    setCurrent(i)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % slides.length)
    }, SLIDE_INTERVAL)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
      </div>
    )
  }

  if (slides.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <div className="text-4xl">🎨</div>
        <p className="text-sm text-slate-400">Las mejores jugadas de la comunidad aparecerán acá.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <p className={`mb-3 text-xs uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Comunidad</p>
      <div className="relative flex-1">
        {slides.map((item, i) => (
          <Slide key={i} item={item} visible={i === current} />
        ))}
      </div>
      {slides.length > 1 && (
        <Dots total={slides.length} current={current} onSelect={goTo} />
      )}
    </div>
  )
}

const LandingPage = ({ onOpenAuth, onTryApp }) => {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  return (
    <div className={`min-h-screen ${dark
      ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white'
      : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900'
    }`}>
      {/* Blobs de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-10%] h-96 w-96 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
        <div className={`absolute right-[-10%] top-1/3 h-80 w-80 rounded-full blur-3xl ${dark ? 'bg-cyan-400/10' : 'bg-cyan-400/20'}`} />
        <div className={`absolute left-[-8%] bottom-12 h-72 w-72 rounded-full blur-3xl ${dark ? 'bg-white/5' : 'bg-violet-100/60'}`} />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* ── Columna izquierda ── */}
          <div className="space-y-8">
            <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs ${dark
              ? 'border-white/15 bg-white/5 text-slate-300'
              : 'border-slate-200 bg-white text-slate-500 shadow-sm'
            }`}>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Nuevo desafío cada día
            </span>

            <div className="space-y-4">
              <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                Descifrá el prompt.{' '}
                <span className="text-violet-500">Domina la IA.</span>
              </h1>
              <p className={`max-w-md text-base leading-7 ${dark ? 'text-slate-300/80' : 'text-slate-500'}`}>
                Un juego diario donde recreás el prompt de una imagen generada por IA.
                Recibís score y feedback real para mejorar cada día.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onTryApp}
                className={`inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold shadow-lg transition ${dark
                  ? 'bg-white text-slate-950 hover:bg-slate-100'
                  : 'bg-slate-900 text-white hover:bg-slate-700'
                }`}
              >
                Probar
              </button>
              <button
                type="button"
                onClick={onOpenAuth}
                className={`inline-flex items-center justify-center rounded-full border px-7 py-3 text-sm font-semibold transition ${dark
                  ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
              >
                Iniciar sesión
              </button>
            </div>

            {/* 3 features compactos */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: '🎯', label: 'Juego diario' },
                { icon: '🤖', label: 'Evaluación con IA' },
                { icon: '📈', label: 'Progreso real' },
              ].map(f => (
                <div
                  key={f.label}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border py-4 text-center backdrop-blur-sm ${dark
                    ? 'border-white/10 bg-white/5'
                    : 'border-slate-200 bg-white shadow-sm'
                  }`}
                >
                  <span className="text-xl">{f.icon}</span>
                  <span className={`text-xs font-medium ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Columna derecha: slideshow ── */}
          <div className={`relative overflow-hidden rounded-3xl border p-5 shadow-2xl backdrop-blur-xl lg:h-[520px] ${dark
            ? 'border-white/10 bg-slate-950/60 shadow-slate-950/50'
            : 'border-slate-200 bg-white/80 shadow-slate-200/80'
          }`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,106,255,0.15),_transparent_40%)]" />
            <div className="relative h-full">
              <CommunitySlideshow dark={dark} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default LandingPage
