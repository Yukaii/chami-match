import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = path.join(__dirname, "..", "docs", "screenshots");

// The routes should match the routes in the Vue router
const routes = [
	{
		path: "/",
		name: "welcome",
	},
	{
		path: "/game",
		name: "game",
	},
	{
		path: "/context-game",
		name: "context-game",
	},
	{
		path: "/relative-game",
		name: "relative-game",
	},
];

// Dimensions to capture
const dimensions = [
	{ width: 375, height: 667, name: "mobile" }, // iPhone SE
];

// Color schemes to capture
const colorSchemes = [
	{ name: "light", scheme: "light" },
	{ name: "dark", scheme: "dark" },
];

// Languages to capture
const languages = [
	{ code: "ja", name: "Japanese" },
	{ code: "en", name: "English" },
	{ code: "zh-TW", name: "Traditional Chinese" },
];

async function captureScreenshots() {
	console.log("Starting screenshot generation...");

	// Create screenshots directory if it doesn't exist
	try {
		await fs.mkdir(screenshotsDir, { recursive: true });
		console.log(`Created screenshots directory at: ${screenshotsDir}`);
	} catch (err) {
		console.log("Screenshots directory already exists");
	}

	// Start a browser instance
	const browser = await chromium.launch();

	try {
		// Loop through each language
		for (const language of languages) {
			console.log(
				`Capturing screenshots for ${language.name} (${language.code})`,
			);

			// Loop through each color scheme
			for (const colorScheme of colorSchemes) {
				console.log(
					`Capturing ${language.name} screenshots in ${colorScheme.name} mode`,
				);

				// Loop through each dimension
				for (const dimension of dimensions) {
					console.log(
						`Capturing ${language.name} screenshots in ${colorScheme.name} mode for ${dimension.name} (${dimension.width}x${dimension.height})`,
					);

					// Create a new context with the specific viewport size, color scheme, and language
					const context = await browser.newContext({
						viewport: { width: dimension.width, height: dimension.height },
						colorScheme: colorScheme.scheme,
						locale: language.code,
					});

					// Create language, dimension and color scheme specific directory
					const modeDir = path.join(
						screenshotsDir,
						language.code,
						colorScheme.name,
						dimension.name,
					);
					await fs.mkdir(modeDir, { recursive: true });

					// Create a new page
					const page = await context.newPage();

					// Loop through each route and take a screenshot
					for (const route of routes) {
						const url = `http://localhost:5173${route.path}`;
						console.log(
							`Navigating to ${url} (${language.name}, ${colorScheme.name} mode)`,
						);

						await page.goto(url, { waitUntil: "networkidle" });

						// Wait a moment for any animations to complete
						await page.waitForTimeout(1000);

						// Take the screenshot
						const screenshotPath = path.join(modeDir, `${route.name}.png`);
						await page.screenshot({
							path: screenshotPath,
							// Viewport only
						});

						console.log(
							`Saved ${language.name} ${colorScheme.name} mode screenshot to: ${screenshotPath}`,
						);
					}

					await context.close();
				}
			}
		}
	} catch (error) {
		console.error("Error taking screenshots:", error);
	} finally {
		await browser.close();
		console.log("Screenshot generation completed");
	}
}

// Make sure Vite dev server is running before starting
console.log("Make sure your Vite dev server is running (npm run dev)");
console.log(
	"Port is set to 5173. If different, please adjust the URL in the script.",
);
console.log("Waiting 3 seconds before starting...");

setTimeout(captureScreenshots, 3000);
