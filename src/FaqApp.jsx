import ContentPage from './components/ContentPage'
import { useLang } from './contexts/LangContext'
import { faqContent } from './data/siteContent'

export default function FaqApp() {
  const { lang } = useLang()
  const c = faqContent[lang] || faqContent.es

  return (
    <ContentPage title={c.title} subtitle={c.subtitle} footerNote={c.contact}>
      <div className="space-y-6">
        {c.items.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-slate-200 bg-slate-50/50 open:bg-white open:shadow-sm transition"
          >
            <summary className="cursor-pointer list-none px-5 py-4 font-semibold text-slate-900 flex items-center justify-between gap-3">
              <span>{item.q}</span>
              <span className="text-slate-400 group-open:rotate-180 transition-transform shrink-0" aria-hidden>
                ▾
              </span>
            </summary>
            <div className="px-5 pb-4 text-sm sm:text-base text-slate-600 leading-7 border-t border-slate-100 pt-3">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </ContentPage>
  )
}
