/**
 * useTypingBehavior
 *
 * Trackea el comportamiento de escritura en tiempo real para detectar
 * patrones no humanos. Captura:
 *
 * 1. Intervalos entre teclas (inter-key timing)
 * 2. Backspaces / correcciones
 * 3. Pausas largas (el usuario piensa)
 * 4. Burst events — muchos caracteres en muy poco tiempo
 * 5. Ratio de edición (cuánto del texto final fue reescrito)
 * 6. Cambios en el portapapeles entre imagen cargada y primer keystroke
 */

import { useCallback, useEffect, useRef } from 'react'

// Umbral de pausa: si pasan más de estos ms sin tecla, es una "pausa"
const PAUSE_THRESHOLD_MS = 1500
// Burst: más de estos caracteres en menos de BURST_WINDOW_MS
const BURST_CHARS = 8
const BURST_WINDOW_MS = 400

export const useTypingBehavior = () => {
  const state = useRef({
    keyTimestamps: [],
    corrections: 0,
    pauses: [],
    bursts: [],
    maxLength: 0,
    finalLength: 0,
    firstKeyAt: null,
    lastKeyAt: null,
    recentKeys: [],
    // Clipboard: snapshot cuando se inicia el tracking
    clipboardSnapshotAtStart: null,
    // Si el clipboard cambió antes del primer keystroke
    clipboardChangedBeforeTyping: false,
  })

  // Intentar leer el clipboard al montar (requiere permiso, falla silenciosamente)
  useEffect(() => {
    const snapshotClipboard = async () => {
      try {
        if (navigator.clipboard?.readText) {
          const text = await navigator.clipboard.readText()
          state.current.clipboardSnapshotAtStart = text
        }
      } catch { /* permiso denegado — normal */ }
    }
    snapshotClipboard()
  }, [])

  /**
   * Llamar en cada onChange del textarea.
   * @param {string} prevValue - valor antes del cambio
   * @param {string} nextValue - valor después del cambio
   */
  const onTextChange = useCallback((prevValue, nextValue) => {
    const now = Date.now()
    const s = state.current

    // Primer keystroke — verificar si el clipboard cambió desde el inicio
    if (!s.firstKeyAt) {
      s.firstKeyAt = now
      // Snapshot del clipboard en el momento del primer keystroke
      if (navigator.clipboard?.readText) {
        navigator.clipboard.readText().then(currentClip => {
          if (
            s.clipboardSnapshotAtStart !== null &&
            currentClip !== s.clipboardSnapshotAtStart &&
            currentClip.trim().length > 10
          ) {
            s.clipboardChangedBeforeTyping = true
          }
        }).catch(() => {})
      }
    }

    // Detectar pausa desde el último keystroke
    if (s.lastKeyAt) {
      const gap = now - s.lastKeyAt
      if (gap > PAUSE_THRESHOLD_MS) {
        s.pauses.push(gap)
      }
    }
    s.lastKeyAt = now
    s.keyTimestamps.push(now)

    const delta = nextValue.length - prevValue.length

    if (delta < 0) {
      // Borrado — contar como corrección
      s.corrections += Math.abs(delta)
    } else if (delta > 0) {
      // Texto agregado — detectar burst
      s.recentKeys.push({ ts: now, chars: delta })
      // Limpiar entradas fuera de la ventana
      s.recentKeys = s.recentKeys.filter(k => now - k.ts <= BURST_WINDOW_MS)
      const burstTotal = s.recentKeys.reduce((acc, k) => acc + k.chars, 0)
      if (burstTotal >= BURST_CHARS) {
        // Solo registrar si el último burst registrado fue hace más de 1s
        const lastBurst = s.bursts[s.bursts.length - 1]
        if (!lastBurst || now - lastBurst.ts > 1000) {
          s.bursts.push({ ts: now, chars: burstTotal })
        }
      }
    }

    // Trackear longitud máxima
    if (nextValue.length > s.maxLength) s.maxLength = nextValue.length
  }, [])

  /**
   * Llamar cuando el usuario hace submit.
   * Devuelve el análisis completo del comportamiento.
   */
  const getReport = useCallback((finalPrompt) => {
    const s = state.current
    const finalLength = finalPrompt.length
    s.finalLength = finalLength

    const totalKeys = s.keyTimestamps.length
    const totalTime = s.firstKeyAt && s.lastKeyAt
      ? (s.lastKeyAt - s.firstKeyAt) / 1000
      : 0

    // Velocidad promedio en chars/segundo
    const avgSpeed = totalTime > 0 ? finalLength / totalTime : 0

    // Varianza de intervalos entre teclas (0 = robot, alto = humano)
    let interKeyVariance = 0
    if (s.keyTimestamps.length >= 4) {
      const intervals = []
      for (let i = 1; i < s.keyTimestamps.length; i++) {
        intervals.push(s.keyTimestamps[i] - s.keyTimestamps[i - 1])
      }
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length
      const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length
      interKeyVariance = Math.sqrt(variance) // desviación estándar en ms
    }

    // Ratio de corrección: cuánto borró vs cuánto escribió
    const correctionRatio = s.maxLength > 0 ? s.corrections / s.maxLength : 0

    // Ratio de edición: si el texto final es mucho más corto que el máximo,
    // el usuario reescribió bastante (señal humana)
    const editRatio = s.maxLength > 0 ? (s.maxLength - finalLength) / s.maxLength : 0

    return {
      // Datos crudos
      totalKeys,
      totalTimeSeconds: totalTime,
      corrections: s.corrections,
      pauseCount: s.pauses.length,
      burstCount: s.bursts.length,
      maxLength: s.maxLength,
      finalLength,

      // Métricas derivadas
      avgCharsPerSecond: avgSpeed,
      interKeyVarianceMs: interKeyVariance,
      correctionRatio,
      editRatio,
      avgPauseDurationMs: s.pauses.length > 0
        ? s.pauses.reduce((a, b) => a + b, 0) / s.pauses.length
        : 0,

      // Clipboard
      clipboardChangedBeforeTyping: s.clipboardChangedBeforeTyping,
    }
  }, [])

  /** Resetear al cambiar de imagen */
  const reset = useCallback(() => {
    state.current = {
      keyTimestamps: [],
      corrections: 0,
      pauses: [],
      bursts: [],
      maxLength: 0,
      finalLength: 0,
      firstKeyAt: null,
      lastKeyAt: null,
      recentKeys: [],
      clipboardSnapshotAtStart: null,
      clipboardChangedBeforeTyping: false,
    }
    // Re-snapshot del clipboard para la nueva imagen
    if (navigator.clipboard?.readText) {
      navigator.clipboard.readText().then(text => {
        state.current.clipboardSnapshotAtStart = text
      }).catch(() => {})
    }
  }, [])

  return { onTextChange, getReport, reset }
}
