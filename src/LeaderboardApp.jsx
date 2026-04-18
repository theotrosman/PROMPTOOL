import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import { supabase } from './supabaseClient'
import { useLang } from './contexts/LangContext'

const MEDALS = ['🥇', '🥈', '🥉']

function LeaderboardApp() {
  const { t, lang } = useLang()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('promedio_score') // promedio_score | mejor_score | total_intentos

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('usuarios')
        .select('id_usuario, nombre, nombre_display, username, avatar_url, promedio_score, mejor_score, total_intentos, porcentaje_aprobacion, racha_actual')
        .eq('adminstate', false)
        .gt('total_intentos', 0)
        .order(sortBy, { ascending: false })
        .limit(50)

      if (!error) setPlayers(data || [])
      setLoading(false)
    }
    fetchLeaderboard()
  }, [sortBy])

  const getDisplayName = (p) => p.nombre_display || p.nombre || p.username || 'User'
  const getProfileUrl = (p) => p.username ? `/user/${p.username}` : `/usuario.html?id=${p.id_usuario}`

  const cols = [
    { key: 'promedio_score', label: lang === 'en' ? 'Avg Score' : 'Promedio', suffix: '%' },
    { key: 'mejor_score', label: lang === 'en' ? 'Best Score' : 'Mejor', suffix: '%' },
    { key: 'total_intentos', label: lang === 'en' ? 'Attempts' : 'Intentos', suffix: '' },
    { key: 'porcentaje_aprobacion', label: lang === 'en' ? 'Approval' : 'Aprobación', suffix: '%' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            {lang === 'en' ? 'Global Leaderboard' : 'Ranking Global'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {lang === 'en' ? 'Top players ranked by performance' : 'Los mejores jugadores por rendimiento'}
          </p>
        </div>

        {/* Sort tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {cols.map(col => (
            <button
              key={col.key}
              onClick={() => setSortBy(col.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                sortBy === col.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {col.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
          </div>
        ) : players.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-slate-500">{lang === 'en' ? 'No players yet' : 'Sin jugadores todavía'}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[2.5rem_1fr_repeat(4,5rem)] gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <span>#</span>
              <span>{lang === 'en' ? 'Player' : 'Jugador'}</span>
              {cols.map(c => (
                <span key={c.key} className={`text-right ${sortBy === c.key ? 'text-slate-700' : ''}`}>{c.label}</span>
              ))}
            </div>

            {players.map((p, i) => {
              const rank = i + 1
              const isTop3 = rank <= 3
              return (
                <a
                  key={p.id_usuario}
                  href={getProfileUrl(p)}
                  className={`grid grid-cols-[2.5rem_1fr_repeat(4,5rem)] gap-3 items-center px-5 py-3 border-b border-slate-100 last:border-0 transition hover:bg-slate-50 ${isTop3 ? 'bg-gradient-to-r from-amber-50/40 to-transparent' : ''}`}
                >
                  {/* Rank */}
                  <span className="text-sm font-bold text-slate-400">
                    {rank <= 3 ? MEDALS[rank - 1] : rank}
                  </span>

                  {/* Player */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
                        : <span className="text-xs font-bold text-slate-500">{getDisplayName(p).substring(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{getDisplayName(p)}</p>
                      {p.username && <p className="text-xs text-slate-400">@{p.username}</p>}
                    </div>
                  </div>

                  {/* Stats */}
                  {cols.map(col => {
                    const val = p[col.key] || 0
                    const isActive = sortBy === col.key
                    const color = col.key === 'promedio_score' || col.key === 'mejor_score' || col.key === 'porcentaje_aprobacion'
                      ? val >= 70 ? 'text-emerald-600' : val >= 50 ? 'text-amber-500' : 'text-rose-500'
                      : 'text-slate-700'
                    return (
                      <span key={col.key} className={`text-right text-sm font-bold ${isActive ? color : 'text-slate-500'}`}>
                        {val}{col.suffix}
                      </span>
                    )
                  })}
                </a>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

export default LeaderboardApp
