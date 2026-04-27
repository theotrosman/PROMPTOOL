/**
 * useWindowFocus
 *
 * Detecta cuando el usuario abandona la ventana durante el juego.
 * Casos que cubre:
 * - Windows+Shift+S (herramienta de recorte) → pierde foco ~1-3s
 * - Alt+Tab a otra app (ChatGPT, etc.)
 * - Minimizar ventana
 * - Cambiar de pestaña en el navegador
 *
 * Registra:
 * - Cantidad de veces que perdió foco
 * - Duración total fuera de foco
 * - Duración máxima de una ausencia (>10s = fue a consultar algo)
 * - Si perdió foco justo después de que apareció la imagen (señal fuerte)
 */

import { useCallback, useEffect, useRef } from 'react'

// Ausencia mayor a este tiempo = fue a consultar algo (no solo cambió de app accidentalmente)
const SUSPICIOUS_ABSENCE_MS = 8000
// Ausencia muy corta = probablemente Win+Shift+S o similar
const SCREENSHOT_ABSENCE_MS = 500
const SCREENSHOT_ABSENCE_MAX_MS = 4000

export const useWindowFocus = ({ enabled = true } = {}) => {
  const state = useRef({
    // Cuántas veces perdió foco
    blurCount: 0,
    // Cuándo fue el último blur
    lastBlurAt: null,
    // Ausencias registradas [{ duration, at }]
    absences: [],
    // Timestamp de cuando se activó el tracking (imagen cargada)
    trackingStartedAt: null,
    // Si ya se está trackeando
    active: false,
  })

  const start = useCallback(() => {
    state.current.trackingStartedAt = Date.now()
    state.current.active = true
    state.current.blurCount = 0
    state.current.absences = []
    state.current.lastBlurAt = null
  }, [])

  const stop = useCallback(() => {
    state.current.active = false
  }, [])

  const reset = useCallback(() => {
    state.current = {
      blurCount: 0,
      lastBlurAt: null,
      absences: [],
      trackingStartedAt: null,
      active: false,
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleBlur = () => {
      if (!state.current.active) return
      state.current.blurCount++
      state.current.lastBlurAt = Date.now()
    }

    const handleFocus = () => {
      if (!state.current.active || !state.current.lastBlurAt) return
      const duration = Date.now() - state.current.lastBlurAt
      state.current.absences.push({
        duration,
        at: state.current.lastBlurAt,
        sinceStart: state.current.trackingStartedAt
          ? state.current.lastBlurAt - state.current.trackingStartedAt
          : null,
      })
      state.current.lastBlurAt = null
    }

    // visibilitychange cubre cambio de pestaña
    const handleVisibility = () => {
      if (document.hidden) handleBlur()
      else handleFocus()
    }

    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [enabled])

  /**
   * Devuelve el reporte de comportamiento de foco para el análisis.
   */
  const getReport = useCallback(() => {
    const s = state.current
    const absences = s.absences

    const totalAbsenceMs = absences.reduce((acc, a) => acc + a.duration, 0)
    const maxAbsenceMs = absences.length > 0 ? Math.max(...absences.map(a => a.duration)) : 0

    // Ausencias que parecen screenshot (muy cortas, <4s)
    const screenshotLikeCount = absences.filter(
      a => a.duration >= SCREENSHOT_ABSENCE_MS && a.duration <= SCREENSHOT_ABSENCE_MAX_MS
    ).length

    // Ausencias largas — fue a consultar algo
    const longAbsenceCount = absences.filter(a => a.duration >= SUSPICIOUS_ABSENCE_MS).length

    // Ausencia muy temprana — perdió foco en los primeros 5s de ver la imagen
    const earlyAbsenceCount = absences.filter(
      a => a.sinceStart !== null && a.sinceStart < 5000
    ).length

    return {
      blurCount: s.blurCount,
      absenceCount: absences.length,
      totalAbsenceMs,
      maxAbsenceMs,
      screenshotLikeCount,
      longAbsenceCount,
      earlyAbsenceCount,
    }
  }, [])

  return { start, stop, reset, getReport }
}
