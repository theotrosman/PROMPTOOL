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

  const tabs = [
    { id: 'dashboard', label: lang === 'en' ? 'Dashboard' : 'Dashboard', icon: '📊' },
    { id: 'users', label: lang === 'en' ? 'Team' : 'Equipo', icon: '👥' },
    { id: 'challenges', label: lang === 'en' ? 'Challenges' : 'Desafíos', icon: '🎯' },
    { id: 'settings', label: lang === 'en' ? 'Settings' : 'Configuración', icon: '⚙️' },
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
        <button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition">
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
          {activeTab === 'challenges' && renderChallenges()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default EnterprisePanel
