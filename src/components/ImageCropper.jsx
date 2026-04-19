import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * ImageCropper — crop interactivo sin librerías externas
 * Props:
 *   src: string (URL o objectURL)
 *   aspect: number (ej: 1 para cuadrado, 3 para banner, null para libre)
 *   onCrop: (blob) => void
 *   onCancel: () => void
 *   shape: 'rect' | 'circle' (default: 'rect')
 */
const ImageCropper = ({ src, aspect = null, onCrop, onCancel, shape = 'rect' }) => {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const containerRef = useRef(null)

  const [imgLoaded, setImgLoaded] = useState(false)
  const [drag, setDrag] = useState(null) // { type: 'move'|'resize', startX, startY, startCrop }
  const [crop, setCrop] = useState(null) // { x, y, w, h } en coordenadas del canvas display

  // Dimensiones del canvas display (no la imagen real)
  const [display, setDisplay] = useState({ w: 0, h: 0, scale: 1, offX: 0, offY: 0 })

  const initCrop = useCallback((dw, dh, imgW, imgH, scale, offX, offY) => {
    // Crop inicial centrado, 80% del área disponible
    const availW = imgW * scale
    const availH = imgH * scale
    if (aspect) {
      let cw = availW * 0.8
      let ch = cw / aspect
      if (ch > availH * 0.8) { ch = availH * 0.8; cw = ch * aspect }
      setCrop({ x: offX + (availW - cw) / 2, y: offY + (availH - ch) / 2, w: cw, h: ch })
    } else {
      const cw = availW * 0.8
      const ch = availH * 0.8
      setCrop({ x: offX + (availW - cw) / 2, y: offY + (availH - ch) / 2, w: cw, h: ch })
    }
  }, [aspect])

  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const container = containerRef.current
      if (!container) return
      const maxW = container.clientWidth
      const maxH = container.clientHeight
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      const dw = img.naturalWidth * scale
      const dh = img.naturalHeight * scale
      const offX = (maxW - dw) / 2
      const offY = (maxH - dh) / 2
      setDisplay({ w: maxW, h: maxH, scale, offX, offY, imgW: img.naturalWidth, imgH: img.naturalHeight })
      setImgLoaded(true)
      initCrop(maxW, maxH, img.naturalWidth, img.naturalHeight, scale, offX, offY)
    }
    img.src = src
  }, [src, initCrop])

  // Dibujar canvas
  useEffect(() => {
    if (!imgLoaded || !crop || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { w, h, scale, offX, offY } = display
    canvas.width = w
    canvas.height = h
    ctx.clearRect(0, 0, w, h)

    // Imagen
    ctx.drawImage(imgRef.current, offX, offY, imgRef.current.naturalWidth * scale, imgRef.current.naturalHeight * scale)

    // Overlay oscuro
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, w, h)

    // Recortar el área de crop (mostrar imagen sin overlay)
    ctx.save()
    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(crop.x + crop.w / 2, crop.y + crop.h / 2, Math.min(crop.w, crop.h) / 2, 0, Math.PI * 2)
      ctx.clip()
    } else {
      ctx.beginPath()
      ctx.rect(crop.x, crop.y, crop.w, crop.h)
      ctx.clip()
    }
    ctx.drawImage(imgRef.current, offX, offY, imgRef.current.naturalWidth * scale, imgRef.current.naturalHeight * scale)
    ctx.restore()

    // Borde del crop
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    if (shape === 'circle') {
      ctx.beginPath()
      ctx.arc(crop.x + crop.w / 2, crop.y + crop.h / 2, Math.min(crop.w, crop.h) / 2, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h)
      // Grid de tercios
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'
      ctx.lineWidth = 1
      for (let i = 1; i < 3; i++) {
        ctx.beginPath(); ctx.moveTo(crop.x + crop.w * i / 3, crop.y); ctx.lineTo(crop.x + crop.w * i / 3, crop.y + crop.h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(crop.x, crop.y + crop.h * i / 3); ctx.lineTo(crop.x + crop.w, crop.y + crop.h * i / 3); ctx.stroke()
      }
    }

    // Handles de resize (esquinas)
    if (shape !== 'circle') {
      const hs = 8
      ctx.fillStyle = 'white'
      ;[[crop.x, crop.y], [crop.x + crop.w, crop.y], [crop.x, crop.y + crop.h], [crop.x + crop.w, crop.y + crop.h]].forEach(([hx, hy]) => {
        ctx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs)
      })
    }
  }, [imgLoaded, crop, display, shape])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  const hitHandle = (pos) => {
    if (!crop || shape === 'circle') return null
    const hs = 12
    const corners = [
      { name: 'tl', x: crop.x, y: crop.y },
      { name: 'tr', x: crop.x + crop.w, y: crop.y },
      { name: 'bl', x: crop.x, y: crop.y + crop.h },
      { name: 'br', x: crop.x + crop.w, y: crop.y + crop.h },
    ]
    return corners.find(c => Math.abs(pos.x - c.x) < hs && Math.abs(pos.y - c.y) < hs)?.name ?? null
  }

  const inCrop = (pos) => {
    if (!crop) return false
    if (shape === 'circle') {
      const dx = pos.x - (crop.x + crop.w / 2)
      const dy = pos.y - (crop.y + crop.h / 2)
      return Math.sqrt(dx * dx + dy * dy) < Math.min(crop.w, crop.h) / 2
    }
    return pos.x > crop.x && pos.x < crop.x + crop.w && pos.y > crop.y && pos.y < crop.y + crop.h
  }

  const onMouseDown = (e) => {
    e.preventDefault()
    const pos = getPos(e)
    const handle = hitHandle(pos)
    if (handle) {
      setDrag({ type: 'resize', handle, startX: pos.x, startY: pos.y, startCrop: { ...crop } })
    } else if (inCrop(pos)) {
      setDrag({ type: 'move', startX: pos.x, startY: pos.y, startCrop: { ...crop } })
    }
  }

  const onMouseMove = (e) => {
    if (!drag || !crop) return
    e.preventDefault()
    const pos = getPos(e)
    const dx = pos.x - drag.startX
    const dy = pos.y - drag.startY
    const { offX, offY, scale, imgW, imgH } = display
    const minX = offX, minY = offY
    const maxX = offX + imgW * scale, maxY = offY + imgH * scale

    if (drag.type === 'move') {
      const nx = Math.max(minX, Math.min(maxX - drag.startCrop.w, drag.startCrop.x + dx))
      const ny = Math.max(minY, Math.min(maxY - drag.startCrop.h, drag.startCrop.y + dy))
      setCrop(c => ({ ...c, x: nx, y: ny }))
    } else {
      const sc = drag.startCrop
      let { x, y, w, h } = sc
      const minSize = 40

      if (drag.handle === 'br') {
        w = Math.max(minSize, Math.min(maxX - x, sc.w + dx))
        h = aspect ? w / aspect : Math.max(minSize, Math.min(maxY - y, sc.h + dy))
      } else if (drag.handle === 'bl') {
        const nw = Math.max(minSize, Math.min(sc.x + sc.w - minX, sc.w - dx))
        w = nw; x = sc.x + sc.w - nw
        h = aspect ? w / aspect : Math.max(minSize, Math.min(maxY - y, sc.h + dy))
      } else if (drag.handle === 'tr') {
        w = Math.max(minSize, Math.min(maxX - x, sc.w + dx))
        h = aspect ? w / aspect : Math.max(minSize, sc.h - dy)
        if (!aspect) y = sc.y + sc.h - h
      } else if (drag.handle === 'tl') {
        const nw = Math.max(minSize, Math.min(sc.x + sc.w - minX, sc.w - dx))
        w = nw; x = sc.x + sc.w - nw
        h = aspect ? w / aspect : Math.max(minSize, sc.h - dy)
        if (!aspect) y = sc.y + sc.h - h
      }
      setCrop({ x, y, w, h })
    }
  }

  const onMouseUp = () => setDrag(null)

  const handleCrop = () => {
    if (!crop || !imgRef.current) return
    const { scale, offX, offY } = display
    // Convertir coordenadas display → coordenadas imagen real
    const sx = (crop.x - offX) / scale
    const sy = (crop.y - offY) / scale
    const sw = crop.w / scale
    const sh = crop.h / scale

    const out = document.createElement('canvas')
    if (shape === 'circle') {
      const size = Math.min(sw, sh)
      out.width = size; out.height = size
      const ctx = out.getContext('2d')
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(imgRef.current, sx, sy, size, size, 0, 0, size, size)
    } else {
      out.width = sw; out.height = sh
      const ctx = out.getContext('2d')
      ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, sw, sh)
    }

    out.toBlob(blob => onCrop(blob), 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 z-[400] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <p className="text-sm font-semibold text-white">Ajustar imagen</p>
          <button onClick={onCancel} className="text-slate-400 hover:text-white transition text-lg leading-none">×</button>
        </div>

        {/* Canvas */}
        <div ref={containerRef} className="relative bg-slate-950" style={{ height: '420px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ cursor: drag ? 'grabbing' : 'crosshair', touchAction: 'none' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onMouseDown}
            onTouchMove={onMouseMove}
            onTouchEnd={onMouseUp}
          />
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700">
          <p className="text-xs text-slate-400">Arrastrá para mover · Esquinas para redimensionar</p>
          <div className="flex gap-2">
            <button onClick={onCancel}
              className="rounded-lg border border-slate-600 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 transition">
              Cancelar
            </button>
            <button onClick={handleCrop}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold text-white transition"
              style={{ backgroundColor: 'rgb(var(--color-accent))' }}>
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageCropper
