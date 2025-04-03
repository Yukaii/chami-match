<script setup>
import { computed, onMounted } from "vue";
import { useGameStore } from "../stores/game";
import GameNavBar from "./GameNavBar.vue";
import BaseButton from "./base/BaseButton.vue";
import BaseSlider from "./base/BaseSlider.vue";

const store = useGameStore();

// Ensure the relative mode is initialized when component loads
onMounted(() => {
  if (store.gameType !== "relative") {
    store.updateGameType("relative");
    store.startOver(); // This will initialize the game mode and start a round
  }
  // If we're already in relative mode but don't have colors, just start a new round
  else if (!store.relativeColors || !store.relativeColors.color1) {
    store.startNewRound();
  }
});

// Create a computed property for the slider - using proper Pinia reactivity
const valueDifference = computed({
  get: () => store.userValueDifference,
  set: (value) => store.updateUserValueDifference(Number.parseInt(value, 10)),
});

function submit() {
  store.checkGuess(); // Using the Pinia store method
}
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2 pb-4">
    <div class="flex flex-col gap-3">
      <!-- Navigation bar -->
      <GameNavBar />

      <!-- Regular game toolbar with all stats -->
      <Toolbar />
      <HealthBar />
    </div>

    <div class="flex flex-col items-center gap-6" v-if="store.relativeColors?.color1">
      <!-- Game instructions -->
      <div class="text-center">
        <p>{{ $t('gameModes.relative.instructions') }}</p>
      </div>

      <!-- Two color boxes side by side -->
      <div class="flex w-full justify-center gap-8">
        <div
          class="size-32 rounded-lg border-2 border-white shadow-lg"
          :style="`background-color: hsl(${store.relativeColors.color1.h}, ${store.relativeColors.color1.s}%, ${store.relativeColors.color1.v}%)`"
        ></div>
        <div
          class="size-32 rounded-lg border-2 border-white shadow-lg"
          :style="`background-color: hsl(${store.relativeColors.color2.h}, ${store.relativeColors.color2.s}%, ${store.relativeColors.color2.v}%)`"
        ></div>
      </div>

      <!-- Value difference control -->
      <div class="w-full max-w-md">
        <label class="mb-2 block text-center font-bold">{{ $t('gameModes.relative.valueDifference') }}</label>
        <BaseSlider
          v-model="valueDifference"
          :min="1"
          :max="100"
          variant="default"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <BaseButton
      variant="primary"
      is3d
      fullWidth
      class="mt-6"
      @click="submit"
      :disabled="!store.relativeColors?.color1"
    >
      {{ $t('submit') }}
    </BaseButton>
  </div>
</template>
