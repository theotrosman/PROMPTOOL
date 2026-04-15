const Footer = () => (
  <footer className="w-full border-t border-slate-200/70 bg-white py-10">
    <div className="mx-auto w-full max-w-7xl px-6">
      <div className="grid gap-8 xl:grid-cols-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Detalles del juego
          </p>
          <h3 className="mt-3 text-xl font-semibold text-slate-900">Promptle diario</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Una base sólida para conectar la API, el sistema diario y la lógica de scoring más adelante.
          </p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Progreso</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li>Prompt enviados hoy: <span className="font-semibold text-slate-900">0</span></li>
            <li>Streak actual: <span className="font-semibold text-slate-900">3 días</span></li>
            <li>Score promedio: <span className="font-semibold text-slate-900">Pendiente</span></li>
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Meta del día</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li>Capturar una escena clara</li>
            <li>Priorizar luz y atmósfera</li>
            <li>Evitar prompts generales</li>
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Infraestructura</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li>JSON local mimetiza API</li>
            <li>Componentes listos para escalar</li>
            <li>UI preparada para daily challenge</li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer
