import ContentPage, { EditorialSection } from './components/ContentPage'
import { useLang } from './contexts/LangContext'
import { aboutContent } from './data/siteContent'

export default function AboutApp() {
  const { lang } = useLang()
  const c = aboutContent[lang] || aboutContent.es

  return (
    <ContentPage title={c.title} updated={c.updated}>
      {c.sections.map((section, i) => (
        <EditorialSection
          key={i}
          title={section.title}
          paragraphs={section.paragraphs}
          list={section.list}
        />
      ))}
    </ContentPage>
  )
}
