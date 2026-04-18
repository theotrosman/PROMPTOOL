import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../contexts/LangContext'

const AuthModal = ({ open, onClose, onSignInWithGoogle, onSignInWithEmail, onSignUpWithEmail }) => {
  const { t } = useLang()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const sanitizeUsername = (val) => val.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20)

  const checkUsername = async (val) => {
    if (!val || val.length < 3) { setUsernameStatus(null); return }
    setUsernameStatus('checking')
    const { data } = await supabase.from('usuarios').select('id_usuario').ilike('username', val).maybeSingle()
    setUsernameStatus(data ? 'taken' : 'ok')
  }

  const handleUsernameChange = (e) => {
    const val = sanitizeUsername(e.target.value)
    setUsername(val)
    checkUsername(val)
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        if (!nombre.trim()) { setError(t('nameRequired')); setLoading(false); return }
        if (!username || username.length < 3) { setError(t('usernameMin')); setLoading(false); return }
        if (usernameStatus === 'taken') { setError(t('usernameTaken')); setLoading(false); return }
        await onSignUpWithEmail(email, password, nombre, username)
        onClose()
      } else {
        await onSignInWithEmail(email, password)
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => { setEmail(''); setPassword(''); setNombre(''); setUsername(''); setUsernameStatus(null); setError('') }
  const switchMode = () => { setMode(m => m === 'signin' ? 'signup' : 'signin'); resetForm() }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {mode === 'signin' ? t('signInTitle') : t('signUpTitle')}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === 'signin' ? t('signInDesc') : t('signUpDesc')}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">
            ×
          </button>
        </div>

        <div className="mt-6">
          <button type="button" onClick={onSignInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-[1.25rem] border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {t('continueWithGoogle')}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">{t('orWithEmail')}</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('publicName')}</label>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder={t('publicName')}
                  className="w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('username')}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">@</span>
                  <input type="text" value={username} onChange={handleUsernameChange}
                    placeholder="tu_usuario" maxLength={20}
                    className={`w-full rounded-[1.25rem] border bg-white pl-8 pr-10 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 ${usernameStatus === 'taken' ? 'border-rose-400' : usernameStatus === 'ok' ? 'border-emerald-400' : 'border-slate-300'}`}
                    required />
                  {usernameStatus === 'checking' && <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />}
                  {usernameStatus === 'ok' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">✓</span>}
                  {usernameStatus === 'taken' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500 font-bold">✗</span>}
                </div>
                <p className="mt-1 text-xs text-slate-400">{t('usernameHint')} /user/{username || 'tu_usuario'}</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('password')}</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-[1.25rem] border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              required minLength={6} />
          </div>

          {error && <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</div>}

          <button type="submit" disabled={loading || (mode === 'signup' && usernameStatus === 'taken')}
            className="w-full rounded-[1.25rem] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400">
            {loading ? t('processing') : mode === 'signin' ? t('signInTitle') : t('signUpTitle')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button type="button" onClick={switchMode} className="text-sm text-slate-600 hover:text-slate-900">
            {mode === 'signin' ? t('noAccount') : t('hasAccount')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
