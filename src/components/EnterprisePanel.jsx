import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../contexts/LangContext'
import Header from './Header'
import Footer from './Footer'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const EnterprisePanel = ({ user }) => {
  const { lang } = useLang()
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('tab') || 'dashboard'
  })
  const [companyData, setCompanyData] = useState(null)
  const [teamUsers, setTeamUsers] = useState([])
  const [enterpriseRequests, setEnterpriseRequests] = useState([])
  const [enterpriseLoadingRequests, setEnterpriseLoadingRequests] = useState(false)
  const [enterpriseActionStatus, setEnterpriseActionStatus] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState('')
  const [challengeModalOpen, setChallengeModalOpen] = useState(false)
  const [creatingChallenge, setCreatingChallenge] = useState(false)
  const [challengeStatus, setChallengeStatus] = useState(null)
  const [challengeForm, setChallengeForm] = useState({
    prompt: '',
    difficulty: 'Medium',
    theme: '',
  })
  const [challengeImageFile, setChallengeImageFile] = useState(null)
  const [challengeImagePreview, setChallengeImagePreview] = useState(null)
  const [loading, setLoading] = useState(true)
  // Gestión de miembros
  const [confirmRemove, setConfirmRemove] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [editingName, setEditingName] = useState(null)
  const [savingName, setSavingName] = useState(false)
  // Settings
  const [settingsForm, setSettingsForm] = useState({
    company_name: '',
    bio: '',
    website: '',
    allowed_diffs: ['Easy', 'Medium', 'Hard'],
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsStatus, setSettingsStatus] = useState(null)
  // Cancelar invitación
  const [cancellingId, setCancellingId] = useState(null)
  const [copyLinkStatus, setCopyLinkStatus] = useState(null) // null | 'copied'
  // Analytics de progreso
  const [teamProgressData, setTeamProgressData] = useState([]) // intentos del equipo agrupados por día
  // Desafíos
  const [challenges, setChallenges] = useState([])
  const [loadingChallenges, setLoadingChallenges] = useState(false)
  // Intentos por desafío
  const [challengeAttempts, setChallengeAttempts] = useState({}) // { id_imagen: [intentos] }
  const [loadingAttempts, setLoadingAttempts] = useState(false)
  const [expandedChallenge, setExpandedChallenge] = useState(null) // id_imagen expandido
  const [expandedMember, setExpandedMember] = useState(null)       // { challengeId, userId }

  const fetchChallenges = async () => {
    if (!companyData?.id_usuario) return
    setLoadingChallenges(true)
    try {
      const { data, error } = await supabase
        .from('imagenes_ia')
        .select('id_imagen, url_image, image_diff, image_theme, fecha, prompt_original')
        .eq('company_id', companyData.id_usuario)
        .order('fecha', { ascending: false })
      if (error) throw error
      setChallenges(data || [])
    } catch (err) {
      console.error('Error fetching challenges:', err)
    } finally {
      setLoadingChallenges(false)
    }
  }

  const fetchChallengeAttempts = async () => {
    if (!companyData?.id_usuario || challenges.length === 0 || teamUsers.length === 0) return
    setLoadingAttempts(true)
    try {
      const challengeIds = challenges.map(c => c.id_imagen)
      const memberIds = teamUsers.map(m => m.id_usuario)

      const { data, error } = await supabase
        .from('intentos')
        .select('id_intento, id_usuario, id_imagen, puntaje_similitud, prompt_usuario, strengths, improvements, fecha_hora, modo')
        .in('id_imagen', challengeIds)
        .in('id_usuario', memberIds)
        .order('fecha_hora', { ascending: false })

      if (error) throw error

      // Agrupar por id_imagen
      const grouped = {}
      ;(data || []).forEach(intento => {
        if (!grouped[intento.id_imagen]) grouped[intento.id_imagen] = []
        grouped[intento.id_imagen].push(intento)
      })
      setChallengeAttempts(grouped)
    } catch (err) {
      console.error('Error fetching challenge attempts:', err)
    } finally {
      setLoadingAttempts(false)
    }
  }

  // Fetch company data
  useEffect(() => {
    if (!user) return
    const fetchCompanyData = async () => {
      try {
        const { data: company, error } = await supabase
          .from('usuarios')
          .select('company_name, user_type, id_usuario, bio, social_website, settings_allowed_diffs')
          .eq('id_usuario', user.id)
          .maybeSingle()

        if (error) throw error
        setCompanyData(company)
        if (company) {
          setSettingsForm({
            company_name: company.company_name || '',
            bio: company.bio || '',
            website: company.social_website || '',
            allowed_diffs: company.settings_allowed_diffs || ['Easy', 'Medium', 'Hard'],
          })
        }        
        // Fetch team members (users under this company)
        if (company) {
          const { data: members } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, nombre_display, username, avatar_url, email, elo_rating, total_intentos, promedio_score, porcentaje_aprobacion, racha_actual, company_role, company_joined_at, created_at')
            .eq('company_id', company.id_usuario)
            .order('elo_rating', { ascending: false })
          setTeamUsers(members || [])

          // Fetch progreso del equipo — últimos 30 días de intentos de miembros
          if ((members || []).length > 0) {
            const memberIds = (members || []).map(m => m.id_usuario)
            const since = new Date()
            since.setDate(since.getDate() - 29)
            const { data: progressData } = await supabase
              .from('intentos')
              .select('id_usuario, puntaje_similitud, fecha_hora')
              .in('id_usuario', memberIds)
              .gte('fecha_hora', since.toISOString())
              .order('fecha_hora', { ascending: true })

            // Agrupar por día: promedio de score del equipo
            const byDay = {}
            ;(progressData || []).forEach(i => {
              const day = i.fecha_hora.slice(0, 10)
              if (!byDay[day]) byDay[day] = []
              byDay[day].push(i.puntaje_similitud || 0)
            })
            const days = []
            for (let d = 0; d < 30; d++) {
              const date = new Date(since)
              date.setDate(date.getDate() + d)
              const key = date.toISOString().slice(0, 10)
              const scores = byDay[key] || []
              days.push({
                date: key,
                label: date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
                avg: scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null,
                count: scores.length,
              })
            }
            setTeamProgressData(days)
          }

          // Fetch challenges
          const { data: chs } = await supabase
            .from('imagenes_ia')
            .select('id_imagen, url_image, image_diff, image_theme, fecha, prompt_original')
            .eq('company_id', company.id_usuario)
            .order('fecha', { ascending: false })
          setChallenges(chs || [])

          // Fetch intentos de esos desafíos por miembros del equipo
          if ((chs || []).length > 0 && (members || []).length > 0) {
            const challengeIds = (chs || []).map(c => c.id_imagen)
            const memberIds = (members || []).map(m => m.id_usuario)
            const { data: attemptsData } = await supabase
              .from('intentos')
              .select('id_intento, id_usuario, id_imagen, puntaje_similitud, prompt_usuario, strengths, improvements, fecha_hora, modo')
              .in('id_imagen', challengeIds)
              .in('id_usuario', memberIds)
              .order('fecha_hora', { ascending: false })
            const grouped = {}
            ;(attemptsData || []).forEach(intento => {
              if (!grouped[intento.id_imagen]) grouped[intento.id_imagen] = []
              grouped[intento.id_imagen].push(intento)
            })
            setChallengeAttempts(grouped)
          }
        }
      } catch (err) {
        console.error('Error fetching company data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [user?.id])

  const fetchEnterpriseRequests = async () => {
    if (!user?.id) return
    setEnterpriseLoadingRequests(true)
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('id, user_email, user_id, status, message, created_at, usuarios!team_invitations_user_id_fkey(nombre, nombre_display, username, avatar_url)')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })
      if (error) {
        // Fallback sin join si la FK no existe
        const { data: fallback, error: fallbackErr } = await supabase
          .from('team_invitations')
          .select('id, user_email, user_id, status, message, created_at')
          .eq('company_id', user.id)
          .order('created_at', { ascending: false })
        if (fallbackErr) throw fallbackErr
        setEnterpriseRequests(fallback || [])
      } else {
        setEnterpriseRequests(data || [])
      }
    } catch (err) {
      console.error('Error fetching enterprise requests:', err)
      setEnterpriseRequests([])
    } finally {
      setEnterpriseLoadingRequests(false)
    }
  }

  useEffect(() => {
    if (!user?.id) return
    fetchEnterpriseRequests()
  }, [user?.id])

  const sendEnterpriseInvite = async (event) => {
    event.preventDefault()
    if (!inviteEmail.trim()) {
      setEnterpriseActionStatus(lang === 'en' ? 'Enter an email.' : 'Ingresa un email.')
      return
    }
    setEnterpriseActionStatus(lang === 'en' ? 'Sending invitation...' : 'Enviando invitación...')
    try {
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id_usuario')
        .eq('email', inviteEmail.trim())
        .maybeSingle()

      // Verificar si ya es miembro de esta empresa
      if (existingUser?.id_usuario) {
        const { data: alreadyMember } = await supabase
          .from('usuarios')
          .select('company_id')
          .eq('id_usuario', existingUser.id_usuario)
          .maybeSingle()
        if (alreadyMember?.company_id === user.id) {
          setEnterpriseActionStatus(lang === 'en' ? 'This user is already a member.' : 'Este usuario ya es miembro.')
          return
        }

        // Verificar si ya tiene una invitación pendiente o aceptada
        const { data: existingInvite } = await supabase
          .from('team_invitations')
          .select('id, status')
          .eq('company_id', user.id)
          .eq('user_id', existingUser.id_usuario)
          .in('status', ['pending', 'accepted', 'requested'])
          .maybeSingle()
        if (existingInvite) {
          const msg = existingInvite.status === 'pending'
            ? (lang === 'en' ? 'An invitation is already pending for this user.' : 'Ya hay una invitación pendiente para este usuario.')
            : existingInvite.status === 'accepted'
              ? (lang === 'en' ? 'This user is already a member.' : 'Este usuario ya es miembro.')
              : (lang === 'en' ? 'This user already requested to join.' : 'Este usuario ya solicitó unirse.')
          setEnterpriseActionStatus(msg)
          return
        }
      }

      const payload = {
        company_id: user.id,
        user_email: inviteEmail.trim(),
        user_id: existingUser?.id_usuario || null,
        status: 'pending',
        message: inviteMessage.trim(),
      }

      const { error } = await supabase.from('team_invitations').insert([payload])
      if (error) throw error

      setInviteEmail('')
      setInviteMessage('')
      setEnterpriseActionStatus(lang === 'en' ? 'Invitation sent.' : 'Invitación enviada.')
      fetchEnterpriseRequests()
    } catch (err) {
      console.error('Error sending invite:', err)
      setEnterpriseActionStatus(lang === 'en' ? 'Could not send invitation.' : 'No se pudo enviar la invitación.')
    }
  }

  const updateEnterpriseRequestStatus = async (request, status) => {
    if (!request?.id) return
    try {
      if (status === 'accepted') {
        // Usar RPC con SECURITY DEFINER para poder escribir company_id en el usuario
        const { error } = await supabase.rpc('accept_team_invitation', { invitation_id: request.id })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('team_invitations')
          .update({ status })
          .eq('id', request.id)
        if (error) throw error
      }

      setEnterpriseActionStatus(
        status === 'accepted'
          ? (lang === 'en' ? 'Request accepted.' : 'Solicitud aceptada.')
          : (lang === 'en' ? 'Request rejected.' : 'Solicitud rechazada.'),
      )

      // Refrescar lista de miembros
      const { data: members } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, nombre_display, username, avatar_url, email, elo_rating, total_intentos, promedio_score, porcentaje_aprobacion, racha_actual, company_role, company_joined_at, created_at')
        .eq('company_id', user.id)
        .order('elo_rating', { ascending: false })
      setTeamUsers(members || [])

      fetchEnterpriseRequests()
    } catch (err) {
      console.error('Error updating request status:', err)
      setEnterpriseActionStatus(lang === 'en' ? 'Could not update request.' : 'No se pudo actualizar la solicitud.')
    }
  }

  const cancelEnterpriseInvite = async (requestId) => {
    setCancellingId(requestId)
    try {
      const { error } = await supabase.from('team_invitations').delete().eq('id', requestId)
      if (error) throw error
      setEnterpriseActionStatus(lang === 'en' ? 'Invitation cancelled.' : 'Invitación cancelada.')
      fetchEnterpriseRequests()
    } catch (err) {
      console.error('Error cancelling invite:', err)
      setEnterpriseActionStatus(lang === 'en' ? 'Could not cancel invitation.' : 'No se pudo cancelar la invitación.')
    } finally {
      setCancellingId(null)
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    setSettingsStatus(null)
    try {
      const updates = {
        company_name: settingsForm.company_name.trim(),
        bio: settingsForm.bio.trim(),
        social_website: settingsForm.website.trim(),
        settings_allowed_diffs: settingsForm.allowed_diffs,
      }
      const { error } = await supabase.from('usuarios').update(updates).eq('id_usuario', user.id)
      if (error) throw error
      setCompanyData(prev => ({ ...prev, ...updates }))
      setSettingsStatus('ok')
      setTimeout(() => setSettingsStatus(null), 2500)
    } catch (err) {
      console.error('Error saving settings:', err)
      setSettingsStatus('error')
    } finally {
      setSavingSettings(false)
    }
  }

  const assignRole = async (userId, role) => {
    try {
      const { error } = await supabase.rpc('assign_company_role', {
        target_user_id: userId,
        role,
      })
      if (error) throw error
      setTeamUsers(prev => prev.map(u => u.id_usuario === userId ? { ...u, company_role: role || null } : u))
    } catch (err) {
      console.error('Error assigning role:', err)
    }
  }

  const removeMember = async (userId) => {
    setRemovingId(userId)
    try {
      const { error } = await supabase.rpc('remove_team_member', { target_user_id: userId })
      if (error) throw error
      setTeamUsers(prev => prev.filter(u => u.id_usuario !== userId))
      setConfirmRemove(null)
    } catch (err) {
      console.error('Error removing member:', err)
    } finally {
      setRemovingId(null)
    }
  }

  const saveMemberName = async () => {
    if (!editingName || !editingName.value.trim()) return
    setSavingName(true)
    try {
      const { error } = await supabase.rpc('rename_team_member', {
        target_user_id: editingName.id,
        new_display_name: editingName.value.trim(),
      })
      if (error) throw error
      setTeamUsers(prev => prev.map(u =>
        u.id_usuario === editingName.id ? { ...u, nombre_display: editingName.value.trim() } : u
      ))
      setEditingName(null)
    } catch (err) {
      console.error('Error renaming member:', err)
    } finally {
      setSavingName(false)
    }
  }

  const resetChallengeForm = () => {
    setChallengeForm({ prompt: '', difficulty: 'Medium', theme: '' })
    setChallengeImageFile(null)
    setChallengeImagePreview(null)
    setChallengeStatus(null)
  }

  const openChallengeModal = () => {
    resetChallengeForm()
    setChallengeModalOpen(true)
  }

  const closeChallengeModal = () => {
    setChallengeModalOpen(false)
  }

  const handleChallengeImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setChallengeImageFile(file)
    setChallengeImagePreview(URL.createObjectURL(file))
  }

  const createChallenge = async (event) => {
    event.preventDefault()
    if (!challengeImageFile || !challengeForm.prompt.trim() || !challengeForm.theme.trim()) {
      setChallengeStatus(lang === 'en'
        ? 'Complete image, prompt and theme.'
        : 'Completa imagen, prompt y temática.')
      return
    }

    setCreatingChallenge(true)
    setChallengeStatus(lang === 'en' ? 'Uploading image...' : 'Subiendo imagen...')
    try {
      const ext = (challengeImageFile.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${user.id}/${Date.now()}-challenge.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('enterprise-challenges')
        .upload(path, challengeImageFile, { upsert: false })
      if (uploadError) throw new Error(`Storage: ${uploadError.message}`)

      const { data: publicData } = supabase.storage
        .from('enterprise-challenges')
        .getPublicUrl(path)
      const imageUrl = publicData.publicUrl

      setChallengeStatus(lang === 'en' ? 'Saving challenge...' : 'Guardando desafío...')

      const payload = {
        url_image: imageUrl,
        prompt_original: challengeForm.prompt.trim(),
        image_diff: challengeForm.difficulty,
        image_theme: challengeForm.theme.trim(),
        fecha: new Date().toISOString(),
        company_id: companyData?.id_usuario || user.id,
      }

      const { error: insertError } = await supabase.from('imagenes_ia').insert([payload])
      if (insertError) throw new Error(`DB: ${insertError.message}`)

      setChallengeStatus(lang === 'en' ? 'Challenge created successfully.' : 'Desafío creado correctamente.')
      fetchChallenges()
      setTimeout(() => closeChallengeModal(), 1000)
    } catch (err) {
      console.error('Error creating challenge:', err)
      setChallengeStatus(err?.message || (lang === 'en' ? 'Could not create challenge.' : 'No se pudo crear el desafío.'))
    } finally {
      setCreatingChallenge(false)
    }
  }

  const tabs = [
    { id: 'dashboard', label: lang === 'en' ? 'Dashboard' : 'Dashboard', icon: '📊' },
    { id: 'users', label: lang === 'en' ? 'Team' : 'Equipo', icon: '👥' },
    { id: 'settings', label: lang === 'en' ? 'Settings' : 'Configuración', icon: '⚙️' },
    {
      id: 'requests',
      label: lang === 'en' ? 'Requests' : 'Solicitudes',
      icon: '📥',
      badge: enterpriseRequests.filter(r => r.status === 'requested').length || null,
    },
    { id: 'challenges', label: lang === 'en' ? 'Challenges' : 'Desafíos', icon: '🎯' },
  ]

  const renderDashboard = () => {
    const scoreColor = (s) => s >= 70 ? 'text-emerald-500' : s >= 50 ? 'text-amber-500' : 'text-rose-500'
    const scoreBg = (s) => s >= 70 ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' : s >= 50 ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
    const diffBadge = (d) => {
      const l = (d || '').toLowerCase()
      if (l === 'easy') return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
      if (l === 'hard') return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
      return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
    }

    return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400">{lang === 'en' ? 'Team Members' : 'Miembros del Equipo'}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{teamUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400">{lang === 'en' ? 'Avg ELO' : 'ELO Promedio'}</p>
          <p className="mt-2 text-3xl font-bold text-violet-600">
            {teamUsers.length > 0
              ? Math.round(teamUsers.reduce((sum, u) => sum + (u.elo_rating || 1000), 0) / teamUsers.length)
              : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400">{lang === 'en' ? 'Total Attempts' : 'Intentos Totales'}</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {teamUsers.reduce((sum, u) => sum + (u.total_intentos || 0), 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400">{lang === 'en' ? 'Company' : 'Empresa'}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 truncate">{companyData?.company_name}</p>
        </div>
      </div>

      {/* Gráfico de progreso del equipo */}
      {teamProgressData.some(d => d.avg !== null) && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {lang === 'en' ? 'Team Progress' : 'Progreso del Equipo'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'en' ? 'Average score — last 30 days' : 'Score promedio — últimos 30 días'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-violet-600">
                {(() => {
                  const withData = teamProgressData.filter(d => d.avg !== null)
                  return withData.length ? Math.round(withData.reduce((s, d) => s + d.avg, 0) / withData.length) : '—'
                })()}%
              </p>
              <p className="text-xs text-slate-400">{lang === 'en' ? 'period avg' : 'promedio del período'}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={teamProgressData.filter(d => d.avg !== null)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="teamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs space-y-0.5">
                      <p className="font-semibold text-slate-500">{d.date}</p>
                      <p className="font-bold text-violet-600">{d.avg}%</p>
                      <p className="text-slate-400">{d.count} {lang === 'en' ? 'attempts' : 'intentos'}</p>
                    </div>
                  )
                }}
              />
              <Area type="monotone" dataKey="avg" stroke="#7c3aed" strokeWidth={2}
                fill="url(#teamGrad)" dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }}
                activeDot={{ r: 5 }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>

          {/* Mini stats del período */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              {
                label: lang === 'en' ? 'Best day' : 'Mejor día',
                value: (() => { const m = teamProgressData.filter(d => d.avg !== null).reduce((best, d) => d.avg > (best?.avg ?? 0) ? d : best, null); return m ? `${m.avg}%` : '—' })(),
              },
              {
                label: lang === 'en' ? 'Total attempts' : 'Intentos totales',
                value: teamProgressData.reduce((s, d) => s + d.count, 0),
              },
              {
                label: lang === 'en' ? 'Active days' : 'Días activos',
                value: teamProgressData.filter(d => d.count > 0).length,
              },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-center">
                <p className="text-base font-bold text-slate-800 dark:text-slate-100">{value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top performers */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {lang === 'en' ? 'Top Performers' : 'Mejores Desempeños'}
        </h3>
        <div className="space-y-3">
          {[...teamUsers]
            .sort((a, b) => (b.elo_rating || 1000) - (a.elo_rating || 1000))
            .slice(0, 5)
            .map((u) => (
              <div key={u.id_usuario} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                      : <span className="text-xs font-bold text-slate-500">{(u.nombre_display || u.nombre || 'U').substring(0,2).toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{u.nombre_display || u.nombre}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-violet-600">{u.elo_rating || 1000}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{u.total_intentos ?? 0} {lang === 'en' ? 'attempts' : 'intentos'}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Análisis por desafío */}
      {challenges.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
            {lang === 'en' ? 'Challenge Analysis' : 'Análisis por Desafío'}
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            {lang === 'en' ? 'How each member performed on each challenge' : 'Cómo le fue a cada miembro en cada desafío'}
          </p>

          <div className="space-y-4">
            {challenges.map(ch => {
              const attempts = challengeAttempts[ch.id_imagen] || []
              const isExpanded = expandedChallenge === ch.id_imagen

              // Agrupar intentos por usuario (tomar el mejor)
              const byUser = {}
              attempts.forEach(a => {
                if (!byUser[a.id_usuario] || a.puntaje_similitud > byUser[a.id_usuario].best.puntaje_similitud) {
                  if (!byUser[a.id_usuario]) byUser[a.id_usuario] = { best: a, all: [] }
                  byUser[a.id_usuario].best = a
                }
                if (!byUser[a.id_usuario]) byUser[a.id_usuario] = { best: a, all: [] }
                byUser[a.id_usuario].all = [...(byUser[a.id_usuario]?.all || []), a]
              })

              // Reconstruir correctamente
              const userStats = {}
              attempts.forEach(a => {
                if (!userStats[a.id_usuario]) userStats[a.id_usuario] = { all: [], best: null }
                userStats[a.id_usuario].all.push(a)
                if (!userStats[a.id_usuario].best || a.puntaje_similitud > userStats[a.id_usuario].best.puntaje_similitud) {
                  userStats[a.id_usuario].best = a
                }
              })

              const participantCount = Object.keys(userStats).length
              const avgScore = participantCount > 0
                ? Math.round(Object.values(userStats).reduce((s, u) => s + u.best.puntaje_similitud, 0) / participantCount)
                : null

              return (
                <div key={ch.id_imagen} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Header del desafío */}
                  <button
                    type="button"
                    onClick={() => setExpandedChallenge(isExpanded ? null : ch.id_imagen)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                  >
                    <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200">
                      {ch.url_image
                        ? <img src={ch.url_image} alt="" className="h-full w-full object-cover" />
                        : <div className="h-full w-full flex items-center justify-center text-xl">🖼️</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 ${diffBadge(ch.image_diff)}`}>
                          {ch.image_diff || 'Medium'}
                        </span>
                        {ch.image_theme && (
                          <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">{ch.image_theme}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{ch.prompt_original}</p>
                    </div>
                    <div className="shrink-0 text-right mr-2">
                      <p className="text-xs text-slate-500 mb-0.5">
                        {participantCount}/{teamUsers.length} {lang === 'en' ? 'played' : 'jugaron'}
                      </p>
                      {avgScore !== null && (
                        <p className={`text-lg font-bold ${scoreColor(avgScore)}`}>{avgScore}%</p>
                      )}
                      {participantCount === 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">{lang === 'en' ? 'No attempts' : 'Sin intentos'}</p>
                      )}
                    </div>
                    <svg
                      className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Detalle expandido */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 dark:border-slate-800">
                      {/* Miembros que jugaron */}
                      {teamUsers.map(member => {
                        const mStats = userStats[member.id_usuario]
                        const memberName = member.nombre_display || member.nombre || member.username || member.email
                        const memberKey = `${ch.id_imagen}-${member.id_usuario}`
                        const isMemberExpanded = expandedMember === memberKey

                        if (!mStats) {
                          // No jugó
                          return (
                            <div key={member.id_usuario} className="flex items-center gap-3 px-5 py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 bg-slate-50/50 dark:bg-slate-800/50">
                              <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                                {member.avatar_url
                                  ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                                  : <span className="text-[10px] font-bold text-slate-400">{memberName.substring(0,2).toUpperCase()}</span>
                                }
                              </div>
                              <p className="text-sm text-slate-400 dark:text-slate-500 flex-1">{memberName}</p>
                              <span className="text-xs text-slate-400 italic">{lang === 'en' ? 'Not attempted' : 'Sin intentar'}</span>
                            </div>
                          )
                        }

                        const best = mStats.best
                        const totalAttempts = mStats.all.length

                        return (
                          <div key={member.id_usuario} className="border-b border-slate-50 dark:border-slate-800 last:border-0">
                            {/* Fila del miembro */}
                            <button
                              type="button"
                              onClick={() => setExpandedMember(isMemberExpanded ? null : memberKey)}
                              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left"
                            >
                              <div className="h-7 w-7 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                                {member.avatar_url
                                  ? <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                                  : <span className="text-[10px] font-bold text-slate-500">{memberName.substring(0,2).toUpperCase()}</span>
                                }
                              </div>
                              <p className="text-sm font-medium text-slate-800 flex-1">{memberName}</p>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                  {totalAttempts} {totalAttempts === 1 ? (lang === 'en' ? 'attempt' : 'intento') : (lang === 'en' ? 'attempts' : 'intentos')}
                                </span>
                                <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${scoreBg(best.puntaje_similitud)} ${scoreColor(best.puntaje_similitud)}`}>
                                  {best.puntaje_similitud}%
                                </span>
                                <svg
                                  className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isMemberExpanded ? 'rotate-180' : ''}`}
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </button>

                            {/* Detalle del miembro expandido */}
                            {isMemberExpanded && (
                              <div className="px-5 pb-4 space-y-3 bg-slate-50/60 dark:bg-slate-800/60">
                                {mStats.all.map((intento, idx) => (
                                  <div key={intento.id_intento} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-semibold text-slate-500">
                                        {lang === 'en' ? `Attempt ${mStats.all.length - idx}` : `Intento ${mStats.all.length - idx}`}
                                        {idx === 0 && mStats.all.length > 1 && (
                                          <span className="ml-1.5 text-violet-600">{lang === 'en' ? '(best)' : '(mejor)'}</span>
                                        )}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                                          {new Date(intento.fecha_hora).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full border ${scoreBg(intento.puntaje_similitud)} ${scoreColor(intento.puntaje_similitud)}`}>
                                          {intento.puntaje_similitud}%
                                        </span>
                                      </div>
                                    </div>

                                    {intento.prompt_usuario && (
                                      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 px-3 py-2.5">
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Prompt</p>
                                        <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">"{intento.prompt_usuario}"</p>
                                      </div>
                                    )}

                                    {(intento.strengths?.length > 0 || intento.improvements?.length > 0) && (
                                      <div className="grid grid-cols-2 gap-2">
                                        {intento.strengths?.length > 0 && (
                                          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-3 py-2">
                                            <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest mb-1.5">
                                              {lang === 'en' ? 'Strengths' : 'Fortalezas'}
                                            </p>
                                            <ul className="space-y-1">
                                              {intento.strengths.slice(0, 3).map((s, i) => (
                                                <li key={i} className="text-[11px] text-emerald-800 dark:text-emerald-300 flex gap-1.5 leading-snug">
                                                  <span className="text-emerald-500 shrink-0 mt-px">✓</span>{s}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                        {intento.improvements?.length > 0 && (
                                          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 px-3 py-2">
                                            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest mb-1.5">
                                              {lang === 'en' ? 'To improve' : 'A mejorar'}
                                            </p>
                                            <ul className="space-y-1">
                                              {intento.improvements.slice(0, 3).map((s, i) => (
                                                <li key={i} className="text-[11px] text-amber-800 dark:text-amber-300 flex gap-1.5 leading-snug">
                                                  <span className="text-amber-500 shrink-0 mt-px">↑</span>{s}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
    )
  }

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {lang === 'en' ? 'Team Members' : 'Miembros del Equipo'}
          <span className="ml-2 text-sm font-normal text-slate-400">({teamUsers.length})</span>
        </h3>
        <button
          onClick={() => setActiveTab('requests')}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition"
        >
          + {lang === 'en' ? 'Invite User' : 'Invitar Usuario'}
        </button>
      </div>

      {teamUsers.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500">{lang === 'en' ? 'No team members yet' : 'No hay miembros en el equipo'}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{lang === 'en' ? 'Member' : 'Miembro'}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ELO</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{lang === 'en' ? 'Avg' : 'Prom.'}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{lang === 'en' ? 'Attempts' : 'Intentos'}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{lang === 'en' ? 'Role' : 'Rol'}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{lang === 'en' ? 'Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {teamUsers.map((member) => {
                const displayName = member.nombre_display || member.nombre || member.username || member.email
                const profileHref = member.username ? `/user/${member.username}` : `/perfil?id=${member.id_usuario}`
                const isEditingThis = editingName?.id === member.id_usuario
                const isConfirmingRemove = confirmRemove === member.id_usuario

                return (
                  <tr key={member.id_usuario} className={`transition ${isConfirmingRemove ? 'bg-rose-50' : 'hover:bg-slate-50'}`}>

                    {/* Nombre — editable inline */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center border border-slate-200">
                          {member.avatar_url
                            ? <img src={member.avatar_url} alt={displayName} className="h-full w-full object-cover" />
                            : <span className="text-xs font-bold text-slate-500">{displayName?.substring(0,2).toUpperCase()}</span>
                          }
                        </div>
                        <div className="min-w-0">
                          {isEditingThis ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                autoFocus
                                type="text"
                                value={editingName.value}
                                onChange={e => setEditingName(n => ({ ...n, value: e.target.value }))}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveMemberName()
                                  if (e.key === 'Escape') setEditingName(null)
                                }}
                                className="w-32 rounded-lg border border-violet-400 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
                              />
                              <button
                                onClick={saveMemberName}
                                disabled={savingName}
                                className="rounded-md bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                              >
                                {savingName ? '…' : '✓'}
                              </button>
                              <button
                                onClick={() => setEditingName(null)}
                                className="rounded-md border border-slate-200 px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-100 dark:bg-slate-800"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 group/name">
                              <a href={profileHref} className="text-sm font-medium text-slate-900 hover:text-violet-600 truncate max-w-[120px]">
                                {displayName}
                              </a>
                              <button
                                onClick={() => setEditingName({ id: member.id_usuario, value: displayName })}
                                className="opacity-0 group-hover/name:opacity-100 transition text-slate-400 hover:text-slate-600"
                                title={lang === 'en' ? 'Rename' : 'Renombrar'}
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-violet-600">{member.elo_rating || 1000}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{member.promedio_score ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{member.total_intentos || 0}</td>

                    {/* Rol */}
                    <td className="px-4 py-3">
                      <select
                        value={member.company_role || ''}
                        onChange={e => assignRole(member.id_usuario, e.target.value)}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400"
                      >
                        <option value="">{lang === 'en' ? 'No role' : 'Sin rol'}</option>
                        <option value="member">{lang === 'en' ? 'Member' : 'Miembro'}</option>
                        <option value="analyst">{lang === 'en' ? 'Analyst' : 'Analista'}</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3">
                      {isConfirmingRemove ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-rose-600 font-medium mr-1">
                            {lang === 'en' ? 'Remove?' : '¿Eliminar?'}
                          </span>
                          <button
                            onClick={() => removeMember(member.id_usuario)}
                            disabled={removingId === member.id_usuario}
                            className="rounded-md bg-rose-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                          >
                            {removingId === member.id_usuario ? '…' : (lang === 'en' ? 'Yes' : 'Sí')}
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-100 dark:bg-slate-800"
                          >
                            {lang === 'en' ? 'No' : 'No'}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <a href={profileHref} className="text-xs font-medium text-violet-600 hover:text-violet-700">
                            {lang === 'en' ? 'View' : 'Ver'}
                          </a>
                          <span className="text-slate-200">|</span>
                          <button
                            onClick={() => setConfirmRemove(member.id_usuario)}
                            className="text-xs font-medium text-rose-500 hover:text-rose-700 transition"
                          >
                            {lang === 'en' ? 'Remove' : 'Eliminar'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )

  const renderChallenges = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {lang === 'en' ? 'Custom Challenges' : 'Desafíos Personalizados'}
          {challenges.length > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-400">({challenges.length})</span>
          )}
        </h3>
        <button
          type="button"
          onClick={openChallengeModal}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition"
        >
          + {lang === 'en' ? 'Create Challenge' : 'Crear Desafío'}
        </button>
      </div>

      {loadingChallenges ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
        </div>
      ) : challenges.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-slate-600 font-medium">{lang === 'en' ? 'No custom challenges yet' : 'Aún no hay desafíos personalizados'}</p>
          <p className="text-sm text-slate-400 mt-1">
            {lang === 'en' ? 'Create challenges to assign to your team' : 'Creá desafíos para asignar a tu equipo'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {challenges.map((ch) => {
            const diffColors = {
              easy: 'text-emerald-700 bg-emerald-50 border-emerald-200',
              medium: 'text-amber-700 bg-amber-50 border-amber-200',
              hard: 'text-rose-700 bg-rose-50 border-rose-200',
            }
            const diff = (ch.image_diff || 'medium').toLowerCase()
            const diffClass = diffColors[diff] || diffColors.medium
            return (
              <div key={ch.id_imagen} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden hover:border-violet-300 hover:shadow-md transition group">
                <div className="h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {ch.url_image
                    ? <img src={ch.url_image} alt="challenge" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="h-full w-full flex items-center justify-center text-3xl">🖼️</div>
                  }
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-[11px] font-semibold rounded-full border px-2 py-0.5 ${diffClass}`}>
                      {ch.image_diff || 'Medium'}
                    </span>
                    {ch.image_theme && (
                      <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5 truncate max-w-[120px]">
                        {ch.image_theme}
                      </span>
                    )}
                  </div>
                  {ch.prompt_original && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{ch.prompt_original}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {ch.fecha ? new Date(ch.fecha).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                    <a
                      href={`/?challenge=${ch.id_imagen}`}
                      className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 transition"
                    >
                      {lang === 'en' ? 'Play' : 'Jugar'}
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-5 max-w-2xl">
      {/* Nombre + web */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
            {lang === 'en' ? 'Company name' : 'Nombre de la empresa'}
          </label>
          <input
            type="text"
            value={settingsForm.company_name}
            onChange={e => setSettingsForm(f => ({ ...f, company_name: e.target.value }))}
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
            placeholder={lang === 'en' ? 'Your company name' : 'Nombre de tu empresa'}
          />
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
            {lang === 'en' ? 'Website' : 'Sitio web'}
          </label>
          <input
            type="url"
            value={settingsForm.website}
            onChange={e => setSettingsForm(f => ({ ...f, website: e.target.value }))}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400"
            placeholder="https://empresa.com"
          />
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
            {lang === 'en' ? 'Description' : 'Descripción'}
          </label>
          <textarea
            value={settingsForm.bio}
            onChange={e => setSettingsForm(f => ({ ...f, bio: e.target.value }))}
            rows={3}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 outline-none resize-none placeholder:text-slate-400"
            placeholder={lang === 'en' ? 'What does your company do?' : '¿A qué se dedica tu empresa?'}
          />
        </div>
      </div>

      {/* Dificultades */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
          {lang === 'en' ? 'Allowed difficulties' : 'Dificultades permitidas'}
        </p>
        <div className="flex gap-2">
          {[
            { key: 'Easy',   label: lang === 'en' ? 'Easy' : 'Fácil',   on: 'bg-emerald-500 text-white border-emerald-500', off: 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400' },
            { key: 'Medium', label: lang === 'en' ? 'Medium' : 'Medio',  on: 'bg-amber-500 text-white border-amber-500',    off: 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400' },
            { key: 'Hard',   label: lang === 'en' ? 'Hard' : 'Difícil',  on: 'bg-rose-500 text-white border-rose-500',      off: 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400' },
          ].map(({ key, label, on, off }) => {
            const active = settingsForm.allowed_diffs.includes(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSettingsForm(f => ({
                  ...f,
                  allowed_diffs: active ? f.allowed_diffs.filter(d => d !== key) : [...f.allowed_diffs, key],
                }))}
                className={`rounded-xl border px-4 py-1.5 text-xs font-semibold transition ${active ? on : off}`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Guardar */}
      <div className="flex items-center gap-3">
        <button
          onClick={saveSettings}
          disabled={savingSettings}
          className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-60 flex items-center gap-2"
        >
          {savingSettings && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {savingSettings ? (lang === 'en' ? 'Saving...' : 'Guardando...') : (lang === 'en' ? 'Save' : 'Guardar')}
        </button>
        {settingsStatus === 'ok' && <span className="text-sm text-emerald-600">✓ {lang === 'en' ? 'Saved' : 'Guardado'}</span>}
        {settingsStatus === 'error' && <span className="text-sm text-rose-600">{lang === 'en' ? 'Could not save' : 'No se pudo guardar'}</span>}
      </div>
    </div>
  )

  const renderRequests = () => {
    const inviteLink = `${window.location.origin}/?invite=${companyData?.id_usuario}`

    const copyInviteLink = async () => {
      try {
        await navigator.clipboard.writeText(inviteLink)
        setCopyLinkStatus('copied')
        setTimeout(() => setCopyLinkStatus(null), 2000)
      } catch {
        // fallback
        const el = document.createElement('textarea')
        el.value = inviteLink
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
        setCopyLinkStatus('copied')
        setTimeout(() => setCopyLinkStatus(null), 2000)
      }
    }

    return (
    <div className="space-y-5">
      {/* Link de invitación */}
      <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-violet-900 dark:text-violet-200 mb-1">
              {lang === 'en' ? 'Invite link' : 'Link de invitación'}
            </p>
            <p className="text-xs text-violet-600 dark:text-violet-400">
              {lang === 'en'
                ? 'Anyone with this link who is logged in will join your company automatically.'
                : 'Cualquier persona logueada que abra este link se une a tu empresa automáticamente.'}
            </p>
          </div>
          <button
            onClick={copyInviteLink}
            className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              copyLinkStatus === 'copied'
                ? 'bg-emerald-600 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {copyLinkStatus === 'copied' ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {lang === 'en' ? 'Copied!' : '¡Copiado!'}
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {lang === 'en' ? 'Copy link' : 'Copiar link'}
              </>
            )}
          </button>
        </div>
        <div className="mt-3 rounded-lg bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-700 px-3 py-2">
          <p className="text-xs text-slate-500 font-mono truncate">{inviteLink}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {lang === 'en' ? 'Incoming Requests' : 'Solicitudes Entrantes'}
        </h3>
        {enterpriseLoadingRequests ? (
          <p className="text-slate-600">{lang === 'en' ? 'Loading requests...' : 'Cargando solicitudes...'}</p>
        ) : enterpriseRequests.filter(r => r.status === 'requested').length > 0 ? (
          <div className="space-y-3">
            {enterpriseRequests.filter(r => r.status === 'requested').map((request) => {
              const userInfo = request.usuarios
              const displayName = userInfo?.nombre_display || userInfo?.nombre || userInfo?.username || request.user_email
              const avatarUrl = userInfo?.avatar_url
              const profileHref = userInfo?.username
                ? `/user/${userInfo.username}`
                : request.user_id ? `/perfil?id=${request.user_id}` : null
              return (
                <div key={request.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">{displayName?.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      {profileHref ? (
                        <a href={profileHref} className="font-semibold text-slate-900 text-sm hover:text-violet-600 truncate block">
                          {displayName}
                        </a>
                      ) : (
                        <p className="font-semibold text-slate-900 text-sm truncate">{displayName}</p>
                      )}
                      <p className="text-[11px] text-slate-400 truncate">{request.user_email}</p>
                    </div>
                  </div>
                  {request.message && (
                    <p className="text-xs text-slate-600 italic mb-2 bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                      "{request.message}"
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mb-2">
                    {new Date(request.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateEnterpriseRequestStatus(request, 'accepted')}
                      className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                    >
                      {lang === 'en' ? 'Accept' : 'Aceptar'}
                    </button>
                    <button
                      onClick={() => updateEnterpriseRequestStatus(request, 'rejected')}
                      className="rounded-full border border-slate-300 dark:border-slate-600 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      {lang === 'en' ? 'Reject' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-slate-600">{lang === 'en' ? 'No incoming requests yet.' : 'No hay solicitudes entrantes aún.'}</p>
        )}
        {enterpriseActionStatus && (
          <p className="mt-3 text-sm font-medium text-slate-700">{enterpriseActionStatus}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {lang === 'en' ? 'Pending Invitations' : 'Invitaciones Pendientes'}
        </h3>
        {enterpriseLoadingRequests ? (
          <p className="text-slate-600">{lang === 'en' ? 'Loading invitations...' : 'Cargando invitaciones...'}</p>
        ) : enterpriseRequests.filter(r => r.status === 'pending').length > 0 ? (
          <div className="space-y-3">
            {enterpriseRequests.filter(r => r.status === 'pending').map((request) => (
              <div key={request.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{request.user_email}</p>
                {request.message && (
                  <p className="text-xs text-slate-500 mt-1 italic">"{request.message}"</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wide text-amber-600 font-semibold">
                    ⏳ {lang === 'en' ? 'Awaiting response' : 'Esperando respuesta'}
                  </p>
                  <button
                    onClick={() => cancelEnterpriseInvite(request.id)}
                    disabled={cancellingId === request.id}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-medium transition disabled:opacity-50"
                  >
                    {cancellingId === request.id
                      ? (lang === 'en' ? 'Cancelling...' : 'Cancelando...')
                      : (lang === 'en' ? 'Cancel' : 'Cancelar')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">{lang === 'en' ? 'No pending invitations.' : 'No hay invitaciones pendientes.'}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          {lang === 'en' ? 'Invite a User' : 'Invitar a un Usuario'}
        </h3>
        <form onSubmit={sendEnterpriseInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">{lang === 'en' ? 'User email' : 'Email del usuario'}</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm"
              placeholder={lang === 'en' ? 'user@example.com' : 'usuario@ejemplo.com'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">{lang === 'en' ? 'Message' : 'Mensaje'}</label>
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm resize-none"
              placeholder={lang === 'en' ? 'Optional note for the invite' : 'Nota opcional para la invitación'}
            />
          </div>
          <button type="submit" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition">
            {lang === 'en' ? 'Send Invitation' : 'Enviar Invitación'}
          </button>
          {enterpriseActionStatus && <p className="text-sm text-slate-600 dark:text-slate-400">{enterpriseActionStatus}</p>}
        </form>
      </div>
    </div>
    </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 dark:border-slate-600 border-t-violet-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {lang === 'en' ? 'Enterprise Dashboard' : 'Panel de Empresa'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">{companyData?.company_name}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-200 dark:border-slate-700 dark:border-slate-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 font-medium transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-violet-600 text-violet-600'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {tab.icon} {tab.label}
              {tab.badge ? (
                <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'requests' && renderRequests()}
          {activeTab === 'challenges' && renderChallenges()}
        </div>
      </main>

      <Footer />

      {challengeModalOpen && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closeChallengeModal}
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {lang === 'en' ? 'Create custom challenge' : 'Crear desafío personalizado'}
              </h3>
              <button
                type="button"
                onClick={closeChallengeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={createChallenge} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">
                  {lang === 'en' ? 'Challenge image' : 'Imagen del desafío'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleChallengeImageChange}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                  required
                />
                {challengeImagePreview && (
                  <img src={challengeImagePreview} alt="preview" className="mt-3 h-40 w-full rounded-xl object-cover border border-slate-200" />
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-900">
                  {lang === 'en' ? 'Original prompt' : 'Prompt original'}
                </label>
                <textarea
                  value={challengeForm.prompt}
                  onChange={(e) => setChallengeForm(f => ({ ...f, prompt: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm resize-none"
                  placeholder={lang === 'en' ? 'Describe the expected image prompt...' : 'Describe el prompt esperado de la imagen...'}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">
                    {lang === 'en' ? 'Difficulty' : 'Dificultad'}
                  </label>
                  <select
                    value={challengeForm.difficulty}
                    onChange={(e) => setChallengeForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-900">
                    {lang === 'en' ? 'Theme' : 'Temática'}
                  </label>
                  <input
                    type="text"
                    value={challengeForm.theme}
                    onChange={(e) => setChallengeForm(f => ({ ...f, theme: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm"
                    placeholder={lang === 'en' ? 'e.g. Cyberpunk city' : 'Ej: Ciudad cyberpunk'}
                    required
                  />
                </div>
              </div>

              {challengeStatus && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{challengeStatus}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeChallengeModal}
                  className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  {lang === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={creatingChallenge}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {creatingChallenge
                    ? (lang === 'en' ? 'Creating...' : 'Creando...')
                    : (lang === 'en' ? 'Create challenge' : 'Crear desafío')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnterprisePanel

