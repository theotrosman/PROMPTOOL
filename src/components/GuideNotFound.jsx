import Header from './Header'
import Footer from './Footer'
import { useLang } from '../contexts/LangContext'
import { guidesIndexPath } from '../utils/guideRoutes'

const GuideNotFound = () => {
  const { lang } = useLang()
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold text-slate-900">
          {lang === 'en' ? 'Guide not found' : 'Guía no encontrada'}
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          {lang === 'en'
            ? 'This guide does not exist in our public library.'
            : 'Esta guía no existe en nuestra biblioteca pública.'}
        </p>
        <a
          href={guidesIndexPath()}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition"
        >
          {lang === 'en' ? 'Back to guides' : 'Volver a las guías'}
        </a>
      </main>
      <Footer />
    </div>
  )
}

export default GuideNotFound
