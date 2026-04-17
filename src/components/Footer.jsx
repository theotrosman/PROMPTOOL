const Footer = () => (
  <footer className="w-full border-t border-slate-200/70 bg-white py-10">
    <div className="mx-auto w-full max-w-7xl px-6">
      <div className="grid gap-8 xl:grid-cols-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">
            Herramienta
          </p>
          <h3 className="mt-3 text-xl font-semibold text-slate-900">Promptle</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Una herramienta para escribir prompts y recibir feedback inmediato en forma de score.
          </p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Indicadores</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li>Prompts enviados: <span className="font-semibold text-slate-900">0</span></li>
            <li>Sesión activa: <span className="font-semibold text-slate-900">Libre</span></li>
            <li>Score promedio: <span className="font-semibold text-slate-900">Pendiente</span></li>
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Objetivos</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li>Claridad en el prompt</li>
            <li>Detalles visuales precisos</li>
            <li>Resultados más útiles</li>
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Infraestructura</p>
          <ul className="mt-3 space-y-3 text-sm text-slate-700">
            <li>Interfaz ligera</li>
            <li>Componentes listos para escalar</li>
            <li>Modo Random para promptear libremente</li>
          </ul>
        </div>
      </div>
    </div>
  </footer>
)

export default Footer
