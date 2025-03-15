<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useGameStore } from "../stores/game";
import GameNavBar from "./GameNavBar.vue";

const store = useGameStore();
// Use computed for proper reactivity with the store
const currentRound = computed(() => store.currentRound);

// Track selected color index
const selectedColorIndex = ref(-1);

// Create a reactive local surroundingColor object
const surroundingColor = reactive({
	h: 0,
	s: 0,
	v: 0,
});

// Add initialization logic when component mounts
onMounted(() => {
	if (store.gameType !== "contextual") {
		store.updateGameType("contextual");
		store.startOver(); // This will initialize the game mode and start a round
	}
	// If we're already in contextual mode but don't have options, just start a new round
	else if (!store.colorOptions || store.colorOptions.length === 0) {
		store.startNewRound();
	}
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

// Update surrounding color when random color changes with proper Pinia reactivity
watch(
	() => store.randomColor,
	(newColor) => {
		if (newColor) {
			const newSurroundingColor = generateSurroundingColor(newColor);
			surroundingColor.h = newSurroundingColor.h;
			surroundingColor.s = newSurroundingColor.s;
			surroundingColor.v = newSurroundingColor.v;
		}
	},
	{ immediate: true, deep: true },
);

// Use a watcher to detect new rounds and reset the selected color index
watch(
	[() => store.randomColor, currentRound],
	() => {
		// Reset selection when random color changes (new round starts)
		selectedColorIndex.value = -1;
	},
	{ deep: true },
);

function selectColor(color, index) {
	selectedColorIndex.value = index;
	store.updateUserColor(color.h, color.s, color.v);
	store.checkGuess();
}

function resetSelection() {
	selectedColorIndex.value = -1; // Reset selected index
}

// Define a layout for the grid - now just surrounding color with target in center
const gridStructure = [
	["bg", "bg", "bg"],
	["bg", "target", "bg"],
	["bg", "bg", "bg"],
];

// Debug computed property to check if colorOptions is available
const hasColorOptions = computed(() => {
	return Array.isArray(store.colorOptions) && store.colorOptions.length > 0;
});
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2 pb-4">
    <div class="flex flex-col gap-3">
      <!-- Navigation bar separate from game toolbar -->
      <GameNavBar @start-over="resetSelection" />

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
                :style="`background-color: hsl(${cell === 'target' ? (store.randomColor?.h || 0) : surroundingColor.h},
                  ${cell === 'target' ? (store.randomColor?.s || 0) : surroundingColor.s}%,
                  ${cell === 'target' ? (store.randomColor?.v || 0) : surroundingColor.v}%)`"
              ></div>
            </template>
          </template>
        </div>
      </div>

      <!-- Color selection options with debug info -->
      <div v-if="!hasColorOptions" class="text-sm text-red-500">
        No color options available. Please try starting a new game.
      </div>

      <!-- Color selection options -->
      <div class="relative mt-4 flex size-full flex-col">
        <h3 class="mb-2 text-center text-lg font-bold">
          {{ $t('gameModes.contextual.selectPrompt') }}
        </h3>
        <div class="grid min-h-20 flex-1 grid-cols-3 gap-3">
          <button
            v-for="(color, index) in store.colorOptions || []"
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
