import { hsvToRgb } from "./index";

/**
 * Convert HSV color object to a hex string for CSS
 * @param {Object} color - Color object with h, s, v properties
 * @returns {string} - Hex color string (e.g., "#ff0000")
 */
export function colorHSVtoHex(color) {
	if (!color || typeof color !== "object") {
		return "#000000";
	}

	const { h = 0, s = 0, v = 0 } = color;
	const { r, g, b } = hsvToRgb(h, s, v);

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
