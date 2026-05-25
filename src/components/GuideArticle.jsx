import { useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import { useLang } from '../contexts/LangContext'
import { guideArticlePath, guideInteractivePath, guidesIndexPath } from '../utils/guideRoutes'

const SITE_ORIGIN = 'https://promptool.vercel.app'

const LessonBlocks = ({ blocks }) => (
  <div className="space-y-6">
    {blocks.map((block, i) => (
      <div key={i}>
        {block.heading && (
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{block.heading}</h3>
        )}
        {block.body && (
          <p className="text-sm sm:text-base text-slate-600 leading-7 whitespace-pre-line">{block.body}</p>
        )}
        {block.bullets?.length > 0 && (
          <ul className="mt-2 list-disc pl-5 space-y-1.5 text-sm sm:text-base text-slate-600 leading-7">
            {block.bullets.map((b, j) => (
              <li key={j}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    ))}
  </div>
)

const GuideArticle = ({ guide }) => {
  const { lang } = useLang()
  const canonical = `${SITE_ORIGIN}${guideArticlePath(guide.id)}`

  useEffect(() => {
    document.title = `${guide.title} — PrompTool`

    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('description', guide.summary)
    setMeta('robots', 'index, follow')

    let canonicalEl = document.querySelector('link[rel="canonical"]')
    if (!canonicalEl) {
      canonicalEl = document.createElement('link')
      canonicalEl.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalEl)
    }
    canonicalEl.setAttribute('href', canonical)

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.summary,
      url: canonical,
      inLanguage: lang === 'en' ? 'en' : 'es',
      author: { '@type': 'Organization', name: 'PrompTool' },
      publisher: { '@type': 'Organization', name: 'PrompTool' },
      isAccessibleForFree: true,
    }

    let scriptEl = document.getElementById('guide-article-jsonld')
    if (!scriptEl) {
      scriptEl = document.createElement('script')
      scriptEl.id = 'guide-article-jsonld'
      scriptEl.type = 'application/ld+json'
      document.head.appendChild(scriptEl)
    }
    scriptEl.textContent = JSON.stringify(jsonLd)

    return () => {
      document.getElementById('guide-article-jsonld')?.remove()
    }
  }, [guide.id, guide.title, guide.summary, lang, canonical])

  const ui = lang === 'en'
    ? {
        breadcrumbGuides: 'Guides',
        lesson: 'Lesson',
        takeaway: 'Key takeaway',
        steps: 'Steps to apply',
        drills: 'Practice drills',
        quiz: 'Knowledge check',
        interactive: 'Practice with interactive activities',
        allGuides: '← All guides',
        related: 'More guides',
      }
    : {
        breadcrumbGuides: 'Guías',
        lesson: 'Lección',
        takeaway: 'Idea clave',
        steps: 'Pasos para aplicar',
        drills: 'Ejercicios de práctica',
        quiz: 'Chequeo de conocimiento',
        interactive: 'Practicar con actividades interactivas',
        allGuides: '← Todas las guías',
        related: 'Más guías',
      }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 sm:px-6 py-8 sm:py-12">
        <nav className="text-sm text-slate-500 mb-6" aria-label="Breadcrumb">
          <a href={guidesIndexPath()} className="hover:text-slate-800 transition">
            {ui.breadcrumbGuides}
          </a>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-slate-700 font-medium line-clamp-1">{guide.title}</span>
        </nav>

        <article itemScope itemType="https://schema.org/Article">
          <header className="mb-8 border-b border-slate-100 pb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-2">
              PrompTool · {lang === 'en' ? 'Prompt engineering' : 'Prompt engineering'}
            </p>
            <h1 itemProp="headline" className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {guide.title}
            </h1>
            <p itemProp="description" className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
              {guide.summary}
            </p>
          </header>

          {guide.lesson && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                {guide.lesson.title || ui.lesson}
              </h2>
              <LessonBlocks blocks={guide.lesson.blocks || []} />
              {guide.lesson.takeaway && (
                <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-violet-700 mb-1">
                    {ui.takeaway}
                  </p>
                  <p className="text-sm sm:text-base text-violet-900 leading-relaxed">{guide.lesson.takeaway}</p>
                </div>
              )}
            </section>
          )}

          {guide.steps?.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">{ui.steps}</h2>
              <ol className="list-decimal pl-5 space-y-2 text-sm sm:text-base text-slate-600 leading-7">
                {guide.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </section>
          )}

          {guide.drills?.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">{ui.drills}</h2>
              <ul className="space-y-3">
                {guide.drills.map((drill, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:text-base text-slate-700 leading-relaxed"
                  >
                    {drill}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {guide.lesson?.quiz && (
            <section className="mb-10">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">{ui.quiz}</h2>
              <p className="text-sm sm:text-base font-medium text-slate-800 mb-3">
                {guide.lesson.quiz.question}
              </p>
              <ul className="space-y-2 mb-4">
                {guide.lesson.quiz.options?.map((opt, i) => (
                  <li key={i} className="text-sm text-slate-600 pl-4 border-l-2 border-slate-200">
                    {opt}
                  </li>
                ))}
              </ul>
              {guide.lesson.quiz.explanation && (
                <p className="text-sm text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700">
                    {lang === 'en' ? 'Explanation: ' : 'Explicación: '}
                  </span>
                  {guide.lesson.quiz.explanation}
                </p>
              )}
            </section>
          )}

          {guide.checkpoints?.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                {lang === 'en' ? 'Completion checklist' : 'Lista de verificación'}
              </h2>
              <ul className="space-y-2">
                {guide.checkpoints.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {c}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 border-t border-slate-100 pt-8">
          <a
            href={guideInteractivePath(guide.id)}
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white transition"
            style={{ backgroundColor: 'rgb(var(--color-accent))' }}
          >
            {ui.interactive}
          </a>
          <a
            href={guidesIndexPath()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            {ui.allGuides}
          </a>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default GuideArticle
