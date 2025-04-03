import build from "@hono/vite-cloudflare-pages"; // Import the build plugin again
import devServer from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/bun";
import { defineConfig } from "vite";

// Use function form of defineConfig to access the command
export default defineConfig(({ command }) => {
  if (command === "build") {
    // Use Cloudflare Pages build plugin only for build command
    return {
      plugins: [build()],
    };
  }
  // Use dev server plugin for serve command (local development)
  return {
    plugins: [
      devServer({
        adapter: adapter, // Use bunAdapter for local dev
        entry: "index.ts",
      }),
    ],
  };
});
