import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useLang } from '../contexts/LangContext'

const AuthModal = ({ open, onClose, onSignInWithGoogle, onSignInWithEmail, onSignUpWithEmail }) => {
  const { t, lang } = useLang()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptEmails, setAcceptEmails] = useState(false)

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
        if (!acceptTerms) {
          setError(lang === 'en' ? 'You must accept the terms to continue.' : 'Tenés que aceptar los términos para continuar.')
          setLoading(false); return
        }
        await onSignUpWithEmail(email, password, nombre, username)
        // Guardar preferencia de emails
        if (acceptEmails) {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) supabase.from('usuarios').update({ email_marketing: true }).eq('id_usuario', user.id)
        }
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

  const resetForm = () => {
    setEmail(''); setPassword(''); setNombre(''); setUsername('')
    setUsernameStatus(null); setError(''); setAcceptTerms(false); setAcceptEmails(false)
  }
  const switchMode = () => { setMode(m => m === 'signin' ? 'signup' : 'signin'); resetForm() }

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"

  const canSubmit = mode === 'signin'
    ? !loading
    : !loading && usernameStatus !== 'taken' && acceptTerms

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {mode === 'signin'
                  ? (lang === 'en' ? 'Sign in' : 'Iniciar sesión')
                  : (lang === 'en' ? 'Create account' : 'Crear cuenta')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {mode === 'signin'
                  ? (lang === 'en' ? 'Welcome back to PrompTool' : 'Bienvenido de vuelta')
                  : (lang === 'en' ? 'Join the PrompTool community' : 'Unite a la comunidad')}
              </p>
            </div>
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition text-lg leading-none">×</button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-3">
          {/* Google */}
          <button type="button" onClick={onSignInWithGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {lang === 'en' ? 'Continue with Google' : 'Continuar con Google'}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs text-slate-400">{lang === 'en' ? 'or' : 'o'}</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'signup' && (
              <>
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                  placeholder={lang === 'en' ? 'Display name' : 'Nombre visible'}
                  className={inputClass} required />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">@</span>
                  <input type="text" value={username} onChange={handleUsernameChange}
                    placeholder="username" maxLength={20}
                    className={`${inputClass} pl-8 pr-9 ${usernameStatus === 'taken' ? 'border-rose-300' : usernameStatus === 'ok' ? 'border-emerald-300' : ''}`}
                    required />
                  {usernameStatus === 'checking' && <div className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />}
                  {usernameStatus === 'ok' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-500">✓</span>}
                  {usernameStatus === 'taken' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-rose-500">✗</span>}
                </div>
              </>
            )}

            <input type="text" value={email} onChange={e => setEmail(e.target.value)}
              placeholder={mode === 'signin' ? (lang === 'en' ? 'Email or @username' : 'Email o @usuario') : 'Email'}
              className={inputClass} required />

            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder={lang === 'en' ? 'Password' : 'Contraseña'}
              className={inputClass} required minLength={6} />

            {/* Checkboxes solo en signup */}
            {mode === 'signup' && (
              <div className="space-y-2 pt-1">
                {/* Términos — obligatorio */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition ${acceptTerms ? 'border-transparent' : 'border-slate-300 group-hover:border-slate-400'}`}
                    style={acceptTerms ? { backgroundColor: 'rgb(var(--color-accent))' } : {}}
                    onClick={() => setAcceptTerms(v => !v)}>
                    {acceptTerms && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <span className="text-xs text-slate-600 leading-relaxed">
                    {lang === 'en' ? 'I accept the ' : 'Acepto los '}
                    <a href="/terms" target="_blank" className="font-medium text-slate-900 underline underline-offset-2 hover:no-underline">
                      {lang === 'en' ? 'Terms of Service' : 'Términos de Servicio'}
                    </a>
                    {lang === 'en' ? ' and ' : ' y la '}
                    <a href="/privacy" target="_blank" className="font-medium text-slate-900 underline underline-offset-2 hover:no-underline">
                      {lang === 'en' ? 'Privacy Policy' : 'Política de Privacidad'}
                    </a>
                    <span className="text-rose-500 ml-0.5">*</span>
                  </span>
                </label>

                {/* Emails — opcional */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition ${acceptEmails ? 'border-transparent' : 'border-slate-300 group-hover:border-slate-400'}`}
                    style={acceptEmails ? { backgroundColor: 'rgb(var(--color-accent))' } : {}}
                    onClick={() => setAcceptEmails(v => !v)}>
                    {acceptEmails && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <span className="text-xs text-slate-500 leading-relaxed">
                    {lang === 'en'
                      ? 'Send me updates about new features, tournaments and tips.'
                      : 'Quiero recibir novedades sobre nuevas funciones, torneos y tips.'}
                    <span className="ml-1 text-slate-400">{lang === 'en' ? '(optional)' : '(opcional)'}</span>
                  </span>
                </label>
              </div>
            )}

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={!canSubmit}
              className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
              style={{ backgroundColor: 'rgb(var(--color-accent))' }}>
              {loading ? '...' : mode === 'signin'
                ? (lang === 'en' ? 'Sign in' : 'Iniciar sesión')
                : (lang === 'en' ? 'Create account' : 'Crear cuenta')}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            {mode === 'signin'
              ? (lang === 'en' ? "Don't have an account? " : '¿No tenés cuenta? ')
              : (lang === 'en' ? 'Already have an account? ' : '¿Ya tenés cuenta? ')}
            <button onClick={switchMode} className="font-medium text-slate-700 hover:text-slate-900 transition">
              {mode === 'signin'
                ? (lang === 'en' ? 'Sign up' : 'Registrate')
                : (lang === 'en' ? 'Sign in' : 'Iniciá sesión')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
