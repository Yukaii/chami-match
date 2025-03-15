import { rgbToHsv, generateFallbackColor } from './colorUtils';

export function getPixelColorFromImageData(imageData, x, y) {
  const index = (y * imageData.width + x) * 4;
  return {
    r: imageData.data[index],
    g: imageData.data[index + 1],
    b: imageData.data[index + 2],
    a: imageData.data[index + 3]
  };
}

export function findSuitableColorRegion(ctx, width, height) {
  try {
    // Try up to 10 random spots to find a good color region
    for (let attempt = 0; attempt < 10; attempt++) {
      const margin = 0.1;
      const x = Math.floor(Math.random() * (width * (1 - 2 * margin))) + (width * margin);
      const y = Math.floor(Math.random() * (height * (1 - 2 * margin))) + (height * margin);

      const radius = 20;
      const regionData = ctx.getImageData(x - radius, y - radius, radius * 2, radius * 2);

      // Check if region has consistent color
      const centerColor = getPixelColorFromImageData(regionData, radius, radius);
      const { h, s, v } = rgbToHsv(centerColor.r, centerColor.g, centerColor.b);

      return {
        x,
        y,
        color: { h, s, v }
      };
    }

    // Fallback
    return {
      x: width / 2,
      y: height / 2,
      color: generateFallbackColor()
    };
  } catch (error) {
    console.error("Error in findSuitableColorRegion:", error);
    return {
      x: width / 2,
      y: height / 2,
      color: generateFallbackColor()
    };
  }
}
