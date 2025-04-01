<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useGameStore } from "../stores/game";
import { useChallengeApi } from "../composables/useChallengeApi"; // Import the composable
import GameNavBar from "./GameNavBar.vue";
import BaseButton from "./base/BaseButton.vue";
import BaseSlider from "./base/BaseSlider.vue";

const store = useGameStore();
const { createChallenge, isLoading: isApiLoading, error: apiError } = useChallengeApi(); // Use the composable
const mode = computed(() => store.mode);
const colorSpace = computed(() => store.colorSpace);
const realtimePreview = computed(() => store.realtimePreview);

onMounted(() => {
	// start a new round if current round is zero
	if (store.currentRound === 0) {
		store.startNewRound();
	}
});

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

// Placeholder function for starting a challenge
const startChallenge = async () => {
  console.log("Challenge Friends button clicked!");

  // TODO: Add UI for setting challenge name and expiration
  const challengeName = `Challenge ${new Date().toLocaleTimeString()}`; // Temporary name
  const expiresIn = '1h'; // Temporary expiration

  // Prepare payload using current game settings and store data
  const payload = {
    name: challengeName,
    expiresIn: expiresIn,
    gameMode: store.mode, // Use current game mode from store
    settings: {
      precision: store.precision,
      maxLife: store.maxLife,
      gameType: store.gameType,
      // Add other relevant settings if needed by the server/client
    },
    deviceId: store.deviceId, // Get device ID from store
    displayName: 'Player', // TODO: Get actual display name (maybe from settings/profile?)
    // userId: store.userId, // Add if user authentication exists
  };

  try {
    console.log("Creating challenge with payload:", payload);
    const result = await createChallenge(payload);
    console.log("Challenge created:", result);
    // TODO: Show sharing modal with result.accessCode and result.id
    alert(`Challenge Created!\nAccess Code: ${result.accessCode}\nID: ${result.id}`);
  } catch (err) {
    console.error("Failed to create challenge:", apiError.value);
    // TODO: Show error message to user
    alert(`Error creating challenge: ${apiError.value}`);
  }
};
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2 pb-4 overflow-y-auto min-h-screen">
    <div class="flex flex-col gap-3">
      <!-- Navigation bar separate from game toolbar -->
      <GameNavBar />

      <!-- Regular game toolbar with all stats -->
      <Toolbar />
      <HealthBar />
    </div>

    <div class="flex gap-2 my-2">
      <ColorBlock :color="store.randomColor" />
      <ColorBlock :color="store.userColor" />
    </div>

    <!-- Challenge Button -->
    <div class="my-2 flex justify-center">
      <BaseButton variant="secondary" size="sm" is3d @click="startChallenge">
        {{ $t('challengeFriends') }} <!-- Assuming translation key exists -->
      </BaseButton>
    </div>

    <!-- Color Space Selector -->
    <div class="mb-2 mt-1">
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
    <div class="flex flex-col space-y-3 mt-auto">
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

      <!-- Submit Button - Ensure it's always visible -->
      <div class="sticky bottom-0 pt-2 pb-1 bg-opacity-90 z-10">
        <BaseButton
          variant="primary"
          is3d
          full-width
          @click="submit"
          class="py-2"
        >
          {{ $t('submit') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>
