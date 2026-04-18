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
        server.middlewares.use((req, _res, next) => {
          const url = req.url.split('?')[0]
          const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''

          if (/^\/user\/[^/]+/.test(url)) {
            req.url = '/user.html' + query
          } else if (url === '/admin' || url === '/admin/') {
            req.url = '/admin.html' + query
          } else if (url === '/guides' || url === '/guides/') {
            req.url = '/guides.html' + query
          } else if (url === '/perfil' || url === '/perfil/' || url.startsWith('/perfil?')) {
            req.url = '/usuario.html' + query
          }
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        guides: resolve(__dirname, 'guides.html'),
        usuario: resolve(__dirname, 'usuario.html'),
        admin: resolve(__dirname, 'admin.html'),
        user: resolve(__dirname, 'user.html'),
      },
    },
  },
})
