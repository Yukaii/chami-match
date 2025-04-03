import devServer from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/bun";
import { defineConfig } from "vite";

// Use function form of defineConfig to access the command
export default defineConfig(({ command }) => {
  return {
    plugins: [
      devServer({
        adapter: adapter, // Use bunAdapter for local dev
        entry: "index.ts",
      }),
    ],
  };
});
