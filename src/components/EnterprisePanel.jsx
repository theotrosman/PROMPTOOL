import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../contexts/LangContext'
import Header from './Header'
import Footer from './Footer'

const EnterprisePanel = ({ user }) => {
  const { lang } = useLang()
  const [activeTab, setActiveTab] = useState('dashboard')
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

  // Fetch company data
  useEffect(() => {
    if (!user) return
    const fetchCompanyData = async () => {
      try {
        const { data: company, error } = await supabase
          .from('usuarios')
          .select('company_name, user_type, id_usuario')
          .eq('id_usuario', user.id)
          .maybeSingle()

        if (error) throw error
        setCompanyData(company)
        
        // Fetch team members (users under this company)
        if (company) {
          const { data: members } = await supabase
            .from('usuarios')
            .select('id_usuario, nombre, email, elo_rating, total_intentos, created_at')
            .eq('company_id', company.id_usuario)
          
          setTeamUsers(members || [])
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
        .select('id, user_email, user_id, status, message, created_at')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setEnterpriseRequests(data || [])
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
      const { error } = await supabase
        .from('team_invitations')
        .update({ status })
        .eq('id', request.id)
      if (error) throw error

      if (status === 'accepted' && request.user_id) {
        await supabase
          .from('usuarios')
          .update({ company_id: user.id })
          .eq('id_usuario', request.user_id)
      }

      setEnterpriseActionStatus(
        status === 'accepted'
          ? (lang === 'en' ? 'Request accepted.' : 'Solicitud aceptada.')
          : (lang === 'en' ? 'Request rejected.' : 'Solicitud rechazada.'),
      )
      fetchEnterpriseRequests()
    } catch (err) {
      console.error('Error updating request status:', err)
      setEnterpriseActionStatus(lang === 'en' ? 'Could not update request.' : 'No se pudo actualizar la solicitud.')
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
    setChallengeStatus(lang === 'en' ? 'Creating challenge...' : 'Creando desafío...')
    try {
      await supabase.storage.createBucket('enterprise-challenges', { public: true }).catch(() => {})

      const ext = (challengeImageFile.name.split('.').pop() || 'jpg').toLowerCase()
      const path = `${user.id}/${Date.now()}-challenge.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('enterprise-challenges')
        .upload(path, challengeImageFile, { upsert: false })
      if (uploadError) throw uploadError

      const { data: publicData } = supabase.storage
        .from('enterprise-challenges')
        .getPublicUrl(path)
      const imageUrl = publicData.publicUrl

      const basePayload = {
        url_image: imageUrl,
        prompt_original: challengeForm.prompt.trim(),
        image_diff: challengeForm.difficulty,
        image_theme: challengeForm.theme.trim(),
        fecha: new Date().toISOString(),
      }

      let insertError = null
      const withCompanyPayload = { ...basePayload, company_id: companyData?.id_usuario || user.id }
      const { error: firstError } = await supabase.from('imagenes_ia').insert([withCompanyPayload])
      insertError = firstError

      // Fallback por si la tabla no tiene company_id
      if (insertError) {
        const { error: fallbackError } = await supabase.from('imagenes_ia').insert([basePayload])
        insertError = fallbackError
      }

      if (insertError) throw insertError

      setChallengeStatus(lang === 'en' ? 'Challenge created successfully.' : 'Desafío creado correctamente.')
      setTimeout(() => {
        closeChallengeModal()
      }, 800)
    } catch (err) {
      console.error('Error creating challenge:', err)
      setChallengeStatus(lang === 'en' ? 'Could not create challenge.' : 'No se pudo crear el desafío.')
    } finally {
      setCreatingChallenge(false)
    }
  }

  const tabs = [
    { id: 'dashboard', label: lang === 'en' ? 'Dashboard' : 'Dashboard', icon: '📊' },
    { id: 'users', label: lang === 'en' ? 'Team' : 'Equipo', icon: '👥' },
    { id: 'settings', label: lang === 'en' ? 'Settings' : 'Configuración', icon: '⚙️' },
    { id: 'requests', label: lang === 'en' ? 'Requests' : 'Solicitudes', icon: '📥' },
    { id: 'challenges', label: lang === 'en' ? 'Challenges' : 'Desafíos', icon: '🎯' },
  ]

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{lang === 'en' ? 'Team Members' : 'Miembros del Equipo'}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{teamUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{lang === 'en' ? 'Avg ELO' : 'ELO Promedio'}</p>
          <p className="mt-2 text-3xl font-bold text-violet-600">
            {teamUsers.length > 0
              ? Math.round(teamUsers.reduce((sum, u) => sum + (u.elo_rating || 1000), 0) / teamUsers.length)
              : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{lang === 'en' ? 'Total Attempts' : 'Intentos Totales'}</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {teamUsers.reduce((sum, u) => sum + (u.total_intentos || 0), 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">{lang === 'en' ? 'Company' : 'Empresa'}</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 truncate">{companyData?.company_name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {lang === 'en' ? 'Top Performers' : 'Mejores Desempeños'}
        </h3>
        <div className="space-y-3">
          {teamUsers
            .sort((a, b) => (b.elo_rating || 1000) - (a.elo_rating || 1000))
            .slice(0, 5)
            .map((user) => (
              <div key={user.id_usuario} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-900">{user.nombre}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-violet-600">{user.elo_rating || 1000}</p>
                  <p className="text-xs text-slate-500">{user.total_intentos} intentos</p>
                </div>
              </div>
            ))}
        </div>
      </div>

    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {lang === 'en' ? 'Team Members' : 'Miembros del Equipo'}
        </h3>
        <button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition">
          + {lang === 'en' ? 'Invite User' : 'Invitar Usuario'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">{lang === 'en' ? 'Name' : 'Nombre'}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">ELO</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">{lang === 'en' ? 'Attempts' : 'Intentos'}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">{lang === 'en' ? 'Joined' : 'Unido'}</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-900">{lang === 'en' ? 'Actions' : 'Acciones'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {teamUsers.map((teamUser) => (
              <tr key={teamUser.id_usuario} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{teamUser.nombre}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{teamUser.email}</td>
                <td className="px-6 py-4 text-sm font-semibold text-violet-600">{teamUser.elo_rating || 1000}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{teamUser.total_intentos || 0}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {teamUser.created_at ? new Date(teamUser.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-violet-600 hover:text-violet-700 font-medium">
                    {lang === 'en' ? 'View' : 'Ver'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {teamUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600">{lang === 'en' ? 'No team members yet' : 'No hay miembros en el equipo'}</p>
        </div>
      )}
    </div>
  )

  const renderChallenges = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {lang === 'en' ? 'Custom Challenges' : 'Desafíos Personalizados'}
        </h3>
        <button
          type="button"
          onClick={openChallengeModal}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition"
        >
          + {lang === 'en' ? 'Create Challenge' : 'Crear Desafío'}
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">{lang === 'en' ? 'No custom challenges created yet' : 'Aún no hay desafíos personalizados'}</p>
        <p className="text-sm text-slate-500 mt-2">
          {lang === 'en'
            ? 'Create custom challenges to assign to your team'
            : 'Crea desafíos personalizados para asignar a tu equipo'}
        </p>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {lang === 'en' ? 'Difficulty Settings' : 'Configuración de Dificultad'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              {lang === 'en' ? 'Allowed Difficulties' : 'Dificultades Permitidas'}
            </label>
            <div className="space-y-2">
              {['Easy', 'Medium', 'Hard'].map((diff) => (
                <label key={diff} className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300" />
                  <span className="text-sm text-slate-700">{diff}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {lang === 'en' ? 'Theme Configuration' : 'Configuración de Temáticas'}
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          {lang === 'en'
            ? 'Select which themes your team can practice'
            : 'Selecciona qué temáticas puede practicar tu equipo'}
        </p>
        <div className="rounded-lg border border-slate-300 border-dashed p-6 text-center">
          <p className="text-slate-600">{lang === 'en' ? 'Theme selection coming soon' : 'Selección de temáticas próximamente'}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {lang === 'en' ? 'Company Information' : 'Información de la Empresa'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              {lang === 'en' ? 'Company Name' : 'Nombre de la Empresa'}
            </label>
            <input
              type="text"
              defaultValue={companyData?.company_name}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm"
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderRequests = () => (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {lang === 'en' ? 'Incoming Requests' : 'Solicitudes Entrantes'}
        </h3>
        {enterpriseLoadingRequests ? (
          <p className="text-slate-600">{lang === 'en' ? 'Loading requests...' : 'Cargando solicitudes...'}</p>
        ) : enterpriseRequests.filter(r => r.status === 'requested').length > 0 ? (
          <div className="space-y-3">
            {enterpriseRequests.filter(r => r.status === 'requested').map((request) => (
              <div key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{request.user_email}</p>
                <p className="text-xs text-slate-500">{request.message || (lang === 'en' ? 'No message provided.' : 'Sin mensaje proporcionado.')}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => updateEnterpriseRequestStatus(request, 'accepted')}
                    className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    {lang === 'en' ? 'Accept' : 'Aceptar'}
                  </button>
                  <button
                    onClick={() => updateEnterpriseRequestStatus(request, 'rejected')}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    {lang === 'en' ? 'Reject' : 'Rechazar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">{lang === 'en' ? 'No incoming requests yet.' : 'No hay solicitudes entrantes aún.'}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {lang === 'en' ? 'Pending Invitations' : 'Invitaciones Pendientes'}
        </h3>
        {enterpriseLoadingRequests ? (
          <p className="text-slate-600">{lang === 'en' ? 'Loading invitations...' : 'Cargando invitaciones...'}</p>
        ) : enterpriseRequests.filter(r => r.status === 'pending').length > 0 ? (
          <div className="space-y-3">
            {enterpriseRequests.filter(r => r.status === 'pending').map((request) => (
              <div key={request.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">{request.user_email}</p>
                <p className="text-xs text-slate-500">{request.message || (lang === 'en' ? 'No message provided.' : 'Sin mensaje proporcionado.')}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">{lang === 'en' ? 'Pending' : 'Pendiente'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600">{lang === 'en' ? 'No pending invitations.' : 'No hay invitaciones pendientes.'}</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {lang === 'en' ? 'Invite a User' : 'Invitar a un Usuario'}
        </h3>
        <form onSubmit={sendEnterpriseInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">{lang === 'en' ? 'User email' : 'Email del usuario'}</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
              placeholder={lang === 'en' ? 'user@example.com' : 'usuario@ejemplo.com'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">{lang === 'en' ? 'Message' : 'Mensaje'}</label>
            <textarea
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm resize-none"
              placeholder={lang === 'en' ? 'Optional note for the invite' : 'Nota opcional para la invitación'}
            />
          </div>
          <button type="submit" className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition">
            {lang === 'en' ? 'Send Invitation' : 'Enviar Invitación'}
          </button>
          {enterpriseActionStatus && <p className="text-sm text-slate-600">{enterpriseActionStatus}</p>}
        </form>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-violet-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {lang === 'en' ? 'Enterprise Dashboard' : 'Panel de Empresa'}
          </h1>
          <p className="text-slate-600 mt-2">{companyData?.company_name}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition ${
                activeTab === tab.id
                  ? 'border-b-2 border-violet-600 text-violet-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.icon} {tab.label}
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
            className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {lang === 'en' ? 'Create custom challenge' : 'Crear desafío personalizado'}
              </h3>
              <button
                type="button"
                onClick={closeChallengeModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
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
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm resize-none"
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
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
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
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder={lang === 'en' ? 'e.g. Cyberpunk city' : 'Ej: Ciudad cyberpunk'}
                    required
                  />
                </div>
              </div>

              {challengeStatus && (
                <p className="text-sm text-slate-600">{challengeStatus}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeChallengeModal}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
