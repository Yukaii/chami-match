<script setup>
import { computed, ref, watch } from "vue";
import { useGameStore } from "../stores/game";
import GameNavBar from "./GameNavBar.vue";
import BaseButton from "./base/BaseButton.vue";
import BaseSlider from "./base/BaseSlider.vue";

const store = useGameStore();
const mode = computed(() => store.mode);
const realtimePreview = computed(() => store.realtimePreview);

const userH = ref(store.userColor?.h || 0);
const userS = ref(store.userColor?.s || 0);
const userV = ref(store.userColor?.v || 0);

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
	store.updateUserColor(...hsv.value);
	store.checkGuess();
};

watch([hsv, realtimePreview], () => {
	if (realtimePreview.value) {
		store.updateUserColor(...hsv.value);
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
      <ColorBlock :color="store.randomColor" />
      <ColorBlock :color="store.userColor" />
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
