<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Carousel, Navigation, Pagination, Slide } from "vue3-carousel";
// Removed useChallengeApi import
import { useGameStore } from "../stores/game";
// Removed Modal import
import ChallengePopup from "./ChallengePopup.vue"; // Import the new popup
import BaseButton from "./base/BaseButton.vue";
import "vue3-carousel/dist/carousel.css";

const store = useGameStore();
const router = useRouter();
const route = useRoute();
// Removed challenge API composable usage
// Removed local gameModes definition

// Current slide index
const currentSlide = ref(0);
// Removed accessCode ref
// Removed showJoinConfirmPopup ref
const challengeCodeFromUrl = ref(null); // State for code from URL (still needed for onMounted check)

// Get the current game mode based on slide index
const currentGameMode = computed(() => {
  if (currentSlide.value >= 0 && currentSlide.value < store.gameModes.length) {
    // Use store.gameModes
    return store.gameModes[currentSlide.value]; // Use store.gameModes
  }
  // Fall back to the first game mode if the index is invalid
  return store.gameModes[0]; // Use store.gameModes
});

function startGame() {
  const mode = currentGameMode.value;
  store.updateGameType(mode.type);
  store.updateLastPlayedGameType(mode.type); // Save the selected mode
  store.startOver(); // Initialize a new game
  router.push(mode.route);
}

function quickStartLastGame() {
  const lastGameType = store.lastPlayedGameType;
  const lastGame =
    store.gameModes.find((mode) => mode.type === lastGameType) ||
    store.gameModes[0]; // Use store.gameModes
  store.updateGameType(lastGame.type);
  store.startOver();
  router.push(lastGame.route);
}

function openSettings() {
  store.settingsMode = "global";
  store.toggleSettingsPopup();
}

function openChallengePopup() {
  store.toggleChallengePopup(); // Use the new action
}

// Removed handleJoinChallenge and rejoinChallenge functions
// Removed confirmAndJoinChallenge function

// Initialize the carousel to show the last played game (if available)
onMounted(() => {
  const lastType = store.lastPlayedGameType;
  if (lastType) {
    const lastIndex = store.gameModes.findIndex(
      (mode) => mode.type === lastType,
    ); // Use store.gameModes
    if (lastIndex !== -1) {
      currentSlide.value = lastIndex;
    }
  }

  // Check for challenge code in URL query params
  const codeFromQuery = route.query.challengeCode;
  if (
    codeFromQuery &&
    typeof codeFromQuery === "string" &&
    codeFromQuery.length === 6
  ) {
    challengeCodeFromUrl.value = codeFromQuery.toUpperCase();
    // Instead of showing local popup, open the ChallengePopup
    // showJoinConfirmPopup.value = true; // Remove this line
    store.toggleChallengePopup(); // Open the new popup
    // The ChallengePopup's onMounted hook should handle the code check now.
    // Clear the query param from URL without reloading page (optional, for cleaner URL)
    // router.replace({ query: { ...route.query, challengeCode: undefined } });
  }
});
</script>

<template>
  <div class="flex size-full flex-col items-center justify-center gap-6 p-4">
    <div class="text-center">
      <h1 class="mb-1 text-4xl font-bold text-pink-600 dark:text-orange-300">{{ $t('mainTitle') }}</h1>
      <p class="mb-2 text-xl font-semibold text-pink-500 dark:text-orange-200">{{ $t('subtitle') }}</p>
      <p class="text-lg text-gray-600 dark:text-gray-200">{{ $t('description') }}</p>
    </div>

    <div class="w-full max-w-md">
      <!-- Game mode carousel using vue3-carousel -->
      <div class="rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
        <carousel
          v-model="currentSlide"
          :items-to-show="1"
          :wrap-around="true"
          :transition="500"
        >
          <slide v-for="(mode, index) in store.gameModes" :key="index"> <!-- Use store.gameModes -->
            <div class="flex flex-col items-center px-4 w-full">
              <div
                class="flex h-24 w-24 items-center justify-center rounded-full mb-4"
                :class="mode.color.split(' ').slice(0, 2).join(' ')"
              >
                <span v-html="mode.icon"></span>
              </div>
              <h2 class="text-2xl font-bold mb-4">{{ $t(mode.name) }}</h2>
              <!-- Start button removed from here -->
            </div>
          </slide>

          <!-- Navigation arrows -->
          <template #addons>
            <navigation />
            <pagination />
          </template>
        </carousel>
      </div>

      <!-- Start game button - now outside the carousel -->
      <div class="mt-4">
        <BaseButton
          variant="primary"
          is3d
          size="lg"
          full-width
          :class-name="currentGameMode.color"
          :override-styles="true"
          @click="startGame"
        >
          {{ $t('start') }}
        </BaseButton>
      </div>

      <!-- Add Challenge Button -->
      <div class="mt-4" v-if="store.isServerAvailable">
         <BaseButton
           variant="secondary"
           full-width
           @click="openChallengePopup"
         >
           {{ $t('challenge.title') || 'Challenges' }}
         </BaseButton>
      </div>
       <div v-else class="mt-4 text-center text-sm text-red-500 dark:text-red-400">
         {{ $t('serverUnavailableShort') || 'Challenge server unavailable' }}
       </div>

      <!-- Settings and About buttons -->
      <div class="mt-4 flex flex-col gap-2">
        <BaseButton
          variant="secondary"
          full-width
          @click="openSettings"
        >
          {{ $t('settings.title') }}
        </BaseButton>

        <BaseButton
          variant="secondary"
          full-width
          @click="store.toggleAboutPopup()"
        >
          {{ $t('about.title') }}
        </BaseButton>

        <!-- Challenge Button Moved -->

      </div>

      <!-- Removed Join Challenge Section -->
      <!-- Removed Joined Challenges List -->
      <!-- Removed Server Unavailable Message (integrated with button) -->

    </div>

    <!-- Removed Join Challenge Confirmation Popup -->

    <!-- Add the Challenge Popup Component -->
    <ChallengePopup />

  </div>
</template>

<style>
/* Custom carousel styling to match the app's design */
.carousel__slide {
  padding: 10px;
}

.carousel__viewport {
  perspective: 2000px;
}

.carousel__track {
  transform-style: preserve-3d;
}

.carousel__slide--sliding {
  transition: 0.5s;
}

.carousel__slide {
  opacity: 0.9;
  transform: rotateY(-20deg) scale(0.9);
}

.carousel__slide--active ~ .carousel__slide {
  transform: rotateY(20deg) scale(0.9);
}

.carousel__slide--prev {
  opacity: 0.5;
  transform: rotateY(-10deg) scale(0.95);
}

.carousel__slide--next {
  opacity: 0.5;
  transform: rotateY(10deg) scale(0.95);
}

.carousel__slide--active {
  opacity: 1;
  transform: rotateY(0) scale(1);
}

/* Navigation arrows styling */
.carousel__prev,
.carousel__next {
  background-color: rgba(240, 240, 240, 0.8);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #333;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Dark mode support for navigation */
@media (prefers-color-scheme: dark) {
  .carousel__prev,
  .carousel__next {
    background-color: rgba(60, 60, 60, 0.8);
    color: #fff;
  }
}

/* Pagination styling */
.carousel__pagination {
  padding-top: 20px;
}

.carousel__pagination-button {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin: 0 5px;
  background-color: #ccc;
}

.carousel__pagination-button--active {
  background-color: #ff69b4;
}

/* Dark mode support for pagination */
@media (prefers-color-scheme: dark) {
  .carousel__pagination-button {
    background-color: #555;
  }
  .carousel__pagination-button--active {
    background-color: #ffa64d;
  }
}
</style>
