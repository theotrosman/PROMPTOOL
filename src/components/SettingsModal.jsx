import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useLang } from '../contexts/LangContext'
import { supabase } from '../supabaseClient'

const ACCENT_PRESETS = [
  { label: 'Cyan', light: '6 182 212', dark: '34 211 238', light2: '8 145 178', dark2: '6 182 212' },
  { label: 'Violet', light: '124 58 237', dark: '167 139 250', light2: '109 40 217', dark2: '139 92 246' },
  { label: 'Indigo', light: '79 70 229', dark: '129 140 248', light2: '67 56 202', dark2: '99 102 241' },
  { label: 'Emerald', light: '16 185 129', dark: '52 211 153', light2: '5 150 105', dark2: '16 185 129' },
  { label: 'Rose', light: '244 63 94', dark: '251 113 133', light2: '225 29 72', dark2: '244 63 94' },
  { label: 'Amber', light: '245 158 11', dark: '251 191 36', light2: '217 119 6', dark2: '245 158 11' },
]

const SECTION = ({ title, children }) => (
  <div className="space-y-3">
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</p>
    {children}
  </div>
)

const Divider = () => <div className="h-px bg-slate-100 dark:bg-slate-800" />

export default function SettingsModal({ open, onClose, user, signOut }) {
  const { theme, setTheme } = useTheme()
  const { lang, changeLang } = useLang()

  // Password
  const [showPw, setShowPw] = useState(false)
  const [pw, setPw] = useState({ new: '', confirm: '' })
  const [pwStatus, setPwStatus] = useState(null) // null | 'saving' | 'ok' | 'error' | 'mismatch' | 'short'

  // Email
  const [showEmail, setShowEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState(null)

  // Accent color
  const [accentIdx, setAccentIdx] = useState(() => {
    return parseInt(localStorage.getItem('accentIdx') || '0', 10)
  })

  // Notifications (stored locally)
  const [notifSound, setNotifSound] = useState(() => localStorage.getItem('notifSound') !== 'off')

  const isEs = lang === 'es'

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Apply accent on change
  useEffect(() => {
    const p = ACCENT_PRESETS[accentIdx]
    const root = document.documentElement
    const isDark = root.classList.contains('dark')
    root.style.setProperty('--color-accent', isDark ? p.dark : p.light)
    root.style.setProperty('--color-accent-2', isDark ? p.dark2 : p.light2)
    localStorage.setItem('accentIdx', String(accentIdx))
    localStorage.setItem('accentPreset', JSON.stringify(p))
  }, [accentIdx, theme])

  const handleChangePw = async (e) => {
    e.preventDefault()
    if (pw.new !== pw.confirm) { setPwStatus('mismatch'); return }
    if (pw.new.length < 6) { setPwStatus('short'); return }
    setPwStatus('saving')
    const { error } = await supabase.auth.updateUser({ password: pw.new })
    if (error) { setPwStatus('error'); return }
    setPwStatus('ok')
    setPw({ new: '', confirm: '' })
    setShowPw(false)
    setTimeout(() => setPwStatus(null), 3000)
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    if (!newEmail.includes('@')) { setEmailStatus('invalid'); return }
    setEmailStatus('saving')
    const { error } = await supabase.auth.updateUser({ email: newEmail })
    if (error) { setEmailStatus('error'); return }
    setEmailStatus('ok')
    setNewEmail('')
    setShowEmail(false)
    setTimeout(() => setEmailStatus(null), 3000)
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400 dark:focus:border-slate-500 transition placeholder:text-slate-400'

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[500] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-[501] w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
        style={{ animation: 'slideInRight 0.22s cubic-bezier(0.34,1.2,0.64,1) both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <svg className="h-4 w-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {isEs ? 'Configuración' : 'Settings'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* APARIENCIA */}
          <SECTION title={isEs ? 'Apariencia' : 'Appearance'}>
            {/* Tema */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {isEs ? 'Tema' : 'Theme'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'light', label: isEs ? 'Claro' : 'Light', icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z' },
                  { key: 'dark', label: isEs ? 'Oscuro' : 'Dark', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
                ].map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key)}
                    className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                      theme === key
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                    </svg>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color de acento */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {isEs ? 'Color de acento' : 'Accent color'}
              </p>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_PRESETS.map((p, i) => {
                  const hex = '#' + p.light.split(' ').map(c => parseInt(c).toString(16).padStart(2,'0')).join('')
                  return (
                    <button
                      key={i}
                      onClick={() => setAccentIdx(i)}
                      title={p.label}
                      className={`relative h-7 w-7 rounded-full transition-all ${accentIdx === i ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: hex }}
                    >
                      {accentIdx === i && (
                        <svg className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </SECTION>

          <Divider />

          {/* IDIOMA */}
          <SECTION title={isEs ? 'Idioma' : 'Language'}>
            <div className="grid grid-cols-2 gap-2">
              {[['es', 'Español'], ['en', 'English']].map(([l, label]) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className={`rounded-xl border py-2.5 text-xs font-semibold transition-all ${
                    lang === l
                      ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </SECTION>

          <Divider />

          {/* CUENTA */}
          {user && (
            <SECTION title={isEs ? 'Cuenta' : 'Account'}>

              {/* Email actual */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                  {isEs ? 'Sesión activa' : 'Signed in as'}
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
              </div>

              {/* Cambiar contraseña */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setShowPw(f => !f); setPwStatus(null) }}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    {isEs ? 'Cambiar contraseña' : 'Change password'}
                  </span>
                  <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showPw ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showPw && (
                  <form onSubmit={handleChangePw} className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-2">
                    <input type="password" placeholder={isEs ? 'Nueva contraseña' : 'New password'} value={pw.new}
                      onChange={e => setPw(f => ({ ...f, new: e.target.value }))}
                      className={inputCls} minLength={6} required />
                    <input type="password" placeholder={isEs ? 'Confirmar contraseña' : 'Confirm password'} value={pw.confirm}
                      onChange={e => setPw(f => ({ ...f, confirm: e.target.value }))}
                      className={inputCls} minLength={6} required />
                    {pwStatus === 'mismatch' && <p className="text-xs text-rose-500">{isEs ? 'Las contraseñas no coinciden' : 'Passwords do not match'}</p>}
                    {pwStatus === 'short' && <p className="text-xs text-rose-500">{isEs ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}</p>}
                    {pwStatus === 'error' && <p className="text-xs text-rose-500">{isEs ? 'Error al cambiar la contraseña' : 'Error changing password'}</p>}
                    {pwStatus === 'ok' && <p className="text-xs text-emerald-600 dark:text-emerald-400">{isEs ? 'Contraseña actualizada' : 'Password updated'}</p>}
                    <button type="submit" disabled={pwStatus === 'saving'}
                      className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 py-2.5 text-xs font-semibold text-white dark:text-slate-900 transition hover:opacity-90 disabled:opacity-50">
                      {pwStatus === 'saving' ? '...' : (isEs ? 'Guardar' : 'Save')}
                    </button>
                  </form>
                )}
              </div>

              {/* Cambiar email */}
              <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setShowEmail(f => !f); setEmailStatus(null) }}
                  className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {isEs ? 'Cambiar email' : 'Change email'}
                  </span>
                  <svg className={`h-3.5 w-3.5 text-slate-400 transition-transform ${showEmail ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showEmail && (
                  <form onSubmit={handleChangeEmail} className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-2">
                    <input type="email" placeholder={isEs ? 'Nuevo email' : 'New email address'} value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className={inputCls} required />
                    {emailStatus === 'invalid' && <p className="text-xs text-rose-500">{isEs ? 'Email invalido' : 'Invalid email'}</p>}
                    {emailStatus === 'error' && <p className="text-xs text-rose-500">{isEs ? 'Error al actualizar el email' : 'Error updating email'}</p>}
                    {emailStatus === 'ok' && <p className="text-xs text-emerald-600 dark:text-emerald-400">{isEs ? 'Revisa tu bandeja para confirmar' : 'Check your inbox to confirm'}</p>}
                    <button type="submit" disabled={emailStatus === 'saving'}
                      className="w-full rounded-xl bg-slate-900 dark:bg-slate-100 py-2.5 text-xs font-semibold text-white dark:text-slate-900 transition hover:opacity-90 disabled:opacity-50">
                      {emailStatus === 'saving' ? '...' : (isEs ? 'Guardar' : 'Save')}
                    </button>
                  </form>
                )}
              </div>

            </SECTION>
          )}

          <Divider />

          {/* NOTIFICACIONES */}
          <SECTION title={isEs ? 'Notificaciones' : 'Notifications'}>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {isEs ? 'Sonido de notificaciones' : 'Notification sounds'}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notifSound}
                onClick={() => {
                  const next = !notifSound
                  setNotifSound(next)
                  localStorage.setItem('notifSound', next ? 'on' : 'off')
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  notifSound
                    ? 'settings-toggle-on bg-slate-900 dark:bg-slate-200'
                    : 'settings-toggle-off bg-slate-200 dark:bg-slate-700'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out dark:bg-slate-900 ${
                    notifSound ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </SECTION>

        </div>

        {/* Footer — Cerrar sesión */}
        {user && (
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 p-4">
            <button
              onClick={() => { signOut(); onClose() }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-950/50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {isEs ? 'Cerrar sesion' : 'Sign out'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
