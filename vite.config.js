import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  root: 'public', // папката с публични файлове е public
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Проксиране на всички /api заявки към Spring Boot backend сървъра
      '/api': {
        target: 'http://localhost:8080', // Адрес на Spring Boot приложението
        changeOrigin: true,
        secure: false,
        ws: true, // Поддръжка на WebSockets ако е нужно
        // Предотвратяваме всякакви пренасочвания от сървъра
        configure: (proxy, _options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Проверяваме дали има Location хедър
            if (proxyRes.headers.location) {
              // Ако пренасочва към бекенда или някакъв URL на бекенда
              if (proxyRes.headers.location.includes('localhost:8080')) {
                // Премахваме пренасочването напълно
                delete proxyRes.headers.location;
                
                // Променяме статус кода да не е пренасочване
                if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
                  proxyRes.statusCode = 200;
                }
              }
            }
          });
        }
      },
      // Проксиране и на другите Spring Security пътища
      '/login': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/logout': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // Проксиране на /movies към бекенда
      '/movies': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Не променяме пътя
        configure: (proxy, _options) => {
          console.log('Movies proxy setup complete')
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`Proxying request to: ${req.url}`)
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`Got response from movies endpoint: ${proxyRes.statusCode}`)
          });
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err)
          });
        }
      }
    },
    // CORS настройки
    cors: true
  },
    resolve: {
    alias: {
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
})
