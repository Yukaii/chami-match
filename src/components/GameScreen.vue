<script setup>
import { computed, ref, watch } from "vue";
import { useGameStore } from "../stores/game";
import GameNavBar from "./GameNavBar.vue";
import BaseButton from "./base/BaseButton.vue";
import BaseSlider from "./base/BaseSlider.vue";

const store = useGameStore();
const mode = computed(() => store.mode);
const colorSpace = computed(() => store.colorSpace);
const realtimePreview = computed(() => store.realtimePreview);

// HSV values
const userH = ref(store.userColor?.h || 0);
const userS = ref(store.userColor?.s || 0);
const userV = ref(store.userColor?.v || 0);

// RGB values
const userR = ref(store.userColor?.r || 0);
const userG = ref(store.userColor?.g || 0);
const userB = ref(store.userColor?.b || 0);

// OKLAB values
const userL = ref(store.userColor?.L || 0);
const userA = ref(store.userColor?.a || 0);
const userB_lab = ref(store.userColor?.b || 0);

// Computed values for the current color space
const colorValues = computed(() => {
	if (colorSpace.value === "rgb") {
		return [
			Number.parseInt(userR.value, 10),
			Number.parseInt(userG.value, 10),
			Number.parseInt(userB.value, 10),
		];
	}

	if (colorSpace.value === "oklab") {
		return [
			Number.parseInt(userL.value, 10),
			Number.parseInt(userA.value, 10),
			Number.parseInt(userB_lab.value, 10),
		];
	}

	// Default: HSV
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

// Change the color space
const changeColorSpace = (space) => {
	store.updateColorSpace(space);
};

const submit = () => {
	store.updateUserColor(...colorValues.value);
	store.checkGuess();
};

watch([colorValues, realtimePreview], () => {
	if (realtimePreview.value) {
		store.updateUserColor(...colorValues.value);
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

    <!-- Color Space Selector -->
    <div class="mb-2 mt-2">
      <div class="flex justify-center space-x-2">
        <BaseButton
          v-for="space in ['hsv', 'rgb', 'oklab']"
          :key="space"
          :variant="colorSpace === space ? 'primary' : 'secondary'"
          size="sm"
          is3d
          @click="changeColorSpace(space)"
        >
          {{ space.toUpperCase() }}
        </BaseButton>
      </div>
    </div>

    <!-- Sliders and Submit Button -->
    <div class="flex flex-col space-y-4">
      <!-- HSV Sliders -->
      <template v-if="colorSpace === 'hsv'">
        <BaseSlider
          v-model="userH"
          :min="0"
          :max="360"
          variant="hue"
          label="H"
        />
        <BaseSlider
          v-model="userS"
          :min="0"
          :max="100"
          variant="saturation"
          label="S"
        />
        <BaseSlider
          v-model="userV"
          :min="0"
          :max="100"
          variant="value"
          label="V"
        />
      </template>

      <!-- RGB Sliders -->
      <template v-else-if="colorSpace === 'rgb'">
        <BaseSlider
          v-model="userR"
          :min="0"
          :max="255"
          variant="red"
          label="R"
        />
        <BaseSlider
          v-model="userG"
          :min="0"
          :max="255"
          variant="green"
          label="G"
        />
        <BaseSlider
          v-model="userB"
          :min="0"
          :max="255"
          variant="blue"
          label="B"
        />
      </template>

      <!-- OKLAB Sliders -->
      <template v-else>
        <BaseSlider
          v-model="userL"
          :min="0"
          :max="100"
          variant="lightness"
          label="L"
        />
        <BaseSlider
          v-model="userA"
          :min="-100"
          :max="100"
          variant="a-axis"
          label="a"
        />
        <BaseSlider
          v-model="userB_lab"
          :min="-100"
          :max="100"
          variant="b-axis"
          label="b"
        />
      </template>

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
