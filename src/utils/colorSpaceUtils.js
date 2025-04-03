/**
 * Color space conversion utilities for the Chami Match game
 * Provides functions to convert between HSV, RGB, and OKLAB color spaces
 */

/**
 * Convert HSV color values to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} v - Value (0-100)
 * @returns {Object} RGB values (r, g, b) in range 0-255
 */
export function hsvToRgb(h, s, v) {
  // Normalize values to the range used in calculations
  h = h / 360;
  s = s / 100;
  v = v / 100;

  let r;
  let g;
  let b;

  if (s === 0) {
    // Achromatic (grey)
    r = g = b = v;
  } else {
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }
  }

  // Convert to 0-255 range
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB color values to HSV
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {Object} HSV values (h: 0-360, s: 0-100, v: 0-100)
 */
export function rgbToHsv(r, g, b) {
  // Normalize RGB values
  r = r / 255;
  g = g / 255;
  b = b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff === 0) {
    h = 0; // achromatic (grey)
  } else {
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  // Convert to output ranges
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Convert HSV to OKLAB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} v - Value (0-100)
 * @returns {Object} OKLAB values (L: 0-100, a: -128 to 127, b: -128 to 127)
 */
export function hsvToOklab(h, s, v) {
  // For simplicity, we'll use a simplified approximation
  // Convert HSV to RGB first
  const rgb = hsvToRgb(h, s, v);

  // Then approximate OKLAB values
  // This is a simplified conversion that doesn't use the full OKLAB transform
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  // Approximate lightness (L) from RGB
  const L = Math.round(0.299 * r + 0.587 * g + 0.114 * b) * 100;

  // Approximate a (green-red) axis
  const a = Math.round((r - g) * 50);

  // Approximate b (blue-yellow) axis
  const bVal = Math.round((b - (r + g) / 2) * 50);

  return { L, a, b: bVal };
}

/**
 * Convert OKLAB to HSV
 * @param {number} L - Lightness (0-100)
 * @param {number} a - Green-red axis (-128 to 127)
 * @param {number} b - Blue-yellow axis (-128 to 127)
 * @returns {Object} HSV values (h: 0-360, s: 0-100, v: 0-100)
 */
export function oklabToHsv(L, a, b) {
  // Simplified approximation for demo purposes
  // This is not an accurate OKLAB to HSV conversion

  // Normalize L to 0-1
  const lightness = L / 100;

  // Convert a, b to RGB-like values
  const r = Math.min(Math.max(lightness + a / 100, 0), 1);
  const g = Math.min(Math.max(lightness - a / 200 - b / 200, 0), 1);
  const blue = Math.min(Math.max(lightness - a / 200 + b / 100, 0), 1);

  // Convert to 0-255 range
  const rgb = {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(blue * 255),
  };

  // Then convert RGB to HSV
  return rgbToHsv(rgb.r, rgb.g, rgb.b);
}

/**
 * Convert OKLAB to RGB
 * @param {number} L - Lightness (0-100)
 * @param {number} a - Green-red axis (-128 to 127)
 * @param {number} b - Blue-yellow axis (-128 to 127)
 * @returns {Object} RGB values (r, g, b) in range 0-255
 */
export function oklabToRgb(L, a, b) {
  // Simplified approximation for demo purposes
  // This is not an accurate OKLAB to RGB conversion

  // Normalize L to 0-1
  const lightness = L / 100;

  // Convert a, b to RGB-like values
  const r = Math.min(Math.max(lightness + a / 100, 0), 1);
  const g = Math.min(Math.max(lightness - a / 200 - b / 200, 0), 1);
  const blue = Math.min(Math.max(lightness - a / 200 + b / 100, 0), 1);

  // Convert to 0-255 range
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(blue * 255),
  };
}
