import tailwindcss from "@tailwindcss/vite";
import { unheadVueComposablesImports } from "@unhead/vue";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
	esbuild: {
		drop: ["console", "debugger"],
	},
	plugins: [
		vue(),
		tailwindcss(),
		AutoImport({
			imports: [
				"vue",
				{
					"@vueuse/core": [
						// named imports
						"createGlobalState",
					],
				},
				unheadVueComposablesImports,
			],
		}),
		Components(),
		VitePWA({
			registerType: "autoUpdate",
			workbox: {
				globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
			},
			manifest: {
				name: "Chami Match",
				short_name: "Chami Match",
				description:
					"Use sliders to guess the color and improve your color recognition skills.",
				theme_color: "#222222",
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
});
