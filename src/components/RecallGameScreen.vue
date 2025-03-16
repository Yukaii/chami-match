<template>
  <div class="flex size-full flex-col items-center p-4 text-gray-900 dark:text-white">
    <!-- Game Navigation -->
    <div class="w-full mb-4">
      <GameNavBar />
    </div>

    <!-- Game Stats -->
    <div class="w-full mb-4">
      <Toolbar />
    </div>

    <div class="mb-4 text-center">
      <h1 class="text-2xl font-bold">{{ $t('gameModes.recall.name') }}</h1>
      <p class="text-lg">{{ $t('gameModes.recall.description') }}</p>
    </div>

    <div class="mb-4">
      <p>{{ $t('gameModes.recall.instructions') }}</p>
    </div>

    <!-- Health Bar -->
    <div class="mb-4">
      <HealthBar />
    </div>

    <!-- Color Display Area -->
    <div class="flex flex-col items-center">
      <!-- The target color with countdown timer -->
      <div v-if="state.colorVisible"
           class="relative mb-8 size-32 rounded-lg border-4 border-gray-300 shadow-lg"
           :style="{ backgroundColor: colorHSVtoHex(state.randomColor) }">
        <div class="absolute -top-10 left-1/2 -translate-x-1/2 text-2xl font-bold">
          {{ state.timeRemaining }}s
        </div>
      </div>

      <!-- Placeholder when color is hidden -->
      <div v-else class="mb-8 size-32 rounded-lg border-4 border-gray-300 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <span class="text-lg font-bold text-gray-500 dark:text-gray-300">?</span>
      </div>

      <!-- Color selection prompt -->
      <h3 class="mb-2 text-xl font-bold">{{ $t('gameModes.recall.selectPrompt') }}</h3>

      <!-- Color options grid -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div v-for="(color, index) in state.colorOptions"
             :key="index"
             class="size-16 cursor-pointer rounded-lg border-2 border-gray-400 transition-all hover:scale-110"
             :class="{ 'ring-2 ring-pink-500 dark:ring-orange-300': isSelectedColor(color) }"
             :style="{ backgroundColor: colorHSVtoHex(color) }"
             @click="selectColor(color)">
        </div>
      </div>

      <!-- Last selection info -->
      <div v-if="lastSelectedColor" class="mb-4 text-center">
        <p>{{ $t('gameModes.recall.lastSelection') }}</p>
        <div class="mx-auto mt-1 size-8 rounded"
             :style="{ backgroundColor: colorHSVtoHex(lastSelectedColor) }">
        </div>
      </div>

      <!-- Submit Button -->
      <BaseButton
        variant="primary"
        :disabled="!userHasSelected || state.colorVisible"
        @click="submitGuess"
      >
        {{ $t('submit') }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '../stores/game';
import { colorHSVtoHex } from '../utils/colorUtils';
import BaseButton from './base/BaseButton.vue';
import GameNavBar from './GameNavBar.vue';
import HealthBar from './HealthBar.vue';
import Toolbar from './Toolbar.vue';

const { t } = useI18n();
const store = useGameStore();
const state = computed(() => store.currentModeState || {});
const lastSelectedColor = ref(null);
const userHasSelected = ref(false);
const timer = ref(null);

// Initialize the game
onMounted(() => {
  // Set the game type and start the game
  store.updateGameType('recall');
  store.startOver();

  // Register callbacks for the game mode
  if (store.currentGameMode) {
    store.currentGameMode.registerViewCallback('onNewRound', handleNewRound);
  }

  // Start the countdown timer
  startTimer();
});

// Clean up when component is destroyed
onBeforeUnmount(() => {
  clearTimer();
});

// Watch for new rounds to restart the timer
watch(() => store.currentRound, () => {
  startTimer();
});

// Watch for changes in the timeRemaining value
watch(() => state.value.timeRemaining, (newTime) => {
  if (newTime <= 0 && state.value.timerActive) {
    store.currentGameMode.hideColor();
  }
});

function handleNewRound() {
  // Reset state for a new round
  userHasSelected.value = false;
  lastSelectedColor.value = null;
  startTimer();
}

function startTimer() {
  // Clear existing timer
  clearTimer();

  // Only start if color should be visible
  if (state.value.colorVisible && state.value.timerActive) {
    timer.value = setInterval(() => {
      if (state.value.timeRemaining > 0) {
        state.value.timeRemaining -= 1;
      } else {
        clearTimer();
        store.currentGameMode.hideColor();
      }
    }, 1000);
  }
}

function clearTimer() {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
}

function selectColor(color) {
  // Only allow selection when color is hidden
  if (!state.value.colorVisible) {
    store.updateUserColor(color.h, color.s, color.v);
    lastSelectedColor.value = { ...color };
    userHasSelected.value = true;
  }
}

function isSelectedColor(color) {
  if (!state.value.userColor) return false;
  return (
    state.value.userColor.h === color.h &&
    state.value.userColor.s === color.s &&
    state.value.userColor.v === color.v
  );
}

function submitGuess() {
  if (userHasSelected.value && !state.value.colorVisible) {
    store.checkGuess();
  }
}
</script>
