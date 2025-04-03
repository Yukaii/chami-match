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
    // Try several random spots to find a good color region
    let bestRegion = null;
    let bestScore = -1;
    const attempts = 500; // Increased from 10 to get more candidate regions
    const radius = 30;

    for (let attempt = 0; attempt < attempts; attempt++) {
      // Avoid edges by 10% of dimensions
      const margin = 0.1;
      const x =
        Math.floor(Math.random() * (width * (1 - 2 * margin))) + width * margin;
      const y =
        Math.floor(Math.random() * (height * (1 - 2 * margin))) +
        height * margin;

      // Sample a region to analyze color consistency
      const regionData = ctx.getImageData(
        x - radius,
        y - radius,
        radius * 2,
        radius * 2,
      );

      // Analyze the region for color consistency
      const { color, consistency, area } = analyzeColorRegion(regionData);

      // Calculate a suitability score based on color quality and consistency
      const saturationScore = color.s * 0.5; // Prefer more saturated colors
      const consistencyScore = consistency * 100; // Higher consistency is better
      const areaScore = area * 0.5; // Prefer regions with more similar pixels

      const totalScore = saturationScore + consistencyScore + areaScore;

      if (totalScore > bestScore && color.s > 15) {
        bestScore = totalScore;
        bestRegion = {
          x,
          y,
          color,
          score: totalScore,
        };
      }
    }

    if (bestRegion) {
      console.log("Found region with score:", bestRegion.score);
      return bestRegion;
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

// Analyze a region for color consistency and quality
function analyzeColorRegion(imageData) {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Get center pixel as reference color
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const centerIdx = (centerY * width + centerX) * 4;

  const centerRGB = {
    r: data[centerIdx],
    g: data[centerIdx + 1],
    b: data[centerIdx + 2],
  };

  // Convert center RGB to HSV for later use in the returned value
  const centerHSV = rgbToHsv(centerRGB.r, centerRGB.g, centerRGB.b);

  // Count similar pixels and calculate variance
  let similarPixels = 0;
  const totalPixels = width * height;

  // Track the RGB sums for averaging
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let colorCount = 0;

  // Threshold for considering pixels "similar" in RGB space
  const rgbTolerance = 30; // RGB distance threshold for similarity

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (data[idx + 3] < 128) continue; // Skip transparent pixels

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Calculate RGB color distance
      const rDiff = r - centerRGB.r;
      const gDiff = g - centerRGB.g;
      const bDiff = b - centerRGB.b;

      // Euclidean distance in RGB space
      const rgbDistance = Math.sqrt(
        rDiff * rDiff + gDiff * gDiff + bDiff * bDiff,
      );

      // Check if this pixel is similar to the center
      if (rgbDistance <= rgbTolerance) {
        similarPixels++;

        // Add to RGB averages
        sumR += r;
        sumG += g;
        sumB += b;
        colorCount++;
      }
    }
  }

  // Calculate final metrics
  const consistency = similarPixels / totalPixels; // 0 to 1, higher is better
  const area = similarPixels / (width * height); // 0 to 1, portion of region with similar colors

  // Calculate average RGB of similar pixels
  let finalColor;
  if (colorCount > 0) {
    const avgR = Math.round(sumR / colorCount);
    const avgG = Math.round(sumG / colorCount);
    const avgB = Math.round(sumB / colorCount);
    // Convert to HSV for the game's color format
    finalColor = rgbToHsv(avgR, avgG, avgB);
  } else {
    // Use center HSV as fallback
    finalColor = centerHSV;
  }

  return {
    color: finalColor,
    consistency: consistency,
    area: area,
  };
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

export class ImageMode extends ContextualMode {
  constructor(options = {}) {
    super(options);
    this.type = "image";
    this.viewCallbacks = {};
    this.prefetchedImages = [];
    this.prefetchBatchSize = 3;
    this.prefetchThreshold = 2;
    this.prefetchInProgress = false;

    // Start prefetching immediately
    this.prefetchImageBatch();
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

  // Generate a random image URL
  generateRandomImageUrl() {
    const size = 600;
    return `https://picsum.photos/${size}/${size}?_=${Date.now()}-${Math.random()}`;
  }

  // Prefetch a batch of images in the background
  async prefetchImageBatch() {
    if (this.prefetchInProgress) return;

    this.prefetchInProgress = true;
    try {
      const prefetchPromises = [];
      for (let i = 0; i < this.prefetchBatchSize; i++) {
        const url = this.generateRandomImageUrl();
        prefetchPromises.push(
          preloadImage(url)
            .then(() => url)
            .catch(() => null),
        );
      }

      // Wait for all images to load and filter out any failed loads
      const results = await Promise.all(prefetchPromises);
      const successfulUrls = results.filter((url) => url !== null);
      this.prefetchedImages.push(...successfulUrls);

      console.log(
        `Prefetched ${successfulUrls.length} images. Queue size: ${this.prefetchedImages.length}`,
      );
    } catch (error) {
      console.error("Error during batch prefetch:", error);
    } finally {
      this.prefetchInProgress = false;
    }
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
      let url;

      // Use a prefetched image if available
      if (this.prefetchedImages.length > 0) {
        url = this.prefetchedImages.shift();
        console.log("Using prefetched image:", url);

        // If we're running low on prefetched images, trigger another batch
        if (this.prefetchedImages.length <= this.prefetchThreshold) {
          this.prefetchImageBatch();
        }
      } else {
        // Fall back to direct fetch if no prefetched images are available
        console.log("No prefetched images available, fetching new one");
        url = this.generateRandomImageUrl();
        await preloadImage(url).catch((e) =>
          console.warn("Preload failed; using URL:", url, e),
        );
      }

      this.state.imageUrl = url;
      return url;
    } catch (error) {
      console.error("Error fetching random image:", error);
      // Generate a new URL in case of error
      const fallbackUrl = this.generateRandomImageUrl();
      this.state.imageUrl = fallbackUrl;
      return fallbackUrl;
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
      // Set willReadFrequently to true to optimize for multiple getImageData() calls
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

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

  resetUserInput() {
    // Properly initialize userColor if it doesn't exist
    if (!this.state) {
      console.warn("State is undefined in resetUserInput");
      return;
    }

    // Make sure userColor is initialized as a reactive object
    if (!this.state.userColor) {
      this.state.userColor = reactive({
        h: 0,
        s: 0,
        v: 0,
      });
    } else {
      // Update existing userColor object
      this.state.userColor.h = 0;
      this.state.userColor.s = 0;
      this.state.userColor.v = 0;
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
      // Make sure we have prefetched images before starting the round
      if (this.prefetchedImages.length === 0 && !this.prefetchInProgress) {
        console.log("No prefetched images available, starting batch prefetch");
        await this.prefetchImageBatch();
      }

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
