<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "../stores/game";
import BaseButton from "./base/BaseButton.vue";
import { Carousel, Slide, Pagination, Navigation } from 'vue3-carousel';
import 'vue3-carousel/dist/carousel.css';

const store = useGameStore();
const router = useRouter();

// Game modes configuration
const gameModes = [
  {
    type: "standard",
    name: "startStandardGame",
    color: "bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 border-b-4 border-green-700 dark:border-green-800",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>`,
    route: "/game"
  },
  {
    type: "contextual",
    name: "startContextualGame",
    color: "bg-purple-500 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-700 border-b-4 border-purple-700 dark:border-purple-800",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>`,
    route: "/context-game"
  },
  {
    type: "relative",
    name: "startRelativeGame",
    color: "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 border-b-4 border-blue-700 dark:border-blue-800",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>`,
    route: "/relative-game"
  },
  {
    type: "image",
    name: "startColorGame",
    color: "bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700 border-b-4 border-amber-700 dark:border-amber-800",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>`,
    route: "/image-game"
  }
];

// Current slide index
const currentSlide = ref(0);

// Get the current game mode based on slide index
const currentGameMode = computed(() => {
  return gameModes[currentSlide.value];
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
  const lastGame = gameModes.find(mode => mode.type === lastGameType) || gameModes[0];
  store.updateGameType(lastGame.type);
  store.startOver();
  router.push(lastGame.route);
}

function openSettings() {
  store.settingsMode = "global";
  store.toggleSettingsPopup();
}

// Initialize the carousel to show the last played game (if available)
onMounted(() => {
  const lastType = store.lastPlayedGameType;
  if (lastType) {
    const lastIndex = gameModes.findIndex(mode => mode.type === lastType);
    if (lastIndex !== -1) {
      currentSlide.value = lastIndex;
    }
  }
});
</script>

<template>
  <div class="flex size-full flex-col items-center justify-center gap-6 p-4">
    <div class="text-center">
      <h1 class="mb-2 text-4xl font-bold text-pink-600 dark:text-orange-300">{{ $t('title') }}</h1>
      <p class="text-lg text-gray-600 dark:text-gray-200">{{ $t('description') }}</p>
    </div>

    <div class="w-full max-w-md">
      <!-- Game mode carousel using vue3-carousel -->
      <div class="rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
        <carousel
          v-model="currentSlide"
          :items-to-show="1"
          :wrap-around="false"
          :transition="500"
        >
          <slide v-for="(mode, index) in gameModes" :key="index">
            <div class="flex flex-col items-center px-4">
              <div
                class="flex h-24 w-24 items-center justify-center rounded-full mb-4"
                :class="mode.color.split(' ').slice(0, 2).join(' ')"
              >
                <span v-html="mode.icon"></span>
              </div>
              <h2 class="text-2xl font-bold mb-4">{{ $t(mode.name) }}</h2>

              <!-- Start game button -->
              <BaseButton
                v-if="index === currentSlide"
                variant="primary"
                is3d
                size="lg"
                full-width
                :class-name="mode.color"
                :override-styles="true"
                @click="startGame"
              >
                {{ $t('start') }}
              </BaseButton>
            </div>
          </slide>

          <!-- Navigation arrows -->
          <template #addons>
            <navigation />
            <pagination />
          </template>
        </carousel>
      </div>

      <!-- Quick start last played game -->
      <div v-if="store.lastPlayedGameType" class="mt-4">
        <BaseButton
          variant="primary"
          full-width
          @click="quickStartLastGame"
        >
          {{ $t('quickStart') }}
        </BaseButton>
      </div>

      <!-- Settings and About buttons -->
      <div class="mt-4">
        <BaseButton
          variant="secondary"
          full-width
          @click="openSettings"
        >
          {{ $t('settings.title') }}
        </BaseButton>
      </div>

      <BaseButton
        variant="secondary"
        full-width
        @click="store.toggleAboutPopup()"
      >
        {{ $t('about.title') }}
      </BaseButton>
    </div>
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
