import Header from './components/Header'
import Footer from './components/Footer'
import GuidesSection from './components/GuidesSection'

const GuidesApp = () => (
  <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
    <Header />
    <main className="flex-1 py-6">
      <section className="mx-auto w-full max-w-none px-6">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">PrompTool</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Guias</h1>
          </div>
        </div>
      </section>
      <GuidesSection />
    </main>
    <Footer />
  </div>
)

export default GuidesApp
