const Header = () => (
  <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-xl transition-shadow duration-300 ease-out hover:shadow-sm">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="text-2xl font-semibold tracking-tight text-slate-900 transition-colors duration-300 ease-out hover:text-slate-700"
        >
          PrompTool
        </a>
      </div>

      <nav className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-1 text-sm text-slate-600 md:flex">
        <a href="/guides.html" className="rounded-xl px-4 py-2 transition-all duration-300 ease-out hover:-translate-y-px hover:bg-white hover:text-slate-900">
          Guias
        </a>
        <a href="#estadisticas" className="rounded-xl px-4 py-2 transition-all duration-300 ease-out hover:-translate-y-px hover:bg-white hover:text-slate-900">
          Estadisticas
        </a>
        <a href="#retos" className="rounded-xl px-4 py-2 transition-all duration-300 ease-out hover:-translate-y-px hover:bg-white hover:text-slate-900">
          Retos
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 transition-all duration-300 ease-out hover:-translate-y-px hover:border-slate-300 hover:bg-white">
          KI
        </div>
      </div>
    </div>
  </header>
)

export default Header
