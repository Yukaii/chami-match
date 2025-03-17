import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'src/',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt', '@vueuse/nuxt', '@nuxtjs/i18n', 'nuxt-phosphor-icons'],

  app: {
    head: {
      title: 'Chami Match',
      meta: [
        { name: 'description', content: 'Use sliders to guess the color and improve your color recognition skills.' },
        { name: 'theme-color', content: '#222222' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  vite: {
    esbuild: {
      drop: ['console', 'debugger'],
    },
    plugins: [tailwindcss()],
  },

  compatibilityDate: '2025-03-17',
})