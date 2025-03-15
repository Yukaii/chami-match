<script setup>
import { onMounted, ref, watch, computed, onBeforeUnmount, reactive, nextTick } from "vue";
import { useGlobalGameState } from "../gameState";
import GameNavBar from "./GameNavBar.vue";
import { ImageMode } from "../gameState/modes/ImageMode"; // Import ImageMode explicitly

const state = useGlobalGameState();
const currentRound = state.currentRound;

// Track image loading and processing
const imageLoaded = ref(false);
const imageProcessing = ref(false);
const imageElement = ref(null);

// Track selected color index
const selectedColorIndex = ref(-1);

// Magnifier properties
const magnifierSize = ref(100);
const magnifierZoom = ref(2);
const showMagnifier = ref(true);

// IMPORTANT: Get direct reference to ImageMode implementation
const imageMode = ref(null);

// Add a ref to track if the image URL is ready
const imageReady = ref(false);

// Add reactive refs to track the actual image display dimensions
const displayedImageWidth = ref(0);
const displayedImageHeight = ref(0);
const imageContainerRef = ref(null);

// Calculate scale factors for the image
const imageScaleFactor = computed(() => {
  if (!imageElement.value || !displayedImageWidth.value || !imageElement.value.naturalWidth) {
    return { x: 1, y: 1 };
  }

  return {
    x: displayedImageWidth.value / imageElement.value.naturalWidth,
    y: displayedImageHeight.value / imageElement.value.naturalHeight
  };
});

// Make getTargetRegion more defensive
const getTargetRegion = computed(() => {
  if (!state.currentModeState?.targetRegion) {
    return { x: 0, y: 0, radius: 20 };
  }

  const region = state.currentModeState.targetRegion;
  const ready = state.currentModeState.targetRegionReady;

  // Ensure we always return valid numbers
  return {
    x: Number(region.x) || 0,
    y: Number(region.y) || 0,
    radius: Number(region.radius) || 20,
    ready: Boolean(ready)
  };
});

// Update the hasColorOptions computed property
const hasColorOptions = computed(() => {
  const imgModeOptions = imageMode.value?.state?.colorOptions;
  const stateOptions = state.currentModeState?.colorOptions;
  return (Array.isArray(imgModeOptions) && imgModeOptions.length > 0) ||
         (Array.isArray(stateOptions) && stateOptions.length > 0);
});

const currentColorOptions = computed(() => {
  return imageMode.value?.state?.colorOptions ||
         state.currentModeState?.colorOptions ||
         [];
});

// Calculate adjusted position for target circle and magnifier with null checks
function getAdjustedPosition(x, y) {
  console.log('getAdjustedPosition called with:', { x, y });
  console.log('Current state:', {
    imageLoaded: imageLoaded.value,
    hasImage: !!imageElement.value,
    hasContainer: !!imageContainerRef.value,
    dimensions: {
      displayed: { w: displayedImageWidth.value, h: displayedImageHeight.value },
      natural: imageElement.value?.naturalWidth && {
        w: imageElement.value.naturalWidth,
        h: imageElement.value.naturalHeight
      }
    }
  });

  if (!imageElement.value || !imageContainerRef.value ||
      typeof x !== 'number' || typeof y !== 'number') {
    console.warn('Invalid inputs for position adjustment:', {
      x, y,
      hasImage: !!imageElement.value,
      hasContainer: !!imageContainerRef.value
    });
    return { x: 0, y: 0 };
  }

  try {
    const imageRect = imageElement.value.getBoundingClientRect();
    const containerRect = imageContainerRef.value.getBoundingClientRect();

    console.log('Raw element dimensions:', {
      image: {
        natural: { w: imageElement.value.naturalWidth, h: imageElement.value.naturalHeight },
        client: { w: imageElement.value.clientWidth, h: imageElement.value.clientHeight },
        rect: imageRect
      },
      container: containerRect
    });

    // Calculate the actual scaling of the image
    const scaleX = imageRect.width / imageElement.value.naturalWidth;
    const scaleY = imageRect.height / imageElement.value.naturalHeight;

    // Calculate image position within container
    const imageOffsetX = (containerRect.width - imageRect.width) / 2;
    const imageOffsetY = (containerRect.height - imageRect.height) / 2;

    // Apply scaling to the coordinates
    const scaledX = x * scaleX + imageOffsetX;
    const scaledY = y * scaleY + imageOffsetY;

    const result = { x: scaledX, y: scaledY };
    console.log('Position calculation result:', {
      input: { x, y },
      scale: { x: scaleX, y: scaleY },
      offset: { x: imageOffsetX, y: imageOffsetY },
      output: result
    });

    return result;
  } catch (error) {
    console.error("Error calculating position:", error);
    return { x: 0, y: 0 };
  }
}

// Update the magnifier position on image load
function updateImageDimensions() {
  if (imageElement.value) {
    displayedImageWidth.value = imageElement.value.clientWidth;
    displayedImageHeight.value = imageElement.value.clientHeight;
    console.log(`Image displayed dimensions: ${displayedImageWidth.value}x${displayedImageHeight.value}`);
  }
}

// Init function that we'll call both during mount and image load
async function initializeImageMode() {
  console.log("Initializing image mode directly, current state:", {
    gameType: state.gameType,
    hasGameMode: !!state.currentGameMode,
    gameModeType: state.currentGameMode?.type
  });

  // Force the game type to image
  state.updateGameType("image");

  // Ensure we have a fresh start
  await new Promise(resolve => setTimeout(resolve, 50));
  state.startOver();
  await new Promise(resolve => setTimeout(resolve, 100));

  // Directly create and store an ImageMode reference
  if (!state.currentGameMode || state.currentGameMode.type !== 'image') {
    console.log("Creating direct ImageMode instance");
    imageMode.value = new ImageMode({
      colorMode: state.mode,
      precision: state.precision,
      realtimePreview: state.realtimePreview
    });

    // Initialize its state
    const initState = imageMode.value.initState();
    imageMode.value.state = initState;

    // Fetch a new image right away
    await imageMode.value.fetchRandomImage();
    console.log("Created direct ImageMode:", imageMode.value);
  } else {
    // Use the existing one
    imageMode.value = state.currentGameMode;
    console.log("Using existing ImageMode:", imageMode.value);
  }

  // Set image ready flag once we have an image URL
  if (imageMode.value?.state?.imageUrl) {
    console.log("Image URL is ready:", imageMode.value.state.imageUrl);
    imageReady.value = true;
  }

  // Verify the ImageMode has the required methods
  console.log("ImageMode instance has methods:", {
    selectRandomColorFromImage: typeof imageMode.value.selectRandomColorFromImage === 'function',
    setTargetColorAndGenerateOptions: typeof imageMode.value.setTargetColorAndGenerateOptions === 'function'
  });
}

// Add initialization logic when component mounts with explicit type checking
onMounted(async () => {
  console.log("ImageGameScreen mounted, current game type:", state.gameType);
  await initializeImageMode();

  // Add resize listener
  window.addEventListener('resize', updateImageDimensions);
});

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateImageDimensions);
});

// Enhanced image load handler with additional checks
async function handleImageLoad() {
  if (!imageElement.value || imageProcessing.value) return;

  console.log("Image loaded, processing...");
  imageProcessing.value = true;

  try {
    // Ensure imageMode is initialized
    if (!imageMode.value?.state) {
      console.log("Reinitializing image mode state");
      await initializeImageMode();
    }

    const extractedColor = await imageMode.value.selectRandomColorFromImage(imageElement.value);
    console.log("Extracted color:", extractedColor);

    imageLoaded.value = true;
    await nextTick();
    updateImageDimensions();

    // Add immediate position check right after dimensions update
    console.log('Checking target region after image load:', {
      region: state.currentModeState?.targetRegion,
      ready: state.currentModeState?.targetRegion?.targetRegionReady
    });

    if (getTargetRegion.value) {
      const pos = getAdjustedPosition(getTargetRegion.value.x, getTargetRegion.value.y);
      console.log('Initial position after image load:', pos);
    }

    console.log('Image loaded and dimensions updated:', {
      width: displayedImageWidth.value,
      height: displayedImageHeight.value,
      targetRegion: getTargetRegion.value
    });

    // Update image mode first
    imageMode.value.setTargetColorAndGenerateOptions(extractedColor);

    // Set the current game mode
    state.currentGameMode = imageMode.value;

    // Update the game mode state directly with safety check
    if (imageMode.value?.state) {
      const newState = {
        targetRegion: imageMode.value.state.targetRegion,
        targetRegionReady: true,
        colorOptions: [...(imageMode.value.state.colorOptions || [])],
        imageUrl: imageMode.value.state.imageUrl
      };

      // Ensure atomic state update
      Object.assign(imageMode.value.state, newState);
      Object.assign(state.currentModeState, newState);

      console.log("Updated states:", {
        imageMode: imageMode.value.state.targetRegion,
        global: state.currentModeState.targetRegion,
        ready: state.currentModeState.targetRegionReady
      });
    }

  } catch (error) {
    console.error("Error processing image:", error);
    imageLoaded.value = false;
  } finally {
    imageProcessing.value = false;
  }
}

// Use a watcher to detect new rounds and reset the selected color index
watch(
  [() => state.randomColor, () => currentRound.value],
  () => {
    imageLoaded.value = false;
    imageProcessing.value = false;
    selectedColorIndex.value = -1;
  },
  { deep: true },
);

function selectColor(color, index) {
  if (!color) return;

  selectedColorIndex.value = index;
  if (imageMode.value) {
    imageMode.value.state.userColor.h = color.h;
    imageMode.value.state.userColor.s = color.s;
    imageMode.value.state.userColor.v = color.v;
  }
  state.updateUserColor(color.h, color.s, color.v);
  state.checkGuess();
}

function resetSelection() {
  selectedColorIndex.value = -1; // Reset selected index
}

// Toggle magnifier
function toggleMagnifier() {
  showMagnifier.value = !showMagnifier.value;
}

// Remove the isDev computed property and add isDevMode ref
const isDevMode = ref(import.meta.env.DEV);

// Add watchers for debugging position updates
watch(() => getTargetRegion.value, (newRegion) => {
  console.log('Target region updated:', newRegion);
  if (newRegion && imageLoaded.value) {
    const pos = getAdjustedPosition(newRegion.x, newRegion.y);
    console.log('New adjusted position:', pos);
  }
}, { deep: true, immediate: true });

watch([displayedImageWidth, displayedImageHeight], ([width, height]) => {
  console.log('Image dimensions changed:', { width, height });
  if (getTargetRegion.value) {
    const pos = getAdjustedPosition(getTargetRegion.value.x, getTargetRegion.value.y);
    console.log('Recalculated position after dimension change:', pos);
  }
}, { immediate: true });
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2 pb-4">
    <div class="flex flex-col gap-3">
      <!-- Navigation bar separate from game toolbar -->
      <GameNavBar @start-over="resetSelection" />
      <!-- Regular game toolbar with all stats -->
      <Toolbar />
      <HealthBar />
    </div>

    <div class="flex h-full flex-col items-center gap-4">
      <!-- Game instructions -->
      <div class="text-center">
        <p>{{ $t('gameModes.image.instructions') }}</p>
      </div>

      <!-- Image container with better sizing constraints -->
      <div
        ref="imageContainerRef"
        class="relative flex-1 w-full max-w-md mx-auto overflow-hidden image-container"
      >
        <!-- Loading spinner -->
        <div v-if="!imageLoaded || imageProcessing" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>

        <!-- Debug info - show image URL to verify it's correct -->
        <div v-if="!imageLoaded && state.currentModeState?.imageUrl" class="text-xs text-gray-500 dark:text-gray-400 absolute top-0 left-0 right-0 text-center">
          Loading: {{ state.currentModeState.imageUrl.substring(0, 30) }}...
        </div>

        <!-- Image with magnifier -->
        <div class="relative w-full h-full flex items-center justify-center">
          <img
            v-if="state.currentModeState?.imageUrl"
            ref="imageElement"
            :src="state.currentModeState.imageUrl"
            alt="Random image for color matching"
            class="object-contain rounded-lg game-image"
            crossorigin="anonymous"
            @load="handleImageLoad"
            @error="console.error('Image failed to load:', state.currentModeState.imageUrl)"
          />

          <!-- Magnifier overlay with adjusted position -->
          <div
            v-if="showMagnifier && imageLoaded && !imageProcessing &&
                  getTargetRegion?.x !== undefined"
            class="absolute pointer-events-none border-4 border-white shadow-lg overflow-hidden rounded-full bg-white"
            :style="{
              width: `${magnifierSize}px`,
              height: `${magnifierSize}px`,
              top: `${getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).y - magnifierSize/2}px`,
              left: `${getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).x - magnifierSize/2}px`,
              transform: `scale(${magnifierZoom})`,
              transformOrigin: 'center',
              zIndex: 10
            }"
          >
            <img
              :src="state.currentModeState.imageUrl"
              class="absolute"
              :style="{
                width: `${displayedImageWidth}px`,
                height: `${displayedImageHeight}px`,
                top: `${getTargetRegion ? -(getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).y - magnifierSize/2) : 0}px`,
                left: `${getTargetRegion ? -(getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).x - magnifierSize/2) : 0}px`
              }"
            />
          </div>

          <!-- Target circle with adjusted position -->
          <div
            v-if="imageLoaded && !imageProcessing && getTargetRegion?.x !== undefined"
            class="absolute rounded-full border-2 border-white pointer-events-none"
            :style="{
              width: `${(getTargetRegion.radius || 20) * 2 * imageScaleFactor.x}px`,
              height: `${(getTargetRegion.radius || 20) * 2 * imageScaleFactor.y}px`,
              top: `${getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).y -
                    ((getTargetRegion.radius || 20) * imageScaleFactor.y)}px`,
              left: `${getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).x -
                    ((getTargetRegion.radius || 20) * imageScaleFactor.x)}px`
            }"
          ></div>
        </div>

        <!-- Toggle magnifier button -->
        <button
          v-if="imageLoaded && !imageProcessing"
          class="absolute top-2 right-2 bg-white dark:bg-gray-700 p-2 rounded-full shadow-md text-sm"
          @click="toggleMagnifier"
        >
          <span v-if="showMagnifier">{{ $t('gameModes.image.toggleMagnifier.hide') }}</span>
          <span v-else>{{ $t('gameModes.image.toggleMagnifier.show') }}</span>
        </button>

        <!-- Add debug overlay -->
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

      <!-- Color selection options - Simplified to show only one grid -->
      <div class="relative mt-4 w-full flex flex-col">
        <h3 class="mb-2 text-center text-lg font-bold">
          {{ $t('gameModes.image.selectPrompt') }}
        </h3>

        <div class="grid min-h-24 w-full grid-cols-3 gap-3 color-grid">
          <template v-if="hasColorOptions">
            <button
              v-for="(color, index) in currentColorOptions"
              :key="index"
              class="min-h-16 rounded-lg transition-transform hover:scale-105 color-button"
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
              class="min-h-16 rounded-lg bg-gray-300 dark:bg-gray-600"
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
}
</style>
