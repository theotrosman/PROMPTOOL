import { useEffect, useMemo, useRef, useState } from 'react'
import GUIDE_LIBRARY from '../data/guides'

const ACCENTS = {
  indigo: { soft: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', pill: 'bg-indigo-100 text-indigo-800' },
  cyan: { soft: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', pill: 'bg-cyan-100 text-cyan-800' },
  violet: { soft: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', pill: 'bg-violet-100 text-violet-800' },
  amber: { soft: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', pill: 'bg-amber-100 text-amber-800' },
  rose: { soft: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', pill: 'bg-rose-100 text-rose-800' },
  emerald: { soft: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', pill: 'bg-emerald-100 text-emerald-800' },
  slate: { soft: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', pill: 'bg-slate-200 text-slate-800' },
  fuchsia: { soft: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', pill: 'bg-fuchsia-100 text-fuchsia-800' },
  orange: { soft: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', pill: 'bg-orange-100 text-orange-800' },
  red: { soft: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', pill: 'bg-red-100 text-red-800' },
  teal: { soft: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', pill: 'bg-teal-100 text-teal-800' },
  blue: { soft: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', pill: 'bg-blue-100 text-blue-800' },
  lime: { soft: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700', pill: 'bg-lime-100 text-lime-800' },
}

const shuffle = (arr) => {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const OrderDnD = ({ guideId, activity, accent = 'slate', onSolved }) => {
  const [pool, setPool] = useState(() => shuffle(activity.items))
  const [slots, setSlots] = useState(() => activity.solution.map(() => null))
  const [dragging, setDragging] = useState(null)
  const a = ACCENTS[accent] || ACCENTS.slate

  useEffect(() => {
    setPool(shuffle(activity.items))
    setSlots(activity.solution.map(() => null))
    setDragging(null)
  }, [guideId, activity.items, activity.solution])

  const isSolved = useMemo(() => slots.every((v, idx) => v === activity.solution[idx]), [slots, activity.solution])

  useEffect(() => {
    if (isSolved) onSolved?.()
  }, [isSolved, onSolved])

  const takeFromPool = (value) => setPool((prev) => prev.filter((v) => v !== value))
  const putBackToPool = (value) => setPool((prev) => [...prev, value])

  const onDragStart = (value, from) => {
    setDragging({ value, from })
  }

  const onDropSlot = (slotIndex) => {
    if (!dragging) return
    setSlots((prev) => {
      const next = [...prev]
      const existing = next[slotIndex]
      if (existing) {
        putBackToPool(existing)
      }
      next[slotIndex] = dragging.value
      return next
    })
    if (dragging.from === 'pool') takeFromPool(dragging.value)
    if (dragging.from?.startsWith('slot:')) {
      const fromIdx = Number(dragging.from.split(':')[1])
      setSlots((prev) => {
        const next = [...prev]
        if (fromIdx !== slotIndex) next[fromIdx] = null
        return next
      })
    }
    setDragging(null)
  }

  const onDropPool = () => {
    if (!dragging) return
    if (dragging.from?.startsWith('slot:')) {
      const fromIdx = Number(dragging.from.split(':')[1])
      setSlots((prev) => {
        const next = [...prev]
        const value = next[fromIdx]
        next[fromIdx] = null
        if (value) putBackToPool(value)
        return next
      })
    }
    setDragging(null)
  }

  return (
    <div className={`rounded-[1.25rem] border bg-white p-4 ${a.border}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${a.text}`}>Actividad</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-900">{activity.title}</h4>
          <p className="mt-1 text-sm text-slate-600">{activity.prompt}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isSolved ? 'bg-emerald-100 text-emerald-800' : a.pill}`}>
          {isSolved ? 'Completado' : 'Arrastra y suelta'}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className={`rounded-xl border p-3 ${a.border} ${a.soft}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Orden</p>
          <div className="mt-2 space-y-2">
            {slots.map((value, idx) => {
              const correct = value ? value === activity.solution[idx] : null
              return (
                <div
                  key={`${guideId}-slot-${idx}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropSlot(idx)}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 transition ${
                    value
                      ? correct
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-white'
                      : 'border-dashed border-slate-200 bg-white/60'
                  }`}
                >
                  <span className="text-xs font-semibold tabular-nums text-slate-400">{String(idx + 1).padStart(2, '0')}</span>
                  <div className="flex-1">
                    {value ? (
                      <div
                        draggable
                        onDragStart={() => onDragStart(value, `slot:${idx}`)}
                        className="cursor-grab rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white active:cursor-grabbing"
                      >
                        {value}
                      </div>
                    ) : (
                      <div className="rounded-lg px-3 py-2 text-sm text-slate-400">Suelta aca</div>
                    )}
                  </div>
                  {value && correct && <span className="text-xs font-semibold text-emerald-700">OK</span>}
                </div>
              )
            })}
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropPool}
          className="rounded-xl border border-slate-200 bg-slate-50 p-3"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Piezas</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {pool.map((item) => (
              <div
                key={`${guideId}-pool-${item}`}
                draggable
                onDragStart={() => onDragStart(item, 'pool')}
                className="cursor-grab rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-px active:cursor-grabbing"
              >
                {item}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Tip: si queres sacar una pieza del orden, arrastrala de vuelta aca.</p>
        </div>
      </div>
    </div>
  )
}

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const useLocalStorageState = (key, initialValue) => {
  const [state, setState] = useState(() => {
    const raw = window.localStorage.getItem(key)
    return raw == null ? initialValue : safeJsonParse(raw, initialValue)
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state))
  }, [key, state])

  return [state, setState]
}

const MiniQuiz = ({ quiz, accent = 'slate', storageKey, onCorrect }) => {
  const a = ACCENTS[accent] || ACCENTS.slate
  const [picked, setPicked] = useLocalStorageState(storageKey, null)
  const isCorrect = picked != null ? picked === quiz.correctIndex : null

  useEffect(() => {
    if (isCorrect) onCorrect?.()
  }, [isCorrect, onCorrect])

  return (
    <div className={`rounded-[1.25rem] border bg-white p-4 ${a.border}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${a.text}`}>Chequeo rapido</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-900">{quiz.question}</h4>
        </div>
        {isCorrect != null && (
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {isCorrect ? 'Correcto' : 'Casi'}
          </div>
        )}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {quiz.options.map((opt, idx) => {
          const chosen = picked === idx
          const correct = quiz.correctIndex === idx
          const stateClass =
            picked == null
              ? 'border-slate-200 bg-slate-50 hover:bg-white'
              : chosen && correct
                ? 'border-emerald-200 bg-emerald-50'
                : chosen && !correct
                  ? 'border-rose-200 bg-rose-50'
                  : correct
                    ? 'border-emerald-200 bg-white'
                    : 'border-slate-200 bg-white/60'

          return (
            <button
              key={opt}
              type="button"
              onClick={() => setPicked(idx)}
              className={`rounded-[1rem] border px-3 py-3 text-left text-sm font-semibold text-slate-800 transition ${stateClass}`}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {picked != null && quiz.explanation && (
        <div className="mt-3 rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Por que</p>
          <p className="mt-1 text-sm text-slate-700">{quiz.explanation}</p>
        </div>
      )}
    </div>
  )
}

const getCompletionKey = (guideId, part) => `__${guideId}__::${part}`

const ParteBuilder = ({ accent = 'slate' }) => {
  const a = ACCENTS[accent] || ACCENTS.slate
  const [persona, setPersona] = useState('Actua como director/a de fotografia')
  const [aim, setAim] = useState('Generar un prompt para una escena clara y realista')
  const [receptores, setReceptores] = useState('Para una imagen estilo editorial')
  const [tono, setTono] = useState('Sobrio y tecnico, con vocabulario visual')
  const [estructura, setEstructura] = useState('Devolve 1 prompt final y una lista breve de negativos')
  const [copied, setCopied] = useState(false)

  const built = `${persona}.\n\nObjetivo: ${aim}.\nReceptores: ${receptores}.\nTono: ${tono}.\nEstructura: ${estructura}.`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(built)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 900)
    } catch {
      // ignore
    }
  }

  return (
    <div className={`rounded-[1.25rem] border bg-white p-4 ${a.border}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${a.text}`}>Constructor</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-900">Arma PARTE en 30 segundos</h4>
          <p className="mt-1 text-sm text-slate-600">Completá campos cortos y te devuelve una versión usable.</p>
        </div>
        <button
          type="button"
          onClick={copy}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${copied ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
        >
          {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <label className="block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Persona</p>
          <input value={persona} onChange={(e) => setPersona(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </label>
        <label className="block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Aim</p>
          <input value={aim} onChange={(e) => setAim(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </label>
        <label className="block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Receptores</p>
          <input value={receptores} onChange={(e) => setReceptores(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </label>
        <label className="block">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Tono</p>
          <input value={tono} onChange={(e) => setTono(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </label>
        <label className="block lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Estructura</p>
          <input value={estructura} onChange={(e) => setEstructura(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </label>
      </div>

      <div className="mt-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Salida</p>
        <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-white px-3 py-3 text-sm text-slate-800">{built}</pre>
      </div>
    </div>
  )
}

const GuidesSection = ({ recommendedGuideIds = [] }) => {
  const recommendedSet = new Set(recommendedGuideIds)
  const [selectedId, setSelectedId] = useState(GUIDE_LIBRARY[0]?.id)
  const [doneMap, setDoneMap] = useLocalStorageState('promptool_guides_done', {})
  const [lessonAckMap, setLessonAckMap] = useLocalStorageState('promptool_guides_lesson_ack', {})
  const [openLessonBlock, setOpenLessonBlock] = useState(null)
  const contentRef = useRef(null)
  const internalHashUpdateRef = useRef(false)
  const sidebarRef = useRef(null)
  const rightHeaderRef = useRef(null)
  const [panelMaxHeight, setPanelMaxHeight] = useState(null)

  const selectFromHash = () => {
    const raw = window.location.hash || ''
    const match = raw.match(/^#guia-(.+)$/)
    const id = match?.[1]
    if (!id) return false
    if (GUIDE_LIBRARY.some((g) => g.id === id)) {
      setSelectedId(id)
      return true
    }
    return false
  }

  const selectGuide = (id) => {
    if (!id || !GUIDE_LIBRARY.some((g) => g.id === id)) return
    setSelectedId((prev) => {
      if (prev === id) return prev
      return id
    })
    const desired = `#guia-${id}`
    if (window.location.hash !== desired) {
      internalHashUpdateRef.current = true
      window.history.replaceState(null, '', desired)
    }
  }

  useEffect(() => {
    const preferred = recommendedGuideIds?.[0]
    if (selectFromHash()) return
    if (preferred) selectGuide(preferred)
  }, [recommendedGuideIds])

  useEffect(() => {
    const onHashChange = () => {
      if (internalHashUpdateRef.current) {
        internalHashUpdateRef.current = false
        return
      }
      selectFromHash()
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    setOpenLessonBlock(null)
  }, [selectedId])

  useEffect(() => {
    if (!sidebarRef.current) return

    const update = () => {
      const rect = sidebarRef.current?.getBoundingClientRect?.()
      if (!rect?.height) return
      const headerRect = rightHeaderRef.current?.getBoundingClientRect?.()
      const headerHeight = headerRect?.height ? Math.floor(headerRect.height) : 0
      const paddingAndGap = 16 /* mt-4 */ + 12 /* inner padding tolerance */
      const available = Math.max(240, Math.floor(rect.height) - headerHeight - paddingAndGap)
      setPanelMaxHeight(available)
    }

    update()

    const ro = new ResizeObserver(() => update())
    ro.observe(sidebarRef.current)
    if (rightHeaderRef.current) ro.observe(rightHeaderRef.current)
    window.addEventListener('resize', update)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [])

  const toggleCheckpoint = (guideId, checkpoint) => {
    const key = `${guideId}::${checkpoint}`
    setDoneMap((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const markDone = (guideId, part) => {
    const key = getCompletionKey(guideId, part)
    setDoneMap((prev) => ({ ...prev, [key]: true }))
  }

  const guideProgress = useMemo(
    () =>
      GUIDE_LIBRARY.reduce((acc, guide) => {
        const checkpointTotal = guide.checkpoints?.length || 0
        const checkpointDone = (guide.checkpoints || []).filter((item) => doneMap[`${guide.id}::${item}`]).length

        const lessonTotal = guide.lesson?.blocks?.length ? 1 : 0
        const lessonDone = lessonAckMap?.[guide.id] ? 1 : 0

        const activityTotal = guide.activity ? 1 : 0
        const activityDone = doneMap[getCompletionKey(guide.id, 'activity')] ? 1 : 0

        const quizTotal = guide.lesson?.quiz ? 1 : 0
        const quizDone = doneMap[getCompletionKey(guide.id, 'quiz')] ? 1 : 0

        const total = checkpointTotal + lessonTotal + activityTotal + quizTotal
        const done = checkpointDone + lessonDone + activityDone + quizDone

        acc[guide.id] = total ? Math.round((done / total) * 100) : 0
        return acc
      }, {}),
    [doneMap, lessonAckMap],
  )

  const selectedGuide = GUIDE_LIBRARY.find((g) => g.id === selectedId) || GUIDE_LIBRARY[0]
  const accent = ACCENTS[selectedGuide?.accent] || ACCENTS.slate
  const selectedProgress = guideProgress[selectedGuide?.id] ?? 0
  const hasLesson = Boolean(selectedGuide?.lesson?.blocks?.length)
  const lessonAcknowledged = Boolean(lessonAckMap[selectedGuide?.id])
  const activityLocked = hasLesson && !lessonAcknowledged

  return (
    <section id="guias" className="mx-auto mt-2 w-full max-w-none px-6 pb-8">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside ref={sidebarRef} className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Biblioteca</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">Guias</h2>
            </div>
            <div className="hidden sm:block text-xs font-semibold text-slate-500">{GUIDE_LIBRARY.length}</div>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-2">
            <nav className="space-y-1">
              {GUIDE_LIBRARY.map((guide) => {
                const isActive = guide.id === selectedGuide?.id
                const isRecommended = recommendedSet.has(guide.id)
                const a = ACCENTS[guide.accent] || ACCENTS.slate
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => selectGuide(guide.id)}
                    className={`guide-nav group relative flex w-full items-start gap-3 rounded-[1.25rem] border px-3 py-3 text-left transition-all duration-300 ${
                      isActive ? `bg-white ${a.border} shadow-sm` : 'border-transparent hover:bg-white/70'
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-3 w-3 flex-shrink-0 rounded-full ring-1 ring-slate-200 ${a.pill}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">{guide.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">{guide.summary}</span>
                      <span className="mt-2 flex items-center gap-2">
                        {isRecommended && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${a.pill}`}>
                            Recomendada
                          </span>
                        )}
                        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {guideProgress[guide.id] ?? 0}%
                        </span>
                      </span>
                    </span>
                    <span
                      className={`absolute inset-y-3 right-3 w-1 rounded-full transition-all duration-300 ${
                        isActive ? `${a.pill}` : 'bg-transparent'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        <section className="flex flex-col rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div ref={rightHeaderRef} className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${accent.text}`}>Guia seleccionada</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-900">{selectedGuide.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{selectedGuide.summary}</p>
            </div>
            <div className="min-w-[220px] rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Progreso</p>
                <p className="text-xs font-semibold text-slate-600">{selectedProgress}%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all duration-500 ease-out"
                  style={{ width: `${selectedProgress}%` }}
                />
              </div>
            </div>
          </div>

          <div
            ref={contentRef}
            style={panelMaxHeight ? { maxHeight: panelMaxHeight } : undefined}
            className="mt-4 flex-1 overflow-auto rounded-[1.5rem] bg-slate-50 p-3"
          >
            {hasLesson && (
              <div className={`rounded-[1.25rem] border bg-white p-4 ${accent.border}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${accent.text}`}>Lección</p>
                    <h4 className="mt-1 text-lg font-semibold text-slate-900">{selectedGuide.lesson.title}</h4>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white">
                    <input
                      type="checkbox"
                      checked={lessonAcknowledged}
                      onChange={(e) =>
                        setLessonAckMap((prev) => ({
                          ...prev,
                          [selectedGuide.id]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-slate-900"
                    />
                    Lei la leccion
                  </label>
                </div>

                <div className="mt-4 grid gap-2">
                  {selectedGuide.lesson.blocks.map((block, idx) => {
                    const key = `${selectedGuide.id}::${block.heading}`
                    const isOpen = openLessonBlock === key
                    return (
                      <div key={block.heading} className="rounded-[1.1rem] border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => setOpenLessonBlock((prev) => (prev === key ? null : key))}
                          className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{block.heading}</p>
                            <p className="mt-1 text-xs text-slate-500">Tarjeta {idx + 1} de {selectedGuide.lesson.blocks.length}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isOpen ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>
                            {isOpen ? 'Cerrar' : 'Abrir'}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4">
                            {block.body && <p className="text-sm leading-relaxed text-slate-700">{block.body}</p>}
                            {block.bullets?.length ? (
                              <ul className="mt-3 space-y-2">
                                {block.bullets.map((b) => (
                                  <li key={b} className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm text-slate-700">
                                    {b}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {selectedGuide.lesson.takeaway && (
                  <div className="mt-3 rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Idea clave</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{selectedGuide.lesson.takeaway}</p>
                  </div>
                )}
              </div>
            )}

            {selectedGuide.id === 'estructura-prompt' && (
              <div className="mt-4">
                <ParteBuilder accent={selectedGuide.accent} />
              </div>
            )}

            {selectedGuide.lesson?.quiz && (
              <div className="mt-4">
                <MiniQuiz
                  quiz={selectedGuide.lesson.quiz}
                  accent={selectedGuide.accent}
                  storageKey={`promptool_quiz_${selectedGuide.id}`}
                  onCorrect={() => markDone(selectedGuide.id, 'quiz')}
                />
              </div>
            )}

            {selectedGuide.activity?.type === 'order' && (
              <div className="mt-4">
                {activityLocked ? (
                  <div className="relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-4">
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px]" />
                    <div className="relative">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actividad bloqueada</p>
                      <p className="mt-1 text-sm text-slate-700">
                        Para jugar, marcá <span className="font-semibold">“Lei la leccion”</span> arriba. La idea es: primero entender, después practicar.
                      </p>
                    </div>
                  </div>
                ) : (
                  <OrderDnD
                    guideId={selectedGuide.id}
                    activity={selectedGuide.activity}
                    accent={selectedGuide.accent}
                    onSolved={() => {
                      markDone(selectedGuide.id, 'activity')
                    }}
                  />
                )}
              </div>
            )}

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pasos</p>
                <ol className="mt-3 space-y-2">
                  {(selectedGuide.steps || []).map((step) => (
                    <li key={step} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Retos</p>
                <ul className="mt-3 space-y-2">
                  {(selectedGuide.drills || []).map((drill) => (
                    <li key={drill} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                      {drill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-3 rounded-[1.25rem] border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Completar</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(selectedGuide.checkpoints || []).map((checkpoint) => {
                  const key = `${selectedGuide.id}::${checkpoint}`
                  const isDone = !!doneMap[key]
                  return (
                    <button
                      type="button"
                      key={checkpoint}
                      onClick={() => toggleCheckpoint(selectedGuide.id, checkpoint)}
                      className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all duration-300 ${
                        isDone
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-800'
                          : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {checkpoint}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  )
}

export default GuidesSection
