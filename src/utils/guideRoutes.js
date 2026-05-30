/** Rutas públicas por guía: /guides/:slug */

export const getGuideSlugFromPath = (pathname = typeof window !== 'undefined' ? window.location.pathname : '') => {
  const match = String(pathname).match(/^\/guides\/([^/]+)\/?$/)
  return match?.[1] || null
}

export const guideArticlePath = (slug) => `/guides/${slug}`

export const guidesIndexPath = () => '/guides'

export const guideInteractivePath = (slug) => `/guides?practice=1#guia-${slug}`
