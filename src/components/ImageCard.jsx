import { useEffect, useState } from 'react'

const ImageCard = ({ mode, data, loading }) => {
  const [aspectRatio, setAspectRatio] = useState('4 / 3')
  const [previewOpen, setPreviewOpen] = useState(false)
  const imageUrl =
    data?.imageUrl ||
    data?.image ||
    data?.image_url ||
    data?.url ||
    '/sample.jpg'

  useEffect(() => {
    if (!imageUrl) return
    const img = new Image()
    img.src = imageUrl
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        setAspectRatio(`${img.naturalWidth} / ${img.naturalHeight}`)
      }
    }
  }, [imageUrl])

  useEffect(() => {
    if (!previewOpen) return

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setPreviewOpen(false)
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [previewOpen])

  return (
    <>
      <div className="flex w-full flex-col gap-6 text-left">
      <div
        className={`relative w-full overflow-hidden rounded-[2rem] bg-slate-100 ring-1 ring-slate-200/60 ${loading ? '' : 'cursor-zoom-in'}`}
        style={{ aspectRatio }}
        onClick={() => {
          if (!loading) setPreviewOpen(true)
        }}
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

      </div>
      </div>

      {previewOpen && !loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-[2px]"
          onClick={() => setPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de la imagen"
        >
          <div className="relative inline-block" onClick={(event) => event.stopPropagation()}>
            <img
              src={imageUrl}
              alt="Imagen de referencia ampliada"
              className="max-h-[90vh] max-w-[92vw] rounded-[1.5rem] object-contain"
            />

            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute right-3 top-3 z-10 text-3xl font-semibold leading-none text-white/95 transition hover:text-white"
              aria-label="Cerrar vista ampliada"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ImageCard
