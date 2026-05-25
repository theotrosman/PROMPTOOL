import { useLang } from '../contexts/LangContext'

/** Enlace destacado a FAQ pública (visible sin login). */
const PublicFaqBanner = () => {
  const { lang } = useLang()
  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 mb-8">
      <p className="text-sm font-semibold text-violet-900">
        {lang === 'en' ? 'Looking for quick answers?' : '¿Buscás respuestas rápidas?'}
      </p>
      <p className="mt-1 text-sm text-violet-800/90 leading-relaxed">
        {lang === 'en'
          ? 'Visit our public FAQ with detailed explanations about scoring, accounts, guides, and teams — no sign-in required.'
          : 'Visitá nuestras preguntas frecuentes con explicaciones sobre puntajes, cuentas, guías y equipos — sin iniciar sesión.'}
      </p>
      <a
        href="/faq"
        className="mt-3 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900 underline underline-offset-2"
      >
        {lang === 'en' ? 'Read the FAQ →' : 'Ver preguntas frecuentes →'}
      </a>
    </div>
  )
}

export default PublicFaqBanner
