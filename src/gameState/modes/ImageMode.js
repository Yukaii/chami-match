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
		return {
			...baseState,
			imageUrl: null,
			imageLoading: false,
			targetRegion: {
				x: 0,
				y: 0,
				radius: 20,
				// Add a flag to track if target region is ready
				targetRegionReady: false
			},
		};
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

	async fetchRandomImage() {
		this.state.imageLoading = true;

		// List of reliable image IDs known to work with more options
		const reliableImageIds = [237, 24, 36, 37, 43, 76, 101, 133, 164, 197, 219, 230, 301, 334, 338, 396,
								25, 27, 29, 30, 33, 42, 60, 67, 100, 151, 200];

		try {
			// Select a random ID from our reliable list
			const randomId = reliableImageIds[Math.floor(Math.random() * reliableImageIds.length)];

			// Fixed size to ensure consistency
			const size = 600;

			// Try direct Picsum URL format that might work better with CORS
			const url = `https://picsum.photos/id/${randomId}/${size}/${size}`;
			console.log("Fetching image from:", url);
			this.state.imageUrl = url;

			return url;
		} catch (error) {
			console.error("Error fetching random image:", error);
			// Fallback to a default image
			this.state.imageUrl = "https://picsum.photos/id/237/600/600";
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

			this.state.targetRegion = {
				x,
				y,
				radius: 20,
			};

			return color;
		} catch (error) {
			console.error("Error in selectRandomColorFromImage:", error);
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

	async startRound() {
		try {
				// Initialize target region with default values
				this.state.targetRegion = {
					x: 0,
					y: 0,
					radius: 20,
				};

				// Start by fetching a new image URL
				const imageUrl = await this.fetchRandomImage();

				// Try to preload the image
				try {
					const preloadedImage = await preloadImage(imageUrl);
					console.log("Image preloaded successfully, dimensions:",
						preloadedImage.width, "x", preloadedImage.height);
				} catch (err) {
					console.warn("Image preloading failed, will still continue with URL:", imageUrl);
				}

				// Reset user color
				this.resetUserInput();

				// Call the onNewRound callback if registered
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
			// ...existing state validation code...

			// Make sure we have valid color values
			if (!color || typeof color.h !== 'number' || typeof color.s !== 'number' || typeof color.v !== 'number') {
				console.error("Invalid color provided to setTargetColorAndGenerateOptions", color);
				// Generate fallback color
				color = {
					h: Math.floor(Math.random() * 360),
					s: Math.floor(Math.random() * 70) + 30,
					v: Math.floor(Math.random() * 70) + 30
				};
			}

			// Make sure target region is initialized
			if (!this.state.targetRegion) {
				this.state.targetRegion = {
					x: 0,
					y: 0,
					radius: 20
				};
			}

			// Update the target color
			this.state.randomColor.h = color.h;
			this.state.randomColor.s = color.s;
			this.state.randomColor.v = color.v;

			// Generate new color options
			this.state.colorOptions = this.generateColorOptions();
			console.log("Generated color options:", this.state.colorOptions.length, "items");

			// Make sure options include the correct color
			let hasCorrectColor = false;
			for (const option of this.state.colorOptions) {
				if (option.h === color.h && option.s === color.s && option.v === color.v) {
					hasCorrectColor = true;
					break;
				}
			}

			// If correct color is not included, replace a random option with it
			if (!hasCorrectColor && this.state.colorOptions.length > 0) {
				const randomIndex = Math.floor(Math.random() * this.state.colorOptions.length);
				this.state.colorOptions[randomIndex] = { ...color };
				console.log("Added correct color to options at index", randomIndex);
			}
		} catch (error) {
			console.error("Error in setTargetColorAndGenerateOptions:", error);
			// Make sure we generate at least some options
			this.state.colorOptions = Array(6).fill().map(() => ({
				h: Math.floor(Math.random() * 360),
				s: Math.floor(Math.random() * 100),
				v: Math.floor(Math.random() * 100)
			}));
		}
	}

	// Override generateColorOptions to ensure we create good options for image colors
	generateColorOptions() {
		const options = [];

		// Add the target color (the correct answer)
		if (this.state.randomColor) {
			options.push({ ...this.state.randomColor });
		}

		// Generate 5 additional similar but incorrect colors
		for (let i = 0; i < 5; i++) {
			const hVariation = Math.random() * 60 - 30; // ±30 degrees of hue
			const sVariation = Math.random() * 40 - 20; // ±20% saturation
			const vVariation = Math.random() * 40 - 20; // ±20% value/brightness

			const h = Math.round((this.state.randomColor.h + hVariation + 360) % 360);
			const s = Math.max(10, Math.min(100, this.state.randomColor.s + sVariation));
			const v = Math.max(10, Math.min(100, this.state.randomColor.v + vVariation));

			options.push({ h, s, v });
		}

		// Shuffle the options to randomize the correct answer's position
		return options.sort(() => Math.random() - 0.5);
	}
}
