import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        {
          '@vueuse/core': [
            // named imports
            'createGlobalState',
          ],
        },
      ],
    }),
    ,
    Components(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'HSV Hunter',
        short_name: 'HSV Hunter',
        description: 'Use sliders, guess the color, and improve your color regconition skill!',
        theme_color: '#222222',
        // icons: [
        //   {
        //     src: 'pwa-192x192.png',
        //     sizes: '192x192',
        //     type: 'image/png'
        //   },
        //   {
        //     src: 'pwa-512x512.png',
        //     sizes: '512x512',
        //     type: 'image/png'
        //   },
        // ]
      },
    }),
  ],
})
