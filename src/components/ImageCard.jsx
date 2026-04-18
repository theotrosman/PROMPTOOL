import { useEffect, useState } from 'react'

const ImageCard = ({ mode, data, imageStatus }) => {
  const [aspectRatio, setAspectRatio] = useState('4 / 3')
  const [previewOpen, setPreviewOpen] = useState(false)
  const imageUrl = data?.url_image || ''

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
    const onKeyDown = (e) => e.key === 'Escape' && setPreviewOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [previewOpen])

  const renderContent = () => {
    if (imageStatus === 'loading') {
      return (
        <div className="flex h-full w-full items-center justify-center text-slate-400">
          Cargando imagen…
        </div>
      )
    }

    if (imageStatus === 'empty') {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm font-semibold text-slate-700">No hay imágenes disponibles</p>
          <p className="text-xs text-slate-500">Intenta cambiar la dificultad en Configurar</p>
        </div>
      )
    }

    if (imageStatus === 'error') {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
          <svg className="h-12 w-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-semibold text-slate-700">Error de conexión</p>
          <p className="text-xs text-slate-500">Verifica tu conexión a Supabase</p>
        </div>
      )
    }

    // imageStatus === 'ok'
    return (
      <img
        src={imageUrl}
        alt="Imagen de referencia"
        className="h-full w-full object-cover cursor-zoom-in"
        onClick={() => setPreviewOpen(true)}
      />
    )
  }

  return (
    <>
      <div className="flex w-full flex-col gap-6 text-left">
        <div
          className="relative w-full overflow-hidden rounded-[2rem] bg-slate-100 ring-1 ring-slate-200/60"
          style={{ aspectRatio }}
        >
          {renderContent()}
        </div>
      </div>

      {previewOpen && imageStatus === 'ok' && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-[2px]"
          onClick={() => setPreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Vista ampliada de la imagen"
        >
          <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
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
