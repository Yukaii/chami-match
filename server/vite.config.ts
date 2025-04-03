import devServer from "@hono/vite-dev-server";
import bunAdapter from "@hono/vite-dev-server/bun";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    devServer({
      entry: "./index.ts",
      adapter: bunAdapter,
    }),
  ],
});
