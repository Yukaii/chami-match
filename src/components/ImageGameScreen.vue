<script setup>
import { onMounted, ref, watch, computed, onBeforeUnmount } from "vue";
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

// Add safety checks for target region access
const getTargetRegion = computed(() => {
  if (!state.currentModeState?.targetRegion ||
      !state.currentModeState.targetRegionReady ||
      typeof state.currentModeState.targetRegion.x !== 'number' ||
      typeof state.currentModeState.targetRegion.y !== 'number') {
    return null;
  }
  return state.currentModeState.targetRegion;
});

// Add a computed property to properly handle color options display
const hasColorOptions = computed(() => {
  return state.colorOptions && state.colorOptions.length > 0;
});

// Calculate adjusted position for target circle and magnifier with null checks
function getAdjustedPosition(x, y) {
  if (!imageElement.value || !imageContainerRef.value ||
      typeof x !== 'number' || typeof y !== 'number') {
    return { x: 0, y: 0 };
  }

  try {
    const imageRect = imageElement.value.getBoundingClientRect();
    const scale = imageElement.value.naturalWidth / imageRect.width;

    // Calculate the scaled position
    const scaledX = (x / scale);
    const scaledY = (y / scale);

    return {
      x: scaledX,
      y: scaledY
    };
  } catch (error) {
    console.error("Error calculating adjusted position:", error);
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
  console.log("Image dimensions:", imageElement.value.naturalWidth, "x", imageElement.value.naturalHeight);
  imageProcessing.value = true;
  imageLoaded.value = true;

  // Update the displayed dimensions
  updateImageDimensions();

  try {
    // Check if the image has valid dimensions
    if (imageElement.value.naturalWidth === 0 || imageElement.value.naturalHeight === 0) {
      console.error("Image has no natural dimensions, trying to wait...");
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log("After wait, dimensions:", imageElement.value.naturalWidth, "x", imageElement.value.naturalHeight);
    }

    // Make sure we have a valid ImageMode reference
    if (!imageMode.value) {
      console.log("No ImageMode reference, initializing now");
      await initializeImageMode();
    }

    if (!imageMode.value || typeof imageMode.value.selectRandomColorFromImage !== 'function') {
      throw new Error("Failed to get valid ImageMode instance");
    }

    // Use our direct ImageMode reference with explicit target region initialization
    console.log("Using ImageMode to extract color from image");

    // Ensure the mode has a target region
    if (imageMode.value && !imageMode.value.state.targetRegion) {
      imageMode.value.state.targetRegion = { x: 0, y: 0, radius: 20 };
    }

    const extractedColor = await imageMode.value.selectRandomColorFromImage(imageElement.value);
    console.log("Extracted color:", extractedColor);

    // Verify target region exists after processing
    console.log("Target region after extraction:",
      imageMode.value.state.targetRegion ?
      `x:${imageMode.value.state.targetRegion.x}, y:${imageMode.value.state.targetRegion.y}` :
      "undefined");

    // Update the state's random color
    imageMode.value.setTargetColorAndGenerateOptions(extractedColor);

    // Also update the global state if possible
    if (state.currentGameMode && state.currentGameMode.type === 'image') {
      state.currentGameMode.setTargetColorAndGenerateOptions(extractedColor);
    }

    // Log color options after processing for debugging
    console.log("Color options available:",
      state.colorOptions?.length || 0,
      "items:",
      state.colorOptions);
  } catch (error) {
    console.error("Error processing image:", error);

    // Ensure we have a fallback target region if there was an error
    if (imageMode.value && !imageMode.value.state.targetRegion) {
      imageMode.value.state.targetRegion = { x: 0, y: 0, radius: 20 };
    }
  } finally {
    imageProcessing.value = false;
  }
}

// Use a watcher to detect new rounds and reset the selected color index
watch(
  [() => state.randomColor, () => currentRound.value],
  () => {
    // Reset selection when random color changes (new round starts)
    selectedColorIndex.value = -1;
    imageLoaded.value = false;
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
            v-if="showMagnifier && imageLoaded && !imageProcessing && getTargetRegion"
            class="absolute pointer-events-none border-4 border-white shadow-lg overflow-hidden rounded-full"
            :style="{
              width: `${magnifierSize}px`,
              height: `${magnifierSize}px`,
              top: `${getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).y - (magnifierSize/2)}px`,
              left: `${getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).x - (magnifierSize/2)}px`,
              transform: `scale(${magnifierZoom})`,
              transformOrigin: 'center center',
              zIndex: 10
            }"
          >
            <img
              :src="state.currentModeState.imageUrl"
              class="absolute"
              :style="{
                width: `${imageElement?.width || 0}px`,
                height: `${imageElement?.height || 0}px`,
                top: `${-(getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).y - (magnifierSize/2))}px`,
                left: `${-(getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).x - (magnifierSize/2))}px`
              }"
            />
          </div>

          <!-- Target circle with adjusted position -->
          <div
            v-if="imageLoaded && !imageProcessing && getTargetRegion"
            class="absolute rounded-full border-2 border-white pointer-events-none"
            :style="{
              width: `${(getTargetRegion.radius || 20) * 2 * imageScaleFactor.value.x}px`,
              height: `${(getTargetRegion.radius || 20) * 2 * imageScaleFactor.value.y}px`,
              top: `${getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).y -
                    ((getTargetRegion.radius || 20) * imageScaleFactor.value.y)}px`,
              left: `${getAdjustedPosition(getTargetRegion.x, getTargetRegion.y).x -
                    ((getTargetRegion.radius || 20) * imageScaleFactor.value.x)}px`
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
      </div>

      <!-- Color selection options - Simplified to show only one grid -->
      <div class="relative mt-4 w-full flex flex-col">
        <h3 class="mb-2 text-center text-lg font-bold">
          {{ $t('gameModes.image.selectPrompt') }}
        </h3>

        <div class="grid min-h-24 w-full grid-cols-3 gap-3 color-grid">
          <template v-if="hasColorOptions">
            <button
              v-for="(color, index) in state.colorOptions"
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
  aspect-ratio: 1/1;
  min-height: 3rem;
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
