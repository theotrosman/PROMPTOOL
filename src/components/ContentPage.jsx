import Header from './Header'
import Footer from './Footer'
import { useLang } from '../contexts/LangContext'

/**
 * Layout para páginas editoriales (About, FAQ).
 */
const ContentPage = ({ title, subtitle, updated, children, footerNote }) => {
  const { lang } = useLang()

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 sm:px-6 py-10 sm:py-14">
        <header className="mb-10 border-b border-slate-100 pb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600">
            PrompTool
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
              {subtitle}
            </p>
          )}
          {updated && (
            <p className="mt-2 text-sm text-slate-400">
              {lang === 'en' ? 'Last updated: ' : 'Última actualización: '}
              {updated}
            </p>
          )}
        </header>
        <article className="prose-editorial space-y-10">{children}</article>
        {footerNote && (
          <p className="mt-12 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-8">
            {footerNote}
          </p>
        )}
      </main>
      <Footer />
    </div>
  )
}

export const EditorialSection = ({ title, paragraphs, list }) => (
  <section className="space-y-4">
    <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
    {paragraphs?.map((p, i) => (
      <p key={i} className="text-sm sm:text-base text-slate-600 leading-7">
        {p}
      </p>
    ))}
    {list?.length > 0 && (
      <ul className="list-disc pl-5 space-y-2 text-sm sm:text-base text-slate-600 leading-7">
        {list.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    )}
  </section>
)

export default ContentPage
