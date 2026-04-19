import Header from './components/Header'
import Footer from './components/Footer'
import GuidesSection from './components/GuidesSection'
import { useLang } from './contexts/LangContext'
import { useAuth } from './hooks/useAuth'
import AuthModal from './components/AuthModal'
import { useState } from 'react'

const GuidesApp = () => {
  const { lang } = useLang()
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <h2 className="text-xl font-semibold text-slate-800">
            {lang === 'en' ? 'Sign in to access the guides' : 'Iniciá sesión para acceder a las guías'}
          </h2>
          <p className="text-sm text-slate-500 max-w-xs">
            {lang === 'en'
              ? 'The guides are available to registered users only.'
              : 'Las guías están disponibles solo para usuarios registrados.'}
          </p>
          <button onClick={() => setAuthOpen(true)}
            className="mt-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition"
            style={{ backgroundColor: 'rgb(var(--color-accent))' }}>
            {lang === 'en' ? 'Sign in' : 'Iniciar sesión'}
          </button>
        </main>
        <Footer />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)}
          onSignInWithGoogle={signInWithGoogle}
          onSignInWithEmail={signInWithEmail}
          onSignUpWithEmail={signUpWithEmail} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-1 py-6">
        <section className="mx-auto w-full max-w-none px-6">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-6 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">PrompTool</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                {lang === 'en' ? 'Guides' : 'Guías'}
              </h1>
            </div>
            <p className="text-sm text-slate-500 hidden sm:block">
              {lang === 'en'
                ? 'Learn how to write better prompts for AI image generation.'
                : 'Aprendé a escribir mejores prompts para generación de imágenes con IA.'}
            </p>
          </div>
        </section>
        <GuidesSection />
      </main>
      <Footer />
    </div>
  )
}

export default GuidesApp
