import { reactive } from "vue";
import { ContextualMode } from "./ContextualMode";

// Utility function for generating a fallback color
function generateFallbackColor() {
	return {
		h: Math.floor(Math.random() * 360),
		s: Math.floor(Math.random() * 70) + 30, // Ensure some saturation
		v: Math.floor(Math.random() * 70) + 30, // Ensure some brightness
	};
}

// Convert RGB to HSV
function rgbToHsv(r, g, b) {
	r /= 255;
	g /= 255;
	b /= 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	let h;
	// biome-ignore lint/style/useConst: <explanation>
	let s;
	const v = max;

	const d = max - min;
	s = max === 0 ? 0 : d / max;

	if (max === min) {
		h = 0; // achromatic
	} else {
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}

	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		v: Math.round(v * 100),
	};
}

// Find a suitable color region in an image
function findSuitableColorRegion(ctx, width, height) {
	try {
		// Try up to 10 random spots to find a good color region
		let result = null;
		for (let attempt = 0; attempt < 10; attempt++) {
			// Avoid edges by 10% of dimensions
			const margin = 0.1;
			const x =
				Math.floor(Math.random() * (width * (1 - 2 * margin))) + width * margin;
			const y =
				Math.floor(Math.random() * (height * (1 - 2 * margin))) +
				height * margin;

			// Sample a region to see if it has consistent color
			const radius = 20;
			const regionData = ctx.getImageData(
				x - radius,
				y - radius,
				radius * 2,
				radius * 2,
			);

			// Get center pixel color
			const index = (radius * regionData.width + radius) * 4;
			const centerColor = {
				r: regionData.data[index],
				g: regionData.data[index + 1],
				b: regionData.data[index + 2],
			};

			// Convert RGB to HSV for our game state
			const { h, s, v } = rgbToHsv(centerColor.r, centerColor.g, centerColor.b);

			// Check a simple condition for suitability (e.g., sufficient saturation)
			if (s > 20) {
				result = {
					x,
					y,
					color: { h, s, v },
				};
				break;
			}
		}
		if (result) {
			return result;
		}

		// Fallback to a random color if we couldn't find a suitable region
		return {
			x: width / 2,
			y: height / 2,
			color: generateFallbackColor(),
		};
	} catch (error) {
		console.error("Error in findSuitableColorRegion:", error);
		return {
			x: width / 2,
			y: height / 2,
			color: generateFallbackColor(),
		};
	}
}

// Preload an image to ensure it's available
async function preloadImage(url) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = url;
	});
}

export class ColorMode extends ContextualMode {
	constructor(options = {}) {
		super(options);
		this.type = "color";
		this.viewCallbacks = {};
	}

	initState() {
		const baseState = super.initState();
		return reactive({
			...baseState,
			imageUrl: null,
			imageLoading: false,
			colorOptions: [],
			targetRegion: reactive({
				x: 0,
				y: 0,
				radius: 20,
				targetRegionReady: false,
			}),
			targetRegionReady: false,
		});
	}

	resetUserInput() {
		if (!this.state || !this.state.userColor) {
			console.warn("State or userColor is undefined in resetUserInput");
			return;
		}

		this.state.userColor.h = 0;
		this.state.userColor.s = 0;
		this.state.userColor.v = 0;
	}

	async fetchRandomImage() {
		this.state.imageLoading = true;
		// Clear previous image and target region
		this.state.imageUrl = null;
		Object.assign(this.state.targetRegion, {
			x: 0,
			y: 0,
			radius: 20,
			targetRegionReady: false,
		});

		try {
			// Use completely random images instead of predefined IDs
			const size = 600;
			const url = `https://picsum.photos/${size}/${size}?_=${Date.now()}`;

			// Attempt preloading but continue even if it fails
			await preloadImage(url).catch((e) =>
				console.warn("Preload failed; using URL:", url, e),
			);
			this.state.imageUrl = url;
			return url;
		} catch (error) {
			console.error("Error fetching random image:", error);
			this.state.imageUrl = url;
			return this.state.imageUrl;
		} finally {
			this.state.imageLoading = false;
		}
	}

	async selectRandomColorFromImage(imageElement) {
		console.log(
			"ColorMode.selectRandomColorFromImage called with element:",
			imageElement
				? `${imageElement.naturalWidth}x${imageElement.naturalHeight} (displayed: ${imageElement.width}x${imageElement.height})`
				: "null",
		);

		if (
			!imageElement ||
			(imageElement.naturalWidth === 0 && imageElement.width === 0) ||
			(imageElement.naturalHeight === 0 && imageElement.height === 0)
		) {
			console.error(
				"Invalid image element provided to selectRandomColorFromImage",
			);
			return generateFallbackColor();
		}

		try {
			const width = imageElement.naturalWidth || imageElement.width;
			const height = imageElement.naturalHeight || imageElement.height;

			console.log(
				`Successfully loaded image with dimensions: ${width}x${height}`,
			);

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
				hasData = testData?.data && testData.data.length >= 4;
			} catch (e) {
				console.error("CORS issue detected when reading canvas data:", e);
			}

			if (!hasData) {
				console.warn("Canvas appears to be empty or has CORS issues");
				return generateFallbackColor();
			}

			const { x, y, color } = findSuitableColorRegion(ctx, width, height);

			console.log("Selected color region:", { x, y, color });

			// Ensure we're updating existing reactive object instead of creating new one
			Object.assign(this.state.targetRegion, {
				x: Number(x) || 0,
				y: Number(y) || 0,
				radius: 20,
				targetRegionReady: true,
			});
			this.state.targetRegionReady = true;

			return color;
		} catch (error) {
			console.error("Error in selectRandomColorFromImage:", error);
			// Initialize fallback target region
			this.state.targetRegion = {
				x: 0,
				y: 0,
				radius: 20,
				targetRegionReady: true,
			};
			return generateFallbackColor();
		}
	}

	setTargetColorAndGenerateOptions(color) {
		try {
			if (!this.state) {
				this.state = this.initState();
			}

			// Validate and set the target color
			if (!color || typeof color.h !== "number") {
				color = generateFallbackColor();
			}

			// Set the target color
			this.state.randomColor = { ...color };

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
					v: Math.max(10, Math.min(100, color.v + vVariation)),
				});
			}

			// Shuffle the options
			this.state.colorOptions = options.sort(() => Math.random() - 0.5);

			return this.state.colorOptions;
		} catch (error) {
			console.error("Error in setTargetColorAndGenerateOptions:", error);
			const fallbackOptions = Array(6)
				.fill()
				.map(() => generateFallbackColor());
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
					v: Math.max(10, Math.min(100, baseColor.v + vVariation)),
				});
			}

			// Shuffle the options
			return options.sort(() => Math.random() - 0.5);
		} catch (error) {
			console.error("Error generating color options:", error);
			return Array(6)
				.fill()
				.map(() => generateFallbackColor());
		}
	}

	async startRound() {
		try {
			// Fetch new image and update state
			await this.fetchRandomImage();
			this.resetUserInput();

			if (
				this.viewCallbacks &&
				typeof this.viewCallbacks.onNewRound === "function"
			) {
				this.viewCallbacks.onNewRound();
			}
		} catch (error) {
			console.error("Error in startRound:", error);
		}
	}

	// Override checkGuess to match the ContextualMode behavior
	checkGuess() {
		// In color mode, we need exact matches since user selects from predefined options
		const hIsExact = this.state.randomColor.h === this.state.userColor.h;
		const sIsExact = this.state.randomColor.s === this.state.userColor.s;
		const vIsExact = this.state.randomColor.v === this.state.userColor.v;

		return hIsExact && sIsExact && vIsExact;
	}
}
