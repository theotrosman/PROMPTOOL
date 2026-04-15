const ImageCard = ({ challenge, loading }) => (
  <div className="flex w-full flex-col gap-6 text-left">
    <div className="relative h-[320px] w-full overflow-hidden rounded-[2rem] bg-slate-100/95 ring-1 ring-slate-200/60">
      {loading ? (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          Cargando imagen…
        </div>
      ) : challenge ? (
        <img
          src={challenge.imageUrl}
          alt={challenge.prompt}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-6 text-slate-400">
          Imagen no disponible
        </div>
      )}
    </div>

    <div className="space-y-2">
      <div className="inline-flex rounded-full border border-slate-200/70 px-4 py-2 text-xs uppercase tracking-[0.32em] text-slate-500">
        Daily challenge
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
        {challenge ? `Reto del ${challenge.date}` : 'Próximamente'}
      </h2>
      <p className="text-sm leading-7 text-slate-600">
        {challenge?.prompt ?? 'El prompt diario aparecerá aquí cuando se cargue.'}
      </p>
    </div>
  </div>
)

export default ImageCard
