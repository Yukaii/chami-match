<script setup>
import {
	computed,
	nextTick,
	onBeforeUnmount,
	onMounted,
	ref,
	watch,
} from "vue";
import { useGameStore } from "../stores/game";
import { ImageMode } from "../stores/modes/ImageMode";
import GameNavBar from "./GameNavBar.vue";
import HealthBar from "./HealthBar.vue";
import Toolbar from "./Toolbar.vue";
import BaseButton from "./base/BaseButton.vue"; // Add BaseButton import

const store = useGameStore();

// Track image loading and processing
const imageLoaded = ref(false);
const imageProcessing = ref(false);
const imageElement = ref(null);

// Track selected color index
const selectedColorIndex = ref(-1);

// Target circle properties (renamed from magnifier)
const targetCircleSize = ref(15);
// Remove targetCircleZoom

// Direct reference to ColorMode implementation
const colorMode = ref(null);

// Track if the image URL is ready
const imageReady = ref(false);

// Track actual image display dimensions
const displayedImageWidth = ref(0);
const displayedImageHeight = ref(0);
const imageContainerRef = ref(null);
const imageWrapperRef = ref(null); // Add ref for image wrapper

// Calculate scale factors for the image
const imageScaleFactor = computed(() => {
	if (
		!imageElement.value ||
		!displayedImageWidth.value ||
		!imageElement.value.naturalWidth
	) {
		return { x: 1, y: 1 };
	}

	return {
		x: displayedImageWidth.value / imageElement.value.naturalWidth,
		y: displayedImageHeight.value / imageElement.value.naturalHeight,
	};
});

// Check if target color is light to determine border color
const isTargetColorLight = computed(() => {
	if (!colorMode.value?.state?.randomColor) return false;

	// Get brightness value (v in HSV)
	const brightness = colorMode.value.state.randomColor.v;

	// Consider colors with value > 70 as light
	return brightness > 70;
});

// Get target region with defensive checks
const getTargetRegion = computed(() => {
	if (!store.currentModeState?.targetRegion) {
		return { x: 0, y: 0, radius: 20, ready: false };
	}

	const region = store.currentModeState.targetRegion;
	const ready = store.currentModeState.targetRegionReady;

	return {
		x: Number(region.x) || 0,
		y: Number(region.y) || 0,
		radius: Number(region.radius) || 20,
		ready: Boolean(ready),
	};
});

// Check if color options are available
const hasColorOptions = computed(() => {
	const options =
		colorMode.value?.state?.colorOptions ||
		store.currentModeState?.colorOptions;
	return Array.isArray(options) && options.length > 0;
});

// Get current color options from either source
const currentColorOptions = computed(() => {
	return (
		colorMode.value?.state?.colorOptions ||
		store.currentModeState?.colorOptions ||
		[]
	);
});

// Calculate adjusted position for target circle and magnifier
function getAdjustedPosition(x, y) {
	if (
		!imageElement.value ||
		!imageWrapperRef.value ||
		typeof x !== "number" ||
		typeof y !== "number"
	) {
		return { x: 0, y: 0 };
	}

	try {
		// Get the actual dimensions of the image as displayed
		const imageRect = imageElement.value.getBoundingClientRect();

		// Calculate scaling of the image based on natural vs displayed size
		const scaleX = imageRect.width / imageElement.value.naturalWidth;
		const scaleY = imageRect.height / imageElement.value.naturalHeight;

		// Calculate the position within the image itself
		const scaledX = x * scaleX;
		const scaledY = y * scaleY;

		return {
			x: scaledX,
			y: scaledY,
		};
	} catch (error) {
		console.error("Error calculating position:", error);
		return { x: 0, y: 0 };
	}
}

// Add debounce function
function debounce(fn, delay) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn.apply(this, args), delay);
	};
}

// Debounced version of updateImageDimensions
const debouncedUpdateDimensions = debounce(() => {
	updateImageDimensions();
}, 100);

// Update the image dimensions
function updateImageDimensions() {
	if (imageElement.value) {
		const imageRect = imageElement.value.getBoundingClientRect();
		displayedImageWidth.value = imageRect.width;
		displayedImageHeight.value = imageRect.height;
		// Force position update when dimensions change
		positionUpdateTrigger.value++;
	}
}

// Initialize the ColorMode
async function initializeImageMode() {
	console.log("Initializing image mode, current state:", {
		gameType: store.gameType,
		hasGameMode: !!store.currentGameMode,
	});

	// Force the game type to color
	store.updateGameType("image");

	// Create a fresh start
	await new Promise((resolve) => setTimeout(resolve, 50));
	store.startOver();
	await new Promise((resolve) => setTimeout(resolve, 100));

	// Create new ColorMode instance if needed
	if (!store.currentGameMode || store.currentGameMode.type !== "image") {
		console.log("Creating ImageMode instance");
		colorMode.value = new ImageMode({
			colorMode: store.mode,
			precision: store.precision,
			realtimePreview: store.realtimePreview,
		});

		// Initialize its state
		const initState = colorMode.value.initState();
		colorMode.value.state = initState;

		// Fetch a new image right away
		await colorMode.value.fetchRandomImage();
		console.log("Created ColorMode:", colorMode.value);
	} else {
		// Use the existing one
		colorMode.value = store.currentGameMode;
		console.log("Using existing ColorMode:", colorMode.value);
	}

	// Set image ready flag once we have an image URL
	if (colorMode.value?.state?.imageUrl) {
		imageReady.value = true;
	}
}

// Initialize when component mounts
onMounted(async () => {
	console.log("ImageGameScreen mounted, initializing");
	await initializeImageMode();

	// Add resize listener with the debounced function
	window.addEventListener("resize", debouncedUpdateDimensions);

	// Initial dimension update
	nextTick(() => {
		updateImageDimensions();
	});

	// Setup ResizeObserver for more reliable size change detection
	if (window.ResizeObserver) {
		resizeObserver = new ResizeObserver(debouncedUpdateDimensions);

		// Observe both the wrapper and the image
		if (imageWrapperRef.value) {
			resizeObserver.observe(imageWrapperRef.value);
		}
		if (imageElement.value) {
			resizeObserver.observe(imageElement.value);
		}
	}
});

// Clean up event listeners and observers
onBeforeUnmount(() => {
	window.removeEventListener("resize", debouncedUpdateDimensions);
	if (resizeObserver) {
		resizeObserver.disconnect();
	}
});

// Handle image load
async function handleImageLoad() {
	if (!imageElement.value || imageProcessing.value) return;

	console.log("Image loaded, processing...");
	imageProcessing.value = true;

	try {
		// Ensure colorMode is initialized
		if (!colorMode.value?.state) {
			console.log("Reinitializing color mode state");
			await initializeImageMode();
		}

		const extractedColor = await colorMode.value.selectRandomColorFromImage(
			imageElement.value,
		);
		console.log("Extracted color:", extractedColor);

		imageLoaded.value = true;
		await nextTick();
		updateImageDimensions();

		// Update color mode with extracted color
		colorMode.value.setTargetColorAndGenerateOptions(extractedColor);

		// Set the current game mode
		store.currentGameMode = colorMode.value;

		// Update the game mode state
		if (colorMode.value?.state) {
			const newState = {
				targetRegion: colorMode.value.state.targetRegion,
				targetRegionReady: true,
				colorOptions: [...(colorMode.value.state.colorOptions || [])],
				imageUrl: colorMode.value.state.imageUrl,
				randomColor: { ...colorMode.value.state.randomColor },
			};

			// Ensure atomic state update
			Object.assign(colorMode.value.state, newState);
			Object.assign(store.currentModeState, newState);
		}
	} catch (error) {
		console.error("Error processing image:", error);
		imageLoaded.value = false;
	} finally {
		imageProcessing.value = false;
		// Ensure dimensions are updated after processing completes
		nextTick(() => updateImageDimensions());
	}
}

// Handle color selection
function selectColor(color, index) {
	if (!color) return;

	selectedColorIndex.value = index;
	if (colorMode.value) {
		colorMode.value.state.userColor.h = color.h;
		colorMode.value.state.userColor.s = color.s;
		colorMode.value.state.userColor.v = color.v;
	}
	store.updateUserColor(color.h, color.s, color.v);
	store.checkGuess();
}

// Reset selection and start a new round
function resetSelection() {
	selectedColorIndex.value = -1; // Reset selected index
	if (colorMode.value && typeof colorMode.value.startRound === "function") {
		imageLoaded.value = false;
		imageProcessing.value = false;
		colorMode.value.startRound().then(() => {
			if (colorMode.value?.state) {
				const newState = {
					targetRegion: colorMode.value.state.targetRegion,
					targetRegionReady: true,
					colorOptions: [...(colorMode.value.state.colorOptions || [])],
					imageUrl: colorMode.value.state.imageUrl,
				};
				Object.assign(colorMode.value.state, newState);
				Object.assign(store.currentModeState, newState);
			}
		});
	}
}

// Development mode flag
// const isDevMode = ref(import.meta.env.DEV);
const isDevMode = ref(false);

// Fixed size for inner color dot (in pixels)
const innerColorDotSize = 10;

// Add a watcher to update dimensions when key properties change
watch(
	[
		() => imageElement.value?.naturalWidth,
		() => imageElement.value?.naturalHeight,
		() => imageWrapperRef.value?.clientWidth,
		() => imageWrapperRef.value?.clientHeight,
		imageLoaded,
	],
	() => {
		if (imageLoaded.value && !imageProcessing.value) {
			nextTick(() => {
				updateImageDimensions();
				// Force position update
				positionUpdateTrigger.value++;
			});
		}
	},
);

// Add a reactive counter to force position updates
const positionUpdateTrigger = ref(0);

// Create a reactive computed property for the adjusted position
const adjustedTargetPosition = computed(() => {
	// Including positionUpdateTrigger in the computation makes this reactive
	positionUpdateTrigger.value;
	if (!getTargetRegion.value || getTargetRegion.value.x === undefined) {
		return { x: 0, y: 0 };
	}
	return getAdjustedPosition(getTargetRegion.value.x, getTargetRegion.value.y);
});

// Track resize observer
let resizeObserver = null;

// Update observer targets when refs change
watch([imageWrapperRef, imageElement], ([newWrapper, newImage]) => {
	if (resizeObserver) {
		resizeObserver.disconnect();

		if (newWrapper) {
			resizeObserver.observe(newWrapper);
		}
		if (newImage) {
			resizeObserver.observe(newImage);
		}
	}
});
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2 pb-4">
    <div class="flex flex-col gap-3">
      <!-- Navigation bar -->
      <GameNavBar @start-over="resetSelection" />
      <!-- Game stats toolbar -->
      <Toolbar />
      <HealthBar />
    </div>

    <div class="flex h-full flex-col items-center gap-4">
      <!-- Game instructions -->
      <div class="text-center">
        <p>{{ $t('gameModes.color.instructions') }}</p>
      </div>

      <!-- Image container -->
      <div
        ref="imageContainerRef"
        class="relative flex-1 w-full max-w-md mx-auto overflow-hidden image-container"
      >
        <!-- Loading spinner -->
        <div v-if="!imageLoaded || imageProcessing" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>

        <!-- Image with target circle -->
        <div class="relative w-full h-full flex items-center justify-center">
          <!-- Added wrapper around image and target circle -->
          <div class="relative image-target-wrapper" ref="imageWrapperRef">
            <img
              v-if="store.currentModeState?.imageUrl"
              :key="store.currentModeState.imageUrl"
              ref="imageElement"
              :src="store.currentModeState.imageUrl"
              alt="Random image for color matching"
              class="object-contain rounded-lg game-image"
              crossorigin="anonymous"
              @load="handleImageLoad"
              @error="console.error('Image failed to load:', store.currentModeState.imageUrl)"
            />

            <!-- Target circle overlay - now using computed adjustedTargetPosition -->
            <div
              v-if="imageLoaded && !imageProcessing && getTargetRegion?.x !== undefined"
              class="absolute pointer-events-none shadow-lg overflow-hidden rounded-full"
              :class="{ 'border-black border-2': isTargetColorLight, 'border-white border-2': !isTargetColorLight }"
              :style="{
                width: `${targetCircleSize}px`,
                height: `${targetCircleSize}px`,
                top: `${adjustedTargetPosition.y - targetCircleSize/2}px`,
                left: `${adjustedTargetPosition.x - targetCircleSize/2}px`,
                zIndex: 10
              }"
            >
            </div>
          </div>
        </div>

        <!-- Toggle target circle button removed -->

        <!-- Debug overlay for development -->
        <div
          v-if="isDevMode && imageLoaded && !imageProcessing && getTargetRegion"
          class="absolute top-0 left-0 bg-black/50 text-white p-2 text-xs"
        >
          <div>Target: {{ getTargetRegion.x }}, {{ getTargetRegion.y }}</div>
          <div>Adjusted: {{ getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).x }},
               {{ getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).y }}</div>
          <div>Scale: {{ imageScaleFactor.x }}, {{ imageScaleFactor.y }}</div>
          <div>Image: {{ displayedImageWidth }}x{{ displayedImageHeight }}</div>
        </div>
      </div>

      <!-- Color selection options -->
      <div class="relative mt-4 w-full flex flex-col">
        <h3 class="mb-2 text-center text-lg font-bold">
          {{ $t('gameModes.color.selectPrompt') }}
        </h3>

        <div class="grid min-h-15 w-full grid-cols-3 gap-3 color-grid">
          <template v-if="hasColorOptions">
            <button
              v-for="(color, index) in currentColorOptions"
              :key="index"
              class="min-h-8 rounded-lg transition-transform hover:scale-105 color-button"
              :class="{
                'border-2 border-transparent hover:border-white': selectedColorIndex !== index,
                'border-4 border-white ring-2 ring-offset-2 selected': selectedColorIndex === index
              }"
              :style="`background-color: hsl(${color?.h || 0}, ${color?.s || 0}%, ${color?.v || 0}%);`"
              @click="selectColor(color, index)"
            />
          </template>
          <template v-else>
            <div
              v-for="index in 6"
              :key="index"
              class="min-h-8 rounded-lg bg-gray-300 dark:bg-gray-600"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 0.75rem;
  min-height: 8rem;
}

.color-button {
  border-radius: 0.5rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.color-button:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.color-button.selected {
  border: 4px solid white;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5);
  transform: scale(1.05);
}

.image-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 32rem; /* 512px */
  margin: 0 auto;
  overflow: hidden;
  min-height: 300px;
}

.game-image {
  display: block;
  max-height: 300px;
  object-fit: contain;
  border-radius: 0.5rem;
  image-rendering: pixelated;
  image-rendering: -webkit-optimize-contrast;
}

/* Renamed class from magnifier to target-circle */
.target-circle {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.target-circle img {
  object-fit: cover;
  image-rendering: pixelated;
  image-rendering: -webkit-optimize-contrast;
}

.image-target-wrapper {
  position: relative;
  display: inline-block;
}
</style>
