const Header = () => (
  <header className="border-b border-slate-200 bg-white/90 backdrop-blur-xl">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Promptle
        </div>
        <p className="text-sm text-slate-500">imagen | diario</p>
      </div>

      <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
        <a href="#explorar" className="transition hover:text-slate-900">
          Explorar
        </a>
        <a href="#reglas" className="transition hover:text-slate-900">
          Reglas
        </a>
        <a href="#perfil" className="transition hover:text-slate-900">
          Perfil
        </a>
      </nav>

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700">
          KI
        </div>
      </div>
    </div>
  </header>
)

export default Header
