import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            // NWS text products (NSH, AFD) — update ~4x/day, StaleWhileRevalidate
            urlPattern: /api\.weather\.gov\/products\/types\/(NSH|AFD)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nws-products',
              expiration: { maxAgeSeconds: 6 * 60 * 60 },
            },
          },
          {
            // Buoy observations and active alerts — always NetworkFirst
            urlPattern: /api\.weather\.gov\/alerts|ndbc\.noaa\.gov/,
            handler: 'NetworkFirst',
            options: { cacheName: 'live-data', networkTimeoutSeconds: 10 },
          },
        ],
      },
      manifest: {
        name: 'Chicago Marine',
        short_name: 'Marine',
        description: 'Chicago marine forecast for Belmont Harbor',
        theme_color: '#0d1b2a',
        background_color: '#0d1b2a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
