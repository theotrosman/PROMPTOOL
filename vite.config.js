const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const { resolve } = require('path')

module.exports = defineConfig({
  plugins: [
    react(),
    // Rewrite clean URLs → HTML files en dev
    {
      name: 'clean-url-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url.split('?')[0]
          const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''

          // Bloquear acceso directo a /media/*
          if (url.startsWith('/media/')) {
            res.statusCode = 403
            res.end('Forbidden')
            return
          }

          if (/^\/user\/[^/]+/.test(url)) {
            req.url = '/user.html' + query
          } else if (url === '/admin' || url === '/admin/') {
            req.url = '/admin.html' + query
          } else if (url === '/guides' || url === '/guides/') {
            req.url = '/guides.html' + query
          } else if (url === '/support' || url === '/support/') {
            req.url = '/support.html' + query
          } else if (url === '/terms' || url === '/terms/') {
            req.url = '/terms.html' + query
          } else if (url === '/privacy' || url === '/privacy/') {
            req.url = '/privacy.html' + query
          } else if (url === '/tournaments' || url === '/tournaments/') {
            req.url = '/tournaments.html' + query
          } else if (url === '/leaderboard' || url === '/leaderboard/') {
            req.url = '/leaderboard.html' + query
          } else if (url === '/perfil' || url === '/perfil/' || url.startsWith('/perfil?')) {
            req.url = '/usuario.html' + query
          }
          next()
        })
      },
    },
  ],
  build: {
    assetsInlineLimit: 1024 * 1024, // inline todo hasta 1MB como base64
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        guides: resolve(__dirname, 'guides.html'),
        usuario: resolve(__dirname, 'usuario.html'),
        admin: resolve(__dirname, 'admin.html'),
        user: resolve(__dirname, 'user.html'),
        tournaments: resolve(__dirname, 'tournaments.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html'),
        support: resolve(__dirname, 'support.html'),
        terms: resolve(__dirname, 'terms.html'),
        privacy: resolve(__dirname, 'privacy.html'),
      },
    },
  },
})
