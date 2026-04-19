import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import { useTheme } from '../contexts/ThemeContext'
import { useLang } from '../contexts/LangContext'
import { supabase } from '../supabaseClient'
import AuthModal from './AuthModal'

const Header = () => {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut } = useAuth()
  const { isAdmin } = useAdmin(user?.id)
  const { theme, setTheme } = useTheme()
  const { lang, changeLang, t } = useLang()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('main')
  const [showPwForm, setShowPwForm] = useState(false)
  const [pwForm, setPwForm] = useState({ newPw: '', confirmPw: '' })
  const [pwStatus, setPwStatus] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const closeTimer = useRef(null)
  const searchRef = useRef(null)
  const searchTimer = useRef(null)

  // Close search on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = async (q) => {
    setSearchQuery(q)
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return }
    setSearchOpen(true)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const { data: users } = await supabase
          .from('usuarios')
          .select('id_usuario, nombre, nombre_display, username, avatar_url')
          .or(`username.ilike.%${q}%,nombre.ilike.%${q}%,nombre_display.ilike.%${q}%`)
          .limit(5)
        setSearchResults(users || [])
      } catch (_) {}
      setSearchLoading(false)
    }, 300)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPw !== pwForm.confirmPw) { setPwStatus('mismatch'); return }
    if (pwForm.newPw.length < 6) { setPwStatus('short'); return }
    setPwStatus('saving')
    const { error } = await supabase.auth.updateUser({ password: pwForm.newPw })
    if (error) { setPwStatus('error'); return }
    setPwStatus('ok')
    setPwForm({ newPw: '', confirmPw: '' })
    setShowPwForm(false)
    setTimeout(() => setPwStatus(null), 2000)
  }

  const handleMouseEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setUserMenuOpen(true)
  }
  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setUserMenuOpen(false)
      setActiveSection('main')
    }, 200)
  }

  const getUserAvatar = () => {
    if (user?.user_metadata?.avatar_url) {
      return <img src={user.user_metadata.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
    }
    const name = user?.user_metadata?.nombre || user?.email || 'U'
    return <span className="text-sm font-semibold text-slate-700">{name.substring(0, 2).toUpperCase()}</span>
  }

  const getUserName = () => {
    if (!user) return ''
    return user.user_metadata?.nombre || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  }

  const Icon = ({ d, className = 'h-4 w-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )

  const navLinks = [
    { href: '/guides', label: t('guides') },
    { href: '/leaderboard', label: t('leaderboard') },
    { href: '/tournaments', label: t('challenges') },
    ...(isAdmin ? [{ href: '/admin', label: t('tables'), className: 'text-purple-600 font-semibold' }] : []),
  ]

  return (
    <>
      <header className="relative z-[100] border-b border-slate-200/90 bg-white/90 backdrop-blur-xl transition-shadow duration-300 ease-out hover:shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-6 py-3">

          {/* Logo — izquierda fija */}
          <a href="/" className="shrink-0 text-xl font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-700">
            PrompTool
          </a>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search */}
          <div ref={searchRef} className="relative w-56">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 transition focus-within:border-slate-400 focus-within:bg-white">
              <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setSearchOpen(true)}
                placeholder={lang === 'en' ? 'Search users...' : 'Buscar usuarios...'}
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              {searchLoading && (
                <div className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
              )}
            </div>

            {searchOpen && (
              <div className="absolute left-0 right-0 top-full mt-1 z-[300] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                {searchResults.length > 0 ? (
                  <>
                    <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {lang === 'en' ? 'Users' : 'Usuarios'}
                    </p>
                    {searchResults.map(u => {
                      const name = u.nombre_display || u.nombre || u.username || 'User'
                      const href = u.username ? `/user/${u.username}` : `/usuario.html?id=${u.id_usuario}`
                      return (
                        <a key={u.id_usuario} href={href}
                          onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                          className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 border border-slate-200">
                            {u.avatar_url
                              ? <img src={u.avatar_url} alt={name} className="h-full w-full object-cover" />
                              : <span className="text-xs font-semibold text-slate-600">{name.substring(0, 2).toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            <p className="font-medium leading-tight">{name}</p>
                            {u.username && <p className="text-xs text-slate-400">@{u.username}</p>}
                          </div>
                        </a>
                      )
                    })}
                  </>
                ) : !searchLoading ? (
                  <p className="px-3 py-3 text-sm text-slate-400">
                    {lang === 'en' ? 'No users found' : 'Sin resultados'}
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="hidden items-center gap-1 text-sm text-slate-600 md:flex">
            {navLinks.map(({ href, label, className: cls }) => (
              <a key={href} href={href}
                className={`rounded-lg px-3 py-1.5 transition-all hover:bg-slate-100 hover:text-slate-900 ${cls || ''}`}>
                {label}
              </a>
            ))}
          </nav>

          {/* Avatar o login */}
          <div className="flex shrink-0 items-center">
            {loading ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-200 bg-slate-100">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
              </div>
            ) : user ? (
              <div className="relative z-[201]" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                <a href="/perfil"
                  className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 transition-all hover:shadow-md border-2 ${isAdmin ? 'border-purple-400 hover:border-purple-500' : 'border-slate-200 hover:border-slate-300'}`}>
                  {getUserAvatar()}
                </a>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-11 z-[202] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="absolute -top-3 left-0 right-0 h-3" />

                    {activeSection === 'main' && (
                      <>
                        <div className="flex items-center gap-3 border-b border-slate-100 p-3">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 ${isAdmin ? 'border-purple-400' : 'border-slate-200'} bg-slate-100`}>
                            {getUserAvatar()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{getUserName()}</p>
                            <p className="truncate text-xs text-slate-400">{user.email}</p>
                          </div>
                        </div>

                        <div className="p-1.5 space-y-0.5">
                          <a href="/perfil" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                            <Icon d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            {t('viewProfile')}
                          </a>
                          <button onClick={() => setActiveSection('settings')}
                            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50">
                            <span className="flex items-center gap-3">
                              <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              {t('settings')}
                            </span>
                            <Icon d="M9 5l7 7-7 7" className="h-3.5 w-3.5 text-slate-400" />
                          </button>
                          {isAdmin && (
                            <a href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-purple-600 transition hover:bg-purple-50">
                              <Icon d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                              {t('adminPanel')}
                            </a>
                          )}
                        </div>

                        <div className="border-t border-slate-100 p-1.5">
                          <button onClick={() => { signOut(); setUserMenuOpen(false) }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50">
                            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            {t('signOut')}
                          </button>
                        </div>
                      </>
                    )}

                    {activeSection === 'settings' && (
                      <>
                        <div className="flex items-center gap-2 border-b border-slate-100 p-3">
                          <button onClick={() => setActiveSection('main')}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100">
                            <Icon d="M15 19l-7-7 7-7" className="h-4 w-4" />
                          </button>
                          <p className="text-sm font-semibold text-slate-800">{t('settingsTitle')}</p>
                        </div>

                        <div className="p-3 space-y-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('theme')}</p>
                            <div className="flex gap-2">
                              {['light', 'dark'].map(th => (
                                <button key={th} onClick={() => setTheme(th)}
                                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition ${theme === th ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                  {th === 'light'
                                    ? <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" /></svg>
                                    : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                  }
                                  {t(th)}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('language')}</p>
                            <div className="flex gap-2">
                              {[['es', 'Español'], ['en', 'English']].map(([l, label]) => (
                                <button key={l} onClick={() => changeLang(l)}
                                  className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${lang === l ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <button type="button" onClick={() => { setShowPwForm(f => !f); setPwStatus(null) }}
                              className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 hover:text-slate-700 transition">
                              <span>{t('changePassword')}</span>
                              <Icon d={showPwForm ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} className="h-3.5 w-3.5" />
                            </button>
                            {showPwForm && (
                              <form onSubmit={handleChangePassword} className="space-y-2">
                                <input type="password" placeholder={t('newPassword')} value={pwForm.newPw}
                                  onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))}
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-slate-400"
                                  minLength={6} required />
                                <input type="password" placeholder={t('confirmPassword')} value={pwForm.confirmPw}
                                  onChange={e => setPwForm(f => ({ ...f, confirmPw: e.target.value }))}
                                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-slate-400"
                                  minLength={6} required />
                                {pwStatus === 'mismatch' && <p className="text-xs text-rose-600">{t('passwordMismatch')}</p>}
                                {pwStatus === 'short' && <p className="text-xs text-rose-600">{t('passwordShort')}</p>}
                                {pwStatus === 'error' && <p className="text-xs text-rose-600">{t('passwordError')}</p>}
                                {pwStatus === 'ok' && <p className="text-xs text-emerald-600">{t('passwordChanged')}</p>}
                                <button type="submit" disabled={pwStatus === 'saving'}
                                  className="w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">
                                  {pwStatus === 'saving' ? '...' : t('save')}
                                </button>
                              </form>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-slate-100 p-1.5">
                          <button onClick={() => { signOut(); setUserMenuOpen(false) }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-rose-600 transition hover:bg-rose-50">
                            <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            {t('signOut')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => setAuthModalOpen(true)}
                className="flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-white">
                {t('signIn')}
              </button>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignInWithGoogle={signInWithGoogle}
        onSignInWithEmail={signInWithEmail}
        onSignUpWithEmail={signUpWithEmail}
      />
    </>
  )
}

export default Header
