import { useEffect, useState } from 'react'

const ImageCard = ({ mode, data, loading }) => {
  const [aspectRatio, setAspectRatio] = useState('4 / 3')
  const isDaily = mode === 'daily'
  const imageUrl = data?.imageUrl ?? '/sample.jpg'
  const difficulty = data?.dificultad ?? 'Media'
  const tema = data?.tematica ?? 'Fantástica'
  const modeLabel = isDaily ? 'Diario' : 'Random'

  useEffect(() => {
    if (!data?.imageUrl) return
    const img = new Image()
    img.src = data.imageUrl
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`)
      }
    }
  }, [data?.imageUrl])

  return (
    <div className="flex w-full flex-col gap-6 text-left">
      <div
        className="relative w-full overflow-hidden rounded-[2rem] bg-slate-100 ring-1 ring-slate-200/60"
        style={{ aspectRatio }}
      >
        {loading ? (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            Cargando imagen…
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Imagen de referencia"
            className="h-full w-full object-cover"
          />
        )}

        <div className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-2 text-xs uppercase tracking-[0.32em] text-white">
          Modo {modeLabel}
        </div>

        <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
          <div className="rounded-[1.75rem] bg-slate-950/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white">
            Dificultad: {difficulty}
          </div>
          <div className="rounded-[1.75rem] bg-slate-950/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white">
            Temática: {tema}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageCard
