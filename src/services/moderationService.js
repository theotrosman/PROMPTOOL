import * as nsfwjs from 'nsfwjs'
import * as tf from '@tensorflow/tfjs'

let model = null

const loadModel = async () => {
  if (model) return model
  // Usar el modelo público de nsfwjs (cargado desde CDN)
  model = await nsfwjs.load('https://nsfwjs.com/quant_nsfw_mobilenet/', { size: 224 })
  return model
}

/**
 * Analiza una imagen y devuelve si es segura para mostrar.
 * @param {HTMLImageElement|File} input - Imagen a analizar
 * @returns {Promise<{ safe: boolean, reason: string }>}
 */
export const checkImageSafe = async (input) => {
  try {
    let imgElement

    if (input instanceof File) {
      // Crear un elemento img temporal desde el File
      const url = URL.createObjectURL(input)
      imgElement = new Image()
      imgElement.crossOrigin = 'anonymous'
      await new Promise((resolve, reject) => {
        imgElement.onload = resolve
        imgElement.onerror = reject
        imgElement.src = url
      })
    } else {
      imgElement = input
    }

    const m = await loadModel()
    const predictions = await m.classify(imgElement)

    // Categorías NSFW: Porn, Sexy, Hentai
    const nsfwCategories = ['Porn', 'Sexy', 'Hentai']
    const nsfwScore = predictions
      .filter(p => nsfwCategories.includes(p.className))
      .reduce((sum, p) => sum + p.probability, 0)

    // Umbral: si la suma de categorías NSFW supera 40%, rechazar
    const THRESHOLD = 0.40

    if (nsfwScore > THRESHOLD) {
      return {
        safe: false,
        reason: `Image contains inappropriate content (${Math.round(nsfwScore * 100)}% confidence)`,
      }
    }

    return { safe: true, reason: '' }
  } catch {
    // fail open — allow image if detection fails
    return { safe: true, reason: '' }
  }
}
