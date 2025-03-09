<script setup>
import { computed, onMounted } from "vue";
import { useGlobalGameState } from "../gameState";
import GameNavBar from "./GameNavBar.vue";
import BaseButton from "./base/BaseButton.vue";
import BaseSlider from "./base/BaseSlider.vue";

const state = useGlobalGameState();

// Ensure the relative mode is initialized when component loads
onMounted(() => {
	if (state.gameType !== "relative") {
		state.updateGameType("relative");
		state.startOver(); // This will initialize the game mode and start a round
	}
	// If we're already in relative mode but don't have colors, just start a new round
	else if (!state.relativeColors || !state.relativeColors.color1) {
		state.startNewRound();
	}
});

// Create a computed property for the slider - modified to not use .value
const valueDifference = computed({
	get: () => state.userValueDifference,
	set: (value) => state.updateUserValueDifference(Number.parseInt(value, 10)),
});

function submit() {
	state.checkGuess(); // Changed from checkRelativeGuess to use the unified API
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

    <div class="flex flex-col items-center gap-6" v-if="state.relativeColors?.color1">
      <!-- Game instructions -->
      <div class="text-center">
        <p>{{ $t('gameModes.relative.instructions') }}</p>
      </div>

      <!-- Two color boxes side by side -->
      <div class="flex w-full justify-center gap-8">
        <div
          class="size-32 rounded-lg border-2 border-white shadow-lg"
          :style="`background-color: hsl(${state.relativeColors.color1.h}, ${state.relativeColors.color1.s}%, ${state.relativeColors.color1.v}%)`"
        ></div>
        <div
          class="size-32 rounded-lg border-2 border-white shadow-lg"
          :style="`background-color: hsl(${state.relativeColors.color2.h}, ${state.relativeColors.color2.s}%, ${state.relativeColors.color2.v}%)`"
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
      :disabled="!state.relativeColors?.color1"
    >
      {{ $t('submit') }}
    </BaseButton>
  </div>
</template>
