import { reactive } from "vue";
import { ContextualMode } from "./ContextualMode";
import { generateFallbackColor, rgbToHsv } from "../../utils/colorUtils";  // Add rgbToHsv import
import { findSuitableColorRegion } from "../../utils/imageUtils";
import { preloadImage } from "../../utils/imageLoader";

export class ImageMode extends ContextualMode {
	constructor(options = {}) {
		super(options);
		this.type = "image";
		this.viewCallbacks = {};
	}

	initState() {
		const baseState = super.initState();
		// Always create a reactive state with default values
		return reactive({
			...baseState,
			imageUrl: null,
			imageLoading: false,
			colorOptions: [],
			targetRegion: reactive({
				x: 0,
				y: 0,
				radius: 20,
				targetRegionReady: false
			}),
			targetRegionReady: false
		});
	}

	// Implement the missing resetUserInput method
	resetUserInput() {
		if (!this.state || !this.state.userColor) {
			console.warn("State or userColor is undefined in resetUserInput");
			return;
		}

		// Reset to default values
		this.state.userColor.h = 0;
		this.state.userColor.s = 0;
		this.state.userColor.v = 0;
	}

	// Simplified fetchRandomImage method:
	async fetchRandomImage() {
		this.state.imageLoading = true;
		// Clear previous image and target region
		this.state.imageUrl = null;
		Object.assign(this.state.targetRegion, { x: 0, y: 0, radius: 20, targetRegionReady: false });
		try {
			const reliableImageIds = [237, 24, 36, 37, 43, 76, 101, 133, 164, 197, 219, 230, 301, 334, 338, 396,
				25, 27, 29, 30, 33, 42, 60, 67, 100, 151, 200];
			const randomId = reliableImageIds[Math.floor(Math.random() * reliableImageIds.length)];
			const size = 600;
			const url = `https://picsum.photos/id/${randomId}/${size}/${size}`;
			// Attempt preloading but continue even if it fails.
			await preloadImage(url).catch(e => console.warn("Preload failed; using URL:", url, e));
			this.state.imageUrl = url;
			return url;
		} catch (error) {
			console.error("Error fetching random image:", error);
			this.state.imageUrl = "https://picsum.photos/600/600";
			return this.state.imageUrl;
		} finally {
			this.state.imageLoading = false;
		}
	}

	async selectRandomColorFromImage(imageElement) {
		console.log("ImageMode.selectRandomColorFromImage called with element:",
			imageElement ? `${imageElement.naturalWidth}x${imageElement.naturalHeight} (displayed: ${imageElement.width}x${imageElement.height})` : 'null');

		if (!imageElement ||
			(imageElement.naturalWidth === 0 && imageElement.width === 0) ||
			(imageElement.naturalHeight === 0 && imageElement.height === 0)) {
			console.error("Invalid image element provided to selectRandomColorFromImage");
			return generateFallbackColor();
		}

		try {
			const width = imageElement.naturalWidth || imageElement.width;
			const height = imageElement.naturalHeight || imageElement.height;

			console.log(`Successfully loaded image with dimensions: ${width}x${height}`);

			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			canvas.width = width;
			canvas.height = height;

			try {
				ctx.drawImage(imageElement, 0, 0, width, height);
			} catch (e) {
				console.error("Error drawing image to canvas:", e);
				return generateFallbackColor();
			}

			let hasData = false;
			try {
				const testData = ctx.getImageData(width / 2, height / 2, 1, 1);
				hasData = testData && testData.data && testData.data.length >= 4;
			} catch (e) {
				console.error("CORS issue detected when reading canvas data:", e);
			}

			if (!hasData) {
				console.warn("Canvas appears to be empty or has CORS issues");
				return generateFallbackColor();
			}

			const { x, y, color } = findSuitableColorRegion(ctx, width, height);

			console.log('Selected color region:', { x, y, color });

			// Ensure we're updating existing reactive object instead of creating new one
			Object.assign(this.state.targetRegion, {
				x: Number(x) || 0,
				y: Number(y) || 0,
				radius: 20,
				targetRegionReady: true
			});
			this.state.targetRegionReady = true;

			console.log('Updated target region state:', {
				region: this.state.targetRegion,
				ready: this.state.targetRegionReady
			});

			return color;
		} catch (error) {
			console.error("Error in selectRandomColorFromImage:", error);
			// Initialize fallback target region
			this.state.targetRegion = {
				x: 0,
				y: 0,
				radius: 20,
				targetRegionReady: true
			};
			return generateFallbackColor();
		}
	}

	findSuitableColorRegion(ctx, width, height) {
		try {
			// Try up to 10 random spots to find a good color region
			for (let attempt = 0; attempt < 10; attempt++) {
				// Avoid edges by 10% of dimensions
				const margin = 0.1;
				const x = Math.floor(Math.random() * (width * (1 - 2 * margin))) + (width * margin);
				const y = Math.floor(Math.random() * (height * (1 - 2 * margin))) + (height * margin);

				// Sample a region to see if it has consistent color
				const radius = 20;
				const regionData = ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);

				// Check if region has consistent color (simplified check)
				const centerColor = this.getPixelColorFromImageData(regionData, radius, radius);

				// Convert RGB to HSV for our game state
				const { h, s, v } = rgbToHsv(centerColor.r, centerColor.g, centerColor.b);

				// Set the flag when we have valid coordinates
				this.state.targetRegionReady = true;
				return {
					x,
					y,
					color: { h, s, v }
				};
			}

			// Fallback to a random color if we couldn't find a suitable region
			const h = Math.floor(Math.random() * 360);
			const s = Math.floor(Math.random() * 70) + 30; // Ensure some saturation
			const v = Math.floor(Math.random() * 70) + 30; // Ensure some brightness

			// Ensure we have fallback values
			this.state.targetRegionReady = true;
			return {
				x: width / 2,
				y: height / 2,
				color: { h, s, v }
			};
		} catch (error) {
			console.error("Error in findSuitableColorRegion:", error);
			// Ensure we have fallback values
			this.state.targetRegionReady = true;
			return {
				x: width / 2,
				y: height / 2,
				color: { h: 0, s: 0, v: 0 }
			};
		}
	}

	getPixelColorFromImageData(imageData, x, y) {
		const index = (y * imageData.width + x) * 4;
		return {
			r: imageData.data[index],
			g: imageData.data[index + 1],
			b: imageData.data[index + 2],
			a: imageData.data[index + 3]
		};
	}

	// Simplified startRound method:
	async startRound() {
		try {
			// Fetch new image and update state.
			await this.fetchRandomImage();
			this.resetUserInput();
			if (this.viewCallbacks && typeof this.viewCallbacks.onNewRound === "function") {
				this.viewCallbacks.onNewRound();
			}
		} catch (error) {
			console.error("Error in startRound:", error);
		}
	}

	// Set target color from analyzed image and generate options with better error handling
	setTargetColorAndGenerateOptions(color) {
		console.log("ImageMode.setTargetColorAndGenerateOptions called with color:", color);

		try {
			if (!this.state) {
				this.state = this.initState();
				}

				// Validate and set the target color
				if (!color || typeof color.h !== 'number') {
					color = generateFallbackColor();
				}

				// Set the target color
				this.state.randomColor = { ...color };

					// Initialize userColor if not set
					if (!this.state.userColor) {
						this.state.userColor = { h: 0, s: 0, v: 0 };
					}

					// Generate color options array first
					const options = [];

					// Add the target color
					options.push({ ...color });

					// Generate variations
					for (let i = 0; i < 5; i++) {
						const hVariation = Math.floor(Math.random() * 60 - 30);
						const sVariation = Math.floor(Math.random() * 40 - 20);
						const vVariation = Math.floor(Math.random() * 40 - 20);

						options.push({
							h: (color.h + hVariation + 360) % 360,
							s: Math.max(10, Math.min(100, color.s + sVariation)),
							v: Math.max(10, Math.min(100, color.v + vVariation))
						});
					}

					// Shuffle the options
					this.state.colorOptions = options.sort(() => Math.random() - 0.5);

					console.log("Generated color options:", this.state.colorOptions.length);
					return this.state.colorOptions;
				} catch (error) {
					console.error("Error in setTargetColorAndGenerateOptions:", error);
					const fallbackOptions = Array(6).fill().map(() => generateFallbackColor());
					this.state.colorOptions = fallbackOptions;
					return fallbackOptions;
				}
			}

	// Override generateColorOptions to ensure we create good options for image colors
	generateColorOptions() {
		try {
			const options = [];
			const baseColor = this.state.randomColor;

			// Always add the target color first
			options.push({ ...baseColor });

			// Generate variations
			for (let i = 0; i < 5; i++) {
				const hVariation = Math.floor(Math.random() * 60 - 30);
				const sVariation = Math.floor(Math.random() * 40 - 20);
				const vVariation = Math.floor(Math.random() * 40 - 20);

				options.push({
					h: (baseColor.h + hVariation + 360) % 360,
					s: Math.max(10, Math.min(100, baseColor.s + sVariation)),
					v: Math.max(10, Math.min(100, baseColor.v + vVariation))
				});
			}

			// Shuffle the options
			return options.sort(() => Math.random() - 0.5);
		} catch (error) {
			console.error("Error generating color options:", error);
			return Array(6).fill().map(() => generateFallbackColor());
		}
	}

  checkGuess() {
		const precision = this.options.precision || 10;
		const hIsGood =
			Math.abs(this.state.randomColor.h - this.state.userColor.h) <= precision;
		const sIsGood =
			Math.abs(this.state.randomColor.s - this.state.userColor.s) <= precision;
		const vIsGood =
			Math.abs(this.state.randomColor.v - this.state.userColor.v) <= precision;

		return hIsGood && sIsGood && vIsGood;
	}
}
