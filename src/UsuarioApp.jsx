import { useEffect, useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import Header from './components/Header'
import Footer from './components/Footer'
import { useAuth } from './hooks/useAuth'
import { useAdmin } from './hooks/useAdmin'
import { useLang } from './contexts/LangContext'
import { supabase } from './supabaseClient'

function getTargetUserId() {
  const params = new URLSearchParams(window.location.search)
  return params.get('id') || null
}

function getTargetUsername() {
  const params = new URLSearchParams(window.location.search)
  return params.get('u') || null
}

function UsuarioApp() {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin } = useAdmin(user?.id)
  const { t, lang } = useLang()
  const targetId = getTargetUserId()
  const targetUsername = getTargetUsername()

  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    totalIntentos: 0, promedioScore: 0, mejorScore: 0,
    peorScore: 0, intentosHoy: 0, intentosEstaSemana: 0,
    porcentajeAprobacion: 0, racha: 0,
  })
  const [recentAttempts, setRecentAttempts] = useState([])
  const [chartData, setChartData] = useState([])
  const [heatmapData, setHeatmapData] = useState({})
  const [topStrengths, setTopStrengths] = useState([])
  const [topImprovements, setTopImprovements] = useState([])
  const [selectedAttempt, setSelectedAttempt] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [editingProfile, setEditingProfile] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [editingStats, setEditingStats] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editedProfile, setEditedProfile] = useState({})
  const [editedBio, setEditedBio] = useState('')
  const [editedStats, setEditedStats] = useState({})
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const hasRedirected = useRef(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Esperar a que auth resuelva
    if (authLoading) return

    // Sin ?id= y sin ?u= y sin sesión → home
    if (!targetId && !targetUsername && !user) {
      if (!hasRedirected.current) {
        hasRedirected.current = true
        window.location.href = '/'
      }
      return
    }

    const run = async () => {
      // Si hay username en URL, resolver a id primero
      const resolveId = async () => {
        if (targetUsername) {
          const { data } = await supabase
            .from('usuarios')
            .select('id_usuario')
            .ilike('username', targetUsername)
            .maybeSingle()
          return data?.id_usuario || null
        }
        return targetId || user?.id || null
      }

      const idToLoad = await resolveId()
      if (!idToLoad) { setNotFound(true); setLoadingData(false); return }

      const fetchData = async () => {
      setLoadingData(true)
      try {
        // Intentar con columnas completas primero
        let prof = null
        const { data: profFull, error: profError } = await supabase
          .from('usuarios')
          .select('id_usuario, nombre, nombre_display, email, bio, avatar_url, adminstate, fecha_registro, total_intentos, promedio_score, mejor_score, peor_score, porcentaje_aprobacion, racha_actual')
          .eq('id_usuario', idToLoad)
          .maybeSingle()

        if (profError) {
          // Columnas nuevas no existen aún — fallback a columnas básicas
          console.warn('Usando columnas básicas:', profError.message)
          const { data: profBasic } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, email, adminstate, fecha_registro')
            .eq('id_usuario', idToLoad)
            .maybeSingle()
          prof = profBasic
        } else {
          prof = profFull
        }

        if (!prof) {
          setNotFound(true)
          return
        }

        setProfile(prof)

        const ownProfile =
  (!targetId && !targetUsername && !!user) ||
  (targetId && user && targetId === user.id)

        // Cargar intentos — RLS permite leer solo los propios, admin puede leer todos
        if (ownProfile || isAdmin || !targetId) {
          const { data: intentos, error: intentosError } = await supabase
            .from('intentos')
.select('puntaje_similitud, fecha_hora, prompt_usuario, id_imagen, strengths, improvements, imagenes_ia(url_image, prompt_original, image_diff)')            .order('fecha_hora', { ascending: false })

          console.log('[intentos] data:', intentos?.length, 'error:', intentosError?.message)

          if (intentos && intentos.length > 0) {
            const total = intentos.length
            const scores = intentos.map(i => i.puntaje_similitud || 0)
            const promedio = Math.round(scores.reduce((s, v) => s + v, 0) / total)
            const mejor = Math.max(...scores)
            const peor = Math.min(...scores)
            const aprobados = intentos.filter(i => (i.puntaje_similitud || 0) >= 60).length
            const porcentajeAprobacion = Math.round((aprobados / total) * 100)

            const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
            const intentosHoy = intentos.filter(i => new Date(i.fecha_hora) >= hoy).length
            const inicioSemana = new Date()
            inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay())
            inicioSemana.setHours(0, 0, 0, 0)
            const intentosEstaSemana = intentos.filter(i => new Date(i.fecha_hora) >= inicioSemana).length

            let racha = 0
            const fechasUnicas = [...new Set(intentos.map(i => {
              const d = new Date(i.fecha_hora)
              return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            }))]
            const hoyStr = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`
            if (fechasUnicas.includes(hoyStr)) {
              racha = 1
              for (let i = 1; i < 365; i++) {
                const dia = new Date(hoy); dia.setDate(dia.getDate() - i)
                const diaStr = `${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`
                if (fechasUnicas.includes(diaStr)) racha++; else break
              }
            }

            setStats({ totalIntentos: total, promedioScore: promedio, mejorScore: mejor, peorScore: peor, intentosHoy, intentosEstaSemana, porcentajeAprobacion, racha })
            setRecentAttempts(intentos.slice(0, 10))

            // Top strengths/improvements de los últimos 5 intentos
            const last5 = intentos.slice(0, 5)
            const allStrengths = last5.flatMap(i => i.strengths || [])
            const allImprovements = last5.flatMap(i => i.improvements || [])
            // Contar frecuencia y tomar los más repetidos
            const countMap = (arr) => {
              const map = {}
              arr.forEach(s => { map[s] = (map[s] || 0) + 1 })
              return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([k]) => k)
            }
            setTopStrengths(countMap(allStrengths).slice(0, 4))
            setTopImprovements(countMap(allImprovements).slice(0, 4))

            // Datos para el gráfico de área (últimos 20 intentos, orden cronológico)
            const last20 = intentos.slice(0, 20).reverse()
            setChartData(last20.map((i, idx) => ({
              n: idx + 1,
              score: i.puntaje_similitud || 0,
              fecha: new Date(i.fecha_hora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            })))

            // Heatmap: contar intentos por día (últimos 365 días)
            const map = {}
            intentos.forEach(i => {
              const d = new Date(i.fecha_hora)
              const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
              map[key] = (map[key] || 0) + 1
            })
            setHeatmapData(map)

            if (ownProfile) {
              await supabase.from('usuarios').update({
                total_intentos: total, promedio_score: promedio, mejor_score: mejor,
                peor_score: peor, porcentaje_aprobacion: porcentajeAprobacion, racha_actual: racha,
              }).eq('id_usuario', idToLoad)
            }
          } else {
            setStats({
              totalIntentos: prof.total_intentos || 0,
              promedioScore: prof.promedio_score || 0,
              mejorScore: prof.mejor_score || 0,
              peorScore: prof.peor_score || 0,
              intentosHoy: 0, intentosEstaSemana: 0,
              porcentajeAprobacion: prof.porcentaje_aprobacion || 0,
              racha: prof.racha_actual || 0,
            })
          }
        } else {
          setStats({
            totalIntentos: prof.total_intentos || 0,
            promedioScore: prof.promedio_score || 0,
            mejorScore: prof.mejor_score || 0,
            peorScore: prof.peor_score || 0,
            intentosHoy: 0, intentosEstaSemana: 0,
            porcentajeAprobacion: prof.porcentaje_aprobacion || 0,
            racha: prof.racha_actual || 0,
          })
        }
      } catch (err) {
        console.error('fetchData error:', err)
      } finally {
        setLoadingData(false)   
      }
    }

      fetchData()
    }

    run()
}, [authLoading, user?.id, targetId, targetUsername, isAdmin])
  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { alert('La imagen debe ser menor a 2MB'); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null
    setUploadingAvatar(true)
    try {
      // Asegurarse de que el bucket existe (lo crea si no existe)
      await supabase.storage.createBucket('avatars', { public: true }).catch(() => {})

      const ext = avatarFile.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      return data.publicUrl
    } catch (err) {
      alert('Error al subir imagen: ' + err.message)
      return null
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const updates = {}
      if (editedProfile.nombre_display !== undefined) updates.nombre_display = editedProfile.nombre_display

      // Si hay archivo nuevo, subirlo primero
      if (avatarFile) {
        const url = await uploadAvatar()
        if (url) updates.avatar_url = url + '?t=' + Date.now() // cache bust
      } else if (editedProfile.avatar_url !== undefined) {
        updates.avatar_url = editedProfile.avatar_url
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('usuarios').update(updates).eq('id_usuario', user.id)
        if (error) throw error

        // Sincronizar nombre y avatar al metadata de auth para que el header los muestre
        const metaUpdates = {}
        if (updates.nombre_display) metaUpdates.nombre = updates.nombre_display
        if (updates.avatar_url) metaUpdates.avatar_url = updates.avatar_url
        if (Object.keys(metaUpdates).length > 0) {
          await supabase.auth.updateUser({ data: metaUpdates })
        }

        setProfile(p => ({ ...p, ...updates }))
      }

      setAvatarFile(null)
      setAvatarPreview(null)
      setEditingProfile(false)
    } catch (err) {
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveBio = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('usuarios').update({ bio: editedBio }).eq('id_usuario', user.id)
      if (error) throw error
      setProfile(p => ({ ...p, bio: editedBio }))
      setEditingBio(false)
    } catch (err) {
      alert('Error al guardar bio: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const saveStats = async () => {
    setSaving(true)
    const idToLoad = targetId || user?.id
    try {
      const ns = {
        total_intentos: parseInt(editedStats.totalIntentos) || 0,
        promedio_score: parseInt(editedStats.promedioScore) || 0,
        mejor_score: parseInt(editedStats.mejorScore) || 0,
        peor_score: parseInt(editedStats.peorScore) || 0,
        porcentaje_aprobacion: parseInt(editedStats.porcentajeAprobacion) || 0,
        racha_actual: parseInt(editedStats.racha) || 0,
      }
      const { error } = await supabase.from('usuarios').update(ns).eq('id_usuario', idToLoad)
      if (error) throw error
      setStats(s => ({ ...s, totalIntentos: ns.total_intentos, promedioScore: ns.promedio_score, mejorScore: ns.mejor_score, peorScore: ns.peor_score, porcentajeAprobacion: ns.porcentaje_aprobacion, racha: ns.racha_actual }))
      setEditingStats(false)
    } catch (err) {
      alert('Error al guardar stats: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const copyProfileLink = () => {
    const base = window.location.origin
    const url = profile?.username
      ? `${base}/user/${profile.username}`
      : `${base}/perfil?id=${targetId || user?.id}`
    navigator.clipboard.writeText(url)
  }

  const getDisplayName = () => profile?.nombre_display || profile?.nombre || profile?.email?.split('@')[0] || 'Usuario'
  // Solo usar el avatar del perfil cargado — nunca el del usuario logueado
  const getAvatar = () => profile?.avatar_url || null
  const getScoreColor = (s) => s >= 70 ? 'text-emerald-600' : s >= 50 ? 'text-amber-500' : 'text-rose-500'
  const getScoreBg = (s) => s >= 70 ? 'bg-emerald-50 border-emerald-200' : s >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'
  const formatDate = (d) => new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  // ownProfile: true solo si no hay parámetro en URL, o si el parámetro coincide con el usuario logueado
  const ownProfile =
  (!targetId && !targetUsername && !!user) ||
  (targetId && user && targetId === user.id) // con parámetro → comparar IDs
  const canEdit = ownProfile && !!user

  // ── Bio collapsible ──
  const BioCollapsible = ({ bio }) => {
    const [expanded, setExpanded] = useState(false)
    const isLong = bio.length > 300
    return (
      <div>
        <div className={`prose prose-sm prose-slate max-w-none text-slate-700 overflow-hidden transition-all duration-300 ${!expanded && isLong ? 'max-h-24 [mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{bio}</ReactMarkdown>
        </div>
        {isLong && (
          <button onClick={() => setExpanded(e => !e)}
            className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
            {expanded ? t('readLess') : t('readMore')}
          </button>
        )}
      </div>
    )
  }

  // ── Heatmap component ──
  const ActivityHeatmap = ({ data, allAttempts }) => {
    const { t, lang } = useLang()
    const scrollRef = useRef(null)
    const [tooltip, setTooltip] = useState(null) // { key, count, x, y, dayAttempts }
    const [expandedDay, setExpandedDay] = useState(null)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const days = []
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
      days.push({ date: d, key, count: data[key] || 0 })
    }

    // Scroll al final al montar
    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
      }
    }, [])

    const firstDay = days[0].date.getDay()
    const paddedDays = [...Array(firstDay).fill(null), ...days]
    const weeks = []
    for (let i = 0; i < paddedDays.length; i += 7) weeks.push(paddedDays.slice(i, i + 7))

    const getStyle = (count) => {
      if (count === 0) return { backgroundColor: 'var(--heatmap-empty)' }
      if (count === 1) return { backgroundColor: '#818cf8' }
      if (count === 2) return { backgroundColor: '#6366f1' }
      if (count <= 4) return { backgroundColor: '#4f46e5' }
      return { backgroundColor: '#3730a3' }
    }

    const totalYear = days.reduce((s, d) => s + d.count, 0)

    const monthLabels = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const firstReal = week.find(d => d !== null)
      if (firstReal) {
        const m = firstReal.date.getMonth()
        if (m !== lastMonth) {
          monthLabels.push({ wi, label: firstReal.date.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short' }) })
          lastMonth = m
        }
      }
    })

    const dayLabels = lang === 'en'
      ? ['Sun', '', 'Tue', '', 'Thu', '', 'Sat']
      : ['Dom', '', 'Mar', '', 'Jue', '', 'Sáb']

    const legendColors = ['var(--heatmap-empty)', '#818cf8', '#6366f1', '#4f46e5', '#3730a3']

    // Intentos agrupados por día para el tooltip
    const attemptsByDay = {}
    if (allAttempts) {
      allAttempts.forEach(a => {
        const d = new Date(a.fecha_hora)
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        if (!attemptsByDay[key]) attemptsByDay[key] = []
        attemptsByDay[key].push(a)
      })
    }

    const getScoreColor = (s) => s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 relative">
        <style>{`
          html.dark .heatmap-wrap { --heatmap-empty: #334155; }
          html:not(.dark) .heatmap-wrap { --heatmap-empty: #e2e8f0; }
        `}</style>
        <div className="heatmap-wrap">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">
              {totalYear} {totalYear === 1 ? t('attempt') : t('attempts')} {t('activityLastYear')}
            </p>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <span>{lang === 'en' ? 'Less' : 'Menos'}</span>
              {legendColors.map((c, i) => (
                <div key={i} style={{ backgroundColor: c, width: 11, height: 11, borderRadius: 3 }} />
              ))}
              <span>{lang === 'en' ? 'More' : 'Más'}</span>
            </div>
          </div>

          <div ref={scrollRef} className="overflow-x-auto">
            <div className="inline-flex gap-0.5">
              <div className="flex flex-col gap-0.5 mr-1">
                <div className="h-4" />
                {dayLabels.map((l, i) => (
                  <div key={i} className="h-3 w-6 text-[9px] text-slate-400 flex items-center">{l}</div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex gap-0.5 mb-1 h-4">
                  {weeks.map((_, wi) => {
                    const lbl = monthLabels.find(m => m.wi === wi)
                    return <div key={wi} className="w-3 text-[9px] text-slate-400 whitespace-nowrap">{lbl ? lbl.label : ''}</div>
                  })}
                </div>
                <div className="flex gap-0.5">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-0.5">
                      {week.map((day, di) => (
                        <div
                          key={di}
                          style={day ? getStyle(day.count) : { backgroundColor: 'transparent' }}
                          className="h-3 w-3 rounded-sm transition-colors cursor-pointer relative"
                          onMouseEnter={(e) => {
                            if (!day || day.count === 0) return
                            const rect = e.currentTarget.getBoundingClientRect()
                            setTooltip({
                              key: day.key,
                              count: day.count,
                              dayAttempts: attemptsByDay[day.key] || [],
                              x: rect.left + window.scrollX,
                              y: rect.top + window.scrollY,
                            })
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          onClick={() => {
                            if (!day || day.count === 0) return
                            setExpandedDay(expandedDay === day.key ? null : day.key)
                          }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tooltip flotante */}
          {tooltip && (
            <div
              className="fixed z-[500] pointer-events-none"
              style={{ left: tooltip.x + 16, top: tooltip.y - 8 }}
            >
              <div className="rounded-xl border border-slate-200 bg-white shadow-xl p-3 min-w-[180px] max-w-[240px]">
                <p className="text-xs font-semibold text-slate-700 mb-2">
                  {tooltip.key} · {tooltip.count} {tooltip.count === 1 ? t('attempt') : t('attempts')}
                </p>
                <div className="space-y-1.5">
                  {tooltip.dayAttempts.slice(0, 5).map((a, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: getScoreColor(a.puntaje_similitud) }}>
                        {a.puntaje_similitud}%
                      </span>
                      <span className="text-xs text-slate-500 truncate flex-1">{a.prompt_usuario}</span>
                    </div>
                  ))}
                  {tooltip.dayAttempts.length > 5 && (
                    <p className="text-xs text-slate-400">+{tooltip.dayAttempts.length - 5} más</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Panel expandido al hacer click en un día */}
          {expandedDay && attemptsByDay[expandedDay] && (
            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-indigo-700">{expandedDay}</p>
                <button onClick={() => setExpandedDay(null)} className="text-xs text-indigo-400 hover:text-indigo-700">✕</button>
              </div>
              <div className="space-y-1.5">
                {attemptsByDay[expandedDay].map((a, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 border border-indigo-100">
                    <span className="text-sm font-bold shrink-0" style={{ color: getScoreColor(a.puntaje_similitud) }}>
                      {a.puntaje_similitud}%
                    </span>
                    <span className="text-xs text-slate-600 truncate flex-1">{a.prompt_usuario}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {new Date(a.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
console.log('🔍 RENDER STATE:')
  if (authLoading || loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-2xl font-bold text-slate-800">{t('userNotFound')}</p>
          <a href="/" className="text-sm text-slate-500 hover:text-slate-800 underline">{t('backHome')}</a>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">

          {/* Sidebar */}
          <aside className="w-full lg:w-72 shrink-0 space-y-4">
            <div className="flex flex-col items-center lg:items-start gap-3">
              <div className="relative">
                <div className="h-[260px] w-[260px] overflow-hidden rounded-full border-4 border-slate-200 bg-slate-100 flex items-center justify-center">
                  {(avatarPreview || getAvatar()) ? (
                    <img src={avatarPreview || getAvatar()} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-7xl font-bold text-slate-400">
                      {getDisplayName().substring(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                {profile?.adminstate && (
                  <span className="absolute bottom-3 right-3 rounded-full bg-purple-600 px-2.5 py-0.5 text-xs font-bold text-white shadow">
                    ADMIN
                  </span>
                )}
                {/* Botón de cambiar foto — solo en modo edición */}
                {editingProfile && canEdit && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <span className="text-white text-sm font-semibold">{t('editProfile')}</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileChange}
                />
              </div>

              {editingProfile ? (
                <div className="w-full space-y-2">
                  <input type="text" placeholder={t('visibleName')}
                    value={editedProfile.nombre_display ?? getDisplayName()}
                    onChange={e => setEditedProfile(p => ({ ...p, nombre_display: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                  >
                    {avatarFile ? `${t('fileSelected')} ${avatarFile.name}` : t('uploadPhoto')}
                  </button>
                  {uploadingAvatar && <p className="text-xs text-slate-400 text-center">{t('uploading')}</p>}
                  <div className="flex gap-2">
                    <button onClick={saveProfile} disabled={saving || uploadingAvatar}
                      className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                      {saving ? t('saving') : t('save')}
                    </button>
                    <button onClick={() => { setEditingProfile(false); setAvatarFile(null); setAvatarPreview(null) }}
                      className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <h1 className="text-2xl font-bold text-slate-900">{getDisplayName()}</h1>
                  {profile?.username && (
                    <p className="text-sm font-medium text-slate-400">@{profile.username}</p>
                  )}
                  <p className="text-sm text-slate-500">{profile?.email}</p>
                  {canEdit && (
                    <button onClick={() => { setEditingProfile(true); setEditedProfile({}) }}
                      className="mt-2 w-full rounded-lg border border-slate-300 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                      {t('editProfile')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="border-t border-slate-100 pt-4">
              {editingBio ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bio</p>
                  <textarea rows={6} value={editedBio}
                    onChange={e => setEditedBio(e.target.value)}
                    placeholder={lang === 'en' ? 'Write your bio in Markdown...' : 'Escribe tu bio en Markdown...'}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:border-slate-400"
                  />
                  <div className="flex gap-2">
                    <button onClick={saveBio} disabled={saving}
                      className="flex-1 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                      {saving ? t('saving') : t('save')}
                    </button>
                    <button onClick={() => setEditingBio(false)}
                      className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {profile?.bio ? (
                    <BioCollapsible bio={profile.bio} />
                  ) : (
                    canEdit && <p className="text-sm text-slate-400 italic">{t('noBio')}</p>
                  )}
                  {canEdit && (
                    <button onClick={() => { setEditingBio(true); setEditedBio(profile?.bio || '') }}
                      className="mt-2 text-xs text-slate-500 hover:text-slate-800 underline">
                      {profile?.bio ? t('editBio') : t('addBio')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="border-t border-slate-100 pt-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{t('memberSince')} {new Date(profile?.fecha_registro).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'long', year: 'numeric' })}</span>
              </div>
              {stats.racha > 0 && (
                <div className="flex items-center gap-2">
                  <img src="/media/fireicon.png" alt="racha" className="h-4 w-4 object-contain" />
                  <span>{stats.racha} {stats.racha === 1 ? t('streakDay') : t('streak')}</span>
                </div>
              )}
            </div>

            <button onClick={copyProfileLink}
              className="w-full rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition flex items-center justify-center gap-2">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t('copyProfileLink')}
            </button>
          </aside>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Header stats */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Estadísticas</h2>
              {isAdmin && !editingStats && (
                <button onClick={() => { setEditingStats(true); setEditedStats({ ...stats }) }}
                  className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition">
                  Editar stats
                </button>
              )}
              {isAdmin && editingStats && (
                <div className="flex gap-2">
                  <button onClick={saveStats} disabled={saving}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                    {saving ? '...' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditingStats(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    Cancelar
                  </button>
                </div>
              )}
            </div>

            {/* Tarjetas principales con radial */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Promedio', value: stats.promedioScore, suffix: '%', key: 'promedioScore', stroke: '#6366f1' },
                { label: 'Mejor score', value: stats.mejorScore, suffix: '%', key: 'mejorScore', stroke: '#10b981' },
                { label: 'Aprobación', value: stats.porcentajeAprobacion, suffix: '%', key: 'porcentajeAprobacion', stroke: '#f59e0b' },
                { label: 'Intentos', value: stats.totalIntentos, suffix: '', key: 'totalIntentos', stroke: '#64748b', max: Math.max(stats.totalIntentos, 1) },
              ].map(({ label, value, suffix, key, stroke, max = 100 }) => {
                const pct = Math.min(100, Math.round((value / max) * 100))
                const radialData = [{ value: pct, fill: stroke }]
                return (
                  <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-center gap-1">
                    <p className="text-xs font-medium text-slate-500 self-start">{label}</p>
                    {editingStats ? (
                      <input type="number" min="0" max={suffix === '%' ? 100 : undefined}
                        value={editedStats[key] ?? value}
                        onChange={e => setEditedStats(s => ({ ...s, [key]: e.target.value }))}
                        className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-xl font-bold"
                      />
                    ) : (
                      <div className="relative w-20 h-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%" cy="50%"
                            innerRadius="65%" outerRadius="100%"
                            startAngle={90} endAngle={-270}
                            data={radialData}
                            barSize={8}
                          >
                            <RadialBar background={{ fill: '#f1f5f9' }} dataKey="value" cornerRadius={6} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-base font-bold text-slate-800">{value}{suffix}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Stats secundarias en fila */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">Hoy</p>
                <p className="text-xl font-bold text-slate-800">{stats.intentosHoy}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">Esta semana</p>
                <p className="text-xl font-bold text-slate-800">{stats.intentosEstaSemana}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                <p className="text-xs text-slate-500">Peor score</p>
                <p className={`text-xl font-bold ${getScoreColor(stats.peorScore)}`}>{stats.peorScore}%</p>
              </div>
            </div>

            {/* Fortalezas y debilidades (últimos 5 intentos) */}
            {(topStrengths.length > 0 || topImprovements.length > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {topStrengths.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-2">Puntos fuertes recientes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topStrengths.map((s, i) => (
                        <span key={i} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {topImprovements.length > 0 && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 mb-2">A mejorar</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topImprovements.map((s, i) => (
                        <span key={i} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-rose-800 ring-1 ring-rose-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Gráfico de evolución */}
            {chartData.length > 1 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Evolución de scores</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 12 }}
                      formatter={(v) => [`${v}%`, 'Score']}
                      labelFormatter={(l) => `Fecha: ${l}`}
                    />
                    <Area
                      type="monotone" dataKey="score"
                      stroke="#6366f1" strokeWidth={2}
                      fill="url(#scoreGrad)" dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Heatmap de actividad */}
            <ActivityHeatmap data={heatmapData} allAttempts={recentAttempts} />

            {(ownProfile || isAdmin) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-slate-800">
                    {t('resolutionHistory')}
                  </h2>
                  <span className="text-xs text-slate-400">
                    {t('today')}: {stats.intentosHoy} · {t('thisWeek')}: {stats.intentosEstaSemana}
                  </span>
                </div>

                {recentAttempts.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-[2fr_1fr_auto] gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <span>{t('yourPrompt')}</span>
                      <span>{lang === 'en' ? 'Date' : 'Fecha'}</span>
                      <span className="text-right">{t('similarity')}</span>
                    </div>

                    {recentAttempts.map((attempt, i) => (
                      <div key={i}>
                        <button
                          onClick={() => setSelectedAttempt(selectedAttempt === i ? null : i)}
                          className={`w-full grid grid-cols-[2fr_1fr_auto] gap-3 items-center px-4 py-2.5 text-left transition border-b border-slate-100 last:border-0 ${
                            selectedAttempt === i ? 'bg-indigo-50' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <p className="truncate text-sm text-slate-700">{attempt.prompt_usuario || '—'}</p>
                          <p className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(attempt.fecha_hora).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short', day: 'numeric' })}
                          </p>
                          <div className="flex items-center gap-2 justify-end">
                            {attempt.imagenes_ia?.image_diff && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400 hidden sm:inline">
                                {attempt.imagenes_ia.image_diff}
                              </span>
                            )}
                            <span className={`text-sm font-bold w-12 text-right ${
                              attempt.puntaje_similitud >= 70 ? 'text-emerald-600' :
                              attempt.puntaje_similitud >= 50 ? 'text-amber-500' : 'text-rose-500'
                            }`}>
                              {attempt.puntaje_similitud}%
                            </span>
                            <svg className={`h-3.5 w-3.5 text-slate-300 transition-transform ${selectedAttempt === i ? 'rotate-180' : ''}`}
                              fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {/* Detalle expandido — compacto */}
                        {selectedAttempt === i && (
                          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-4">
                              {attempt.imagenes_ia?.url_image && (
                                <img src={attempt.imagenes_ia.url_image} alt=""
                                  className="h-20 w-20 shrink-0 rounded-lg object-cover border border-slate-200" />
                              )}
                              <div className="flex-1 min-w-0 space-y-2">
                                <div>
                                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t('yourPrompt')}</p>
                                  <p className="text-xs text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-200 line-clamp-2">
                                    {attempt.prompt_usuario}
                                  </p>
                                </div>
                                {attempt.imagenes_ia?.prompt_original && (
                                  <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{t('originalPrompt')}</p>
                                    <p className="text-xs text-slate-600 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200 line-clamp-2">
                                      {attempt.imagenes_ia.prompt_original}
                                    </p>
                                  </div>
                                )}
                                <div className="h-1.5 rounded-full bg-slate-200">
                                  <div className={`h-full rounded-full ${
                                    attempt.puntaje_similitud >= 70 ? 'bg-emerald-500' :
                                    attempt.puntaje_similitud >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} style={{ width: `${attempt.puntaje_similitud}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                    <p className="text-slate-500 text-sm">{t('noAttempts')}</p>
                    {ownProfile && (
                      <a href="/" className="mt-3 inline-block rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700">
                        {t('firstAttempt')}
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default UsuarioApp
