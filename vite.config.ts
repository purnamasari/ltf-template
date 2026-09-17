import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The kiosk decides when to take an update — see src/lib/updates. An
      // autoUpdate reload could land while a guest is mid-letter.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Postcard to the Future — Raffles Heritage',
        short_name: 'Postcard',
        description:
          'Write a postcard to yourself at Raffles Singapore and have it delivered a year from now.',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        orientation: 'landscape',
        background_color: '#e2e0d1',
        theme_color: '#3a2517',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The kiosk has to run through a whole session with no network, so the
        // artwork and fonts are precached rather than cached on first use.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
})
