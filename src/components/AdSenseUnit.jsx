import { useEffect, useRef } from 'react'

const PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID

const REAL_SLOT = /^\d{9,10}$/

const AdSenseUnit = ({ slot, format = 'auto', style = {} }) => {
  const ref = useRef(null)
  const pushed = useRef(false)
  const isReady = PUBLISHER_ID && REAL_SLOT.test(slot)

  useEffect(() => {
    if (!isReady || pushed.current) return
    pushed.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (_) {}
  }, [isReady])

  if (!isReady) {
    return (
      <div
        className="flex items-center justify-center rounded border border-dashed border-slate-200 text-slate-400 text-[10px] text-center leading-tight p-2 w-full h-full min-h-[250px]"
        style={style}
      >
        Ad<br />160×600
      </div>
    )
  }

  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: 'block', width: '100%', height: '100%', minHeight: 250, ...style }}
      data-ad-client={PUBLISHER_ID}
      data-ad-slot={slot}
      data-ad-format="autorelaxed"
      data-full-width-responsive="true"
    />
  )
}

export default AdSenseUnit
