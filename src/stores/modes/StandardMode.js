import { reactive } from "vue";
import {
	hsvToOklab,
	hsvToRgb,
	oklabToHsv,
	rgbToHsv,
} from "../../utils/colorSpaceUtils";
import { BaseMode } from "./BaseMode";

export class StandardMode extends BaseMode {
	constructor(options = {}) {
		super(options);
		this.type = "standard";
		this.colorSpace = options.colorSpace || "hsv"; // Default to HSV if not specified
	}

	initState() {
		return {
			randomColor: reactive(this.generateRandomColor()),
			userColor: reactive(this.getDefaultUserColor()),
			colorSpace: this.colorSpace, // Store the current color space in the state
		};
	}

	getDefaultUserColor() {
		if (this.colorSpace === "rgb") {
			return { r: 0, g: 0, b: 0 };
		}
		if (this.colorSpace === "oklab") {
			return { L: 0, a: 0, b: 0 };
		}
		return { h: 0, s: 0, v: 0 }; // Default to HSV
	}

	generateRandomColor() {
		const mode = this.options.colorMode || "Color";
		let hsvColor;

		// Generate a random HSV color first
		switch (mode) {
			case "B/W": {
				hsvColor = {
					h: 0,
					s: 0,
					v: Math.floor(Math.random() * 95) + 5,
				};
				break;
			}
			// case "Color":
			default: {
				hsvColor = {
					h: Math.floor(Math.random() * 360),
					s: Math.floor(Math.random() * 100),
					v: Math.floor(Math.random() * 95) + 5,
				};
				break;
			}
		}

		// Convert to the appropriate color space if needed
		if (this.colorSpace === "rgb") {
			// Convert HSV to RGB
			const { r, g, b } = this.hsvToRgb(hsvColor.h, hsvColor.s, hsvColor.v);
			return { r, g, b, _hsv: hsvColor }; // Keep the original HSV for comparison
		}
		if (this.colorSpace === "oklab") {
			// Convert HSV to OKLAB
			const { L, a, b } = hsvToOklab(hsvColor.h, hsvColor.s, hsvColor.v);
			return { L, a, b, _hsv: hsvColor }; // Keep the original HSV for comparison
		}
		return hsvColor; // Default to HSV
	}

	// Helper method to convert HSV to RGB (used internally)
	hsvToRgb(h, s, v) {
		// Import from utils/index.js - using the imported function from colorSpaceUtils
		return hsvToRgb(h, s, v);
	}

	startRound() {
		const random = this.generateRandomColor();

		// Update the state based on the color space
		if (this.colorSpace === "rgb") {
			this.state.randomColor.r = random.r;
			this.state.randomColor.g = random.g;
			this.state.randomColor.b = random.b;
			this.state.randomColor._hsv = random._hsv; // Store original HSV for comparison
		} else if (this.colorSpace === "oklab") {
			this.state.randomColor.L = random.L;
			this.state.randomColor.a = random.a;
			this.state.randomColor.b = random.b;
			this.state.randomColor._hsv = random._hsv; // Store original HSV for comparison
		} else {
			// Default to HSV
			this.state.randomColor.h = random.h;
			this.state.randomColor.s = random.s;
			this.state.randomColor.v = random.v;
		}
	}

	updateUserColor(val1, val2, val3) {
		if (this.colorSpace === "rgb") {
			this.state.userColor.r = val1;
			this.state.userColor.g = val2;
			this.state.userColor.b = val3;
		} else if (this.colorSpace === "oklab") {
			this.state.userColor.L = val1;
			this.state.userColor.a = val2;
			this.state.userColor.b = val3;
		} else {
			// Default to HSV
			this.state.userColor.h = val1;
			this.state.userColor.s = val2;
			this.state.userColor.v = val3;
		}
	}

	// Set the color space
	setColorSpace(colorSpace) {
		this.colorSpace = colorSpace;
		this.state.colorSpace = colorSpace;

		// Reset user color for the new color space
		const defaultColor = this.getDefaultUserColor();
		Object.keys(defaultColor).forEach((key) => {
			this.state.userColor[key] = defaultColor[key];
		});

		// Convert the random color to the new color space
		const randomHsv = this.state.randomColor._hsv || this.state.randomColor;
		const newRandom = this.generateRandomColor();

		// Update the random color for the new color space
		Object.keys(newRandom).forEach((key) => {
			if (key !== "_hsv") {
				this.state.randomColor[key] = newRandom[key];
			}
		});

		// Keep the original HSV for comparison
		if (this.colorSpace !== "hsv") {
			this.state.randomColor._hsv = randomHsv;
		}
	}

	checkGuess() {
		const precision = this.options.precision || 10;

			// Check based on the current color space
			if (this.colorSpace === "rgb") {
				// Compare RGB values directly
				const targetRgb = this.state.randomColor;
				const userRgb = this.state.userColor;

				// Calculate percentage differences for RGB (0-255 scale)
				const rDiff = Math.abs(targetRgb.r - userRgb.r) / 2.55; // Convert to percentage
				const gDiff = Math.abs(targetRgb.g - userRgb.g) / 2.55;
				const bDiff = Math.abs(targetRgb.b - userRgb.b) / 2.55;

				return rDiff <= precision && gDiff <= precision && bDiff <= precision;
			}

			if (this.colorSpace === "oklab") {
				// Compare OKLAB values directly
				const targetLab = this.state.randomColor;
				const userLab = this.state.userColor;

				// For OKLAB, L is 0-100, a and b are -100 to +100
				const LDiff = Math.abs(targetLab.L - userLab.L); // Already percentage
				const aDiff = Math.abs(targetLab.a - userLab.a) / 2; // Convert to percentage (200 range)
				const bDiff = Math.abs(targetLab.b - userLab.b) / 2;

				return LDiff <= precision && aDiff <= precision && bDiff <= precision;
			}

			// Default HSV comparison
			const hIsGood =
				Math.abs(this.state.randomColor.h - this.state.userColor.h) <= precision;
			const sIsGood =
				Math.abs(this.state.randomColor.s - this.state.userColor.s) <= precision;
			const vIsGood =
				Math.abs(this.state.randomColor.v - this.state.userColor.v) <= precision;

			return hIsGood && sIsGood && vIsGood;
	}

	createHistoryRecord(wasSuccess, round, sessionId) {
		// Create a clean copy of the random color, excluding the _hsv property
		const actualColor = {};
		Object.keys(this.state.randomColor).forEach(key => {
			if (key !== '_hsv') {
				actualColor[key] = this.state.randomColor[key];
			}
		});

		// Include color space information in the record
		return {
			type: "color",
			guessedColor: Object.assign({}, this.state.userColor),
			actualColor: actualColor,
			colorSpace: this.colorSpace // Store the color space used
		};
	}
}
