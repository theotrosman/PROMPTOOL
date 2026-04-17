const PromptInput = ({ promptUsuario, setPromptUsuario, onSubmit, isLoading }) => (
  <form className="space-y-4" onSubmit={onSubmit}>
    <label className="block text-sm font-medium text-slate-700">
      Escribe tu prompt
    </label>
    <textarea
      value={promptUsuario}
      onChange={(event) => setPromptUsuario(event.target.value)}
      rows="4"
      placeholder="Ingresa el Prompt que crees que generó la imagen de la derecha"
      className="w-full min-h-[130px] resize-none rounded-[1.75rem] border border-slate-200 bg-transparent px-5 py-4 text-base text-slate-900 outline-none transition focus:border-slate-400 focus:ring-0"
    />
    <p className="text-sm text-slate-500">
      Recomendación: menciona ambiente, estilo o iluminación, y enfócate en objetos concretos.
    </p>
    <button
      type="submit"
      disabled={isLoading}
      className="inline-flex w-full items-center justify-center rounded-[1.75rem] bg-slate-900 px-6 py-3 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {isLoading ? 'Analizando...' : 'Analizar con IA'}
    </button>
  </form>
)

export default PromptInput
