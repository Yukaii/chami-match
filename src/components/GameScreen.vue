<script setup>
import { useGlobalGameState } from "../gameState";
import BaseButton from "./base/BaseButton.vue";
import BaseSlider from "./base/BaseSlider.vue";
import GameNavBar from "./GameNavBar.vue";

const state = useGlobalGameState();
const mode = state.mode;
const realtimePreview = state.realtimePreview;

const userH = ref(state.userColor.h);
const userS = ref(state.userColor.s);
const userV = ref(state.userColor.v);

const hsv = computed(() => {
	const hsv = [
		Number.parseInt(userH.value, 10),
		Number.parseInt(userS.value, 10),
		Number.parseInt(userV.value, 10),
	];
	if (mode.value === "B/W") {
		hsv[0] = 0;
		hsv[1] = 0;
	}
	return hsv;
});

const submit = () => {
	state.updateUserColor(...hsv.value);
	state.checkGuess();
};

watch([hsv, realtimePreview], () => {
	if (realtimePreview.value) {
		state.updateUserColor(...hsv.value);
	}
});
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2 pb-4">
    <div class="flex flex-col gap-3">
      <!-- Navigation bar separate from game toolbar -->
      <GameNavBar />

      <!-- Regular game toolbar with all stats -->
      <Toolbar />
      <HealthBar />
    </div>

    <div class="flex gap-2">
      <ColorBlock :color="state.randomColor" />
      <ColorBlock :color="state.userColor" />
    </div>

    <!-- Sliders and Submit Button -->
    <div class="flex flex-col space-y-4">
      <!-- Hue Slider -->
      <BaseSlider
        v-model="userH"
        :min="0"
        :max="360"
        variant="hue"
        label="H"
      />

      <!-- Saturation Slider -->
      <BaseSlider
        v-model="userS"
        :min="0"
        :max="100"
        variant="saturation"
        label="S"
      />

      <!-- Value Slider -->
      <BaseSlider
        v-model="userV"
        :min="0"
        :max="100"
        variant="value"
        label="V"
      />

      <!-- Submit Button -->
      <BaseButton
        variant="primary"
        is3d
        full-width
        @click="submit"
      >
        {{ $t('submit') }}
      </BaseButton>
    </div>
  </div>
</template>
