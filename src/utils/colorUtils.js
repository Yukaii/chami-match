import { useGameStore } from "../stores/game";
import { oklabToRgb } from "./colorSpaceUtils";
import { hsvToRgb } from "./index";

/**
 * Convert color object to a hex string for CSS based on the current color space
 * @param {Object} color - Color object with properties depending on color space
 * @returns {string} - Hex color string (e.g., "#ff0000")
 */
export function colorHSVtoHex(color) {
	if (!color || typeof color !== "object") {
		return "#000000";
	}

	// Get the current color space from the store
	let r;
	let g;
	let b;
	let store;

	try {
		store = useGameStore();
		const colorSpace = store.colorSpace;

		if (colorSpace === "rgb") {
			// RGB color space
			r = color.r || 0;
			g = color.g || 0;
			b = color.b || 0;
		} else if (colorSpace === "oklab") {
			// OKLAB color space - convert to RGB
			const L = color.L || 0;
			const a = color.a || 0;
			const lab_b = color.b || 0;
			const rgb = oklabToRgb(L, a, lab_b);
			r = rgb.r;
			g = rgb.g;
			b = rgb.b;
		} else {
			// Default HSV color space
			const h = color.h || 0;
			const s = color.s || 0;
			const v = color.v || 0;
			const rgb = hsvToRgb(h, s, v);
			r = rgb.r;
			g = rgb.g;
			b = rgb.b;
		}
	} catch (e) {
		// Fallback to HSV if store is not available
		const h = color.h || 0;
		const s = color.s || 0;
		const v = color.v || 0;
		const rgb = hsvToRgb(h, s, v);
		r = rgb.r;
		g = rgb.g;
		b = rgb.b;
	}

	return rgbToHex(r, g, b);
}

/**
 * Convert RGB values to hex string
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} - Hex color string (e.g., "#ff0000")
 */
export function rgbToHex(r, g, b) {
	return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

/**
 * Convert a single color component to hex
 * @param {number} c - Color component (0-255)
 * @returns {string} - Two-character hex string
 */
function componentToHex(c) {
	const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
	return hex.length === 1 ? `0${hex}` : hex;
}

/**
 * Calculate the contrast ratio between two colors
 * @param {Object} color1 - First color in HSV format {h, s, v}
 * @param {Object} color2 - Second color in HSV format {h, s, v}
 * @returns {number} - Contrast ratio between the colors
 */
export function getContrastRatio(color1, color2) {
	const rgb1 = hsvToRgb(color1.h, color1.s, color1.v);
	const rgb2 = hsvToRgb(color2.h, color2.s, color2.v);

	const luminance1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
	const luminance2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);

	// Calculate contrast ratio according to WCAG formula
	const lighter = Math.max(luminance1, luminance2);
	const darker = Math.min(luminance1, luminance2);

	return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of an RGB color according to WCAG
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {number} - Luminance value
 */
function calculateLuminance(r, g, b) {
	// Convert RGB to sRGB
	const sR = r / 255;
	const sG = g / 255;
	const sB = b / 255;

	// Convert sRGB to linear RGB
	const R = sR <= 0.03928 ? sR / 12.92 : ((sR + 0.055) / 1.055) ** 2.4;
	const G = sG <= 0.03928 ? sG / 12.92 : ((sG + 0.055) / 1.055) ** 2.4;
	const B = sB <= 0.03928 ? sB / 12.92 : ((sB + 0.055) / 1.055) ** 2.4;

	// Calculate luminance using the WCAG formula
	return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
