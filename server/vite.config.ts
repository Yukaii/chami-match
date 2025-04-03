import { defineConfig } from 'vite'
import devServer from '@hono/vite-dev-server'
import bunAdapter from '@hono/vite-dev-server/bun'

export default defineConfig({
  plugins: [
    devServer({
      entry: './index.ts',
      adapter: bunAdapter,
    }),
  ],
})
