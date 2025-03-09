<script setup>
import { useRouter } from "vue-router";
import { useGlobalGameState } from "../gameState";

const router = useRouter();
const state = useGlobalGameState();
const randomColor = state.randomColor;
const userColor = state.userColor;
const mode = state.mode;
const currentRound = state.currentRound; // Add this to watch for round changes

// Track selected color index
const selectedColorIndex = ref(-1);

// Create a reactive local surroundingColor object instead of accessing state.surroundingColors[0]
const surroundingColor = reactive({
	h: 0,
	s: 0,
	v: 0,
});

// Generate surrounding color with controlled contrast
function generateSurroundingColor(targetColor, contrastLevel = 30) {
	// Create a color that contrasts with the target by a specific amount
	const hVariation = Math.random() > 0.5 ? contrastLevel : -contrastLevel;
	const sVariation = Math.random() * 20 - 10;
	const vVariation = Math.random() * 20 - 10;

	const h = Math.round((targetColor.h + hVariation + 360) % 360);
	const s = Math.round(Math.max(0, Math.min(100, targetColor.s + sVariation)));
	const v = Math.round(Math.max(0, Math.min(100, targetColor.v + vVariation)));

	return { h, s, v };
}

// Update surrounding color when random color changes
watch(
	randomColor,
	(newColor) => {
		const newSurroundingColor = generateSurroundingColor(newColor);
		surroundingColor.h = newSurroundingColor.h;
		surroundingColor.s = newSurroundingColor.s;
		surroundingColor.v = newSurroundingColor.v;
	},
	{ immediate: true, deep: true },
);

// Remove the local computed colorOptions property since we'll use state.colorOptions

// Use a watcher to detect new rounds and reset the selected color index
watch(
	[randomColor, () => currentRound.value],
	() => {
		// Reset selection when random color changes (new round starts)
		selectedColorIndex.value = -1;
	},
	{ deep: true },
);

function selectColor(color, index) {
	selectedColorIndex.value = index;
	state.updateUserColor(color.h, color.s, color.v);
	state.checkGuess();
}

function goToHome() {
	router.push("/");
}

function startOver() {
	state.startOver(); // Reset the game state
	selectedColorIndex.value = -1; // Reset selected index when starting over
}

// Define a layout for the grid - now just surrounding color with target in center
const gridStructure = [
	["bg", "bg", "bg"],
	["bg", "target", "bg"],
	["bg", "bg", "bg"],
];
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2 pb-4">
    <div class="flex flex-col gap-3">
      <!-- Navigation bar separate from game toolbar -->
      <div class="flex w-full justify-between">
        <button
          class="flex items-center gap-1 rounded-lg bg-gray-700 px-3 py-1 text-white"
          @click="goToHome"
        >
          <span class="text-lg">←</span> {{ $t('home') }}
        </button>
        <button
          class="rounded-lg bg-gray-700 px-3 py-1 text-white"
          @click="startOver"
        >
          {{ $t('startOver') }}
        </button>
      </div>

      <!-- Regular game toolbar with all stats -->
      <Toolbar />
      <HealthBar />
    </div>

    <div class="flex h-full flex-col items-center gap-6">
      <!-- Game instructions -->
      <div class="text-center">
        <p>{{ $t('gameModes.contextual.instructions') }}</p>
      </div>

      <div class="flex-1">
        <!-- Context Color Grid -->
        <div class="mx-auto grid grid-cols-3 gap-1 overflow-hidden rounded-lg">
          <template v-for="(row, rowIndex) in gridStructure" :key="rowIndex">
            <template v-for="(cell, cellIndex) in row" :key="`${rowIndex}-${cellIndex}`">
              <div
                class="size-16"
                :class="{ 'border-2 border-white': cell === 'target' }"
                :style="`background-color: hsl(${cell === 'target' ? randomColor.h : surroundingColor.h},
                  ${cell === 'target' ? randomColor.s : surroundingColor.s}%,
                  ${cell === 'target' ? randomColor.v : surroundingColor.v}%)`"
              ></div>
            </template>
          </template>
        </div>

      </div>

      <!-- Color selection options -->
      <div class="relative mt-4 flex size-full flex-col">
        <h3 class="mb-2 text-center text-lg font-bold">
          {{ $t('gameModes.contextual.selectPrompt') }}
        </h3>
        <div class="grid min-h-20 flex-1 grid-cols-3 gap-3">
          <button
            v-for="(color, index) in state.colorOptions || []"
            :key="index"
            class="size-full rounded-lg transition-transform hover:scale-105"
            :class="{
              'border-2 border-transparent hover:border-white': selectedColorIndex !== index,
              'border-4 border-white ring-2 ring-offset-2': selectedColorIndex === index
            }"
            :style="`background-color: hsl(${color?.h || 0}, ${color?.s || 0}%, ${color?.v || 0}%)`"
            @click="color && selectColor(color, index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
