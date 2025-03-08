<script setup>
import { useRouter } from 'vue-router'
import { useGlobalGameState } from '../gameState'

const router = useRouter()
const state = useGlobalGameState()
const randomColor = state.randomColor
const userColor = state.userColor
const mode = state.mode

// Create a reactive local surroundingColor object instead of accessing state.surroundingColors[0]
const surroundingColor = reactive({
  h: 0,
  s: 0,
  v: 0
})

// Generate surrounding color with controlled contrast
function generateSurroundingColor(targetColor, contrastLevel = 30) {
  // Create a color that contrasts with the target by a specific amount
  const hVariation = Math.random() > 0.5 ? contrastLevel : -contrastLevel
  const sVariation = Math.random() * 20 - 10
  const vVariation = Math.random() * 20 - 10

  const h = Math.round((targetColor.h + hVariation + 360) % 360)
  const s = Math.round(Math.max(0, Math.min(100, targetColor.s + sVariation)))
  const v = Math.round(Math.max(0, Math.min(100, targetColor.v + vVariation)))

  return { h, s, v }
}

// Update surrounding color when random color changes
watch(
  randomColor,
  (newColor) => {
    const newSurroundingColor = generateSurroundingColor(newColor)
    surroundingColor.h = newSurroundingColor.h
    surroundingColor.s = newSurroundingColor.s
    surroundingColor.v = newSurroundingColor.v
  },
  { immediate: true, deep: true }
)

// Generate color options for selection
const colorOptions = computed(() => {
  const options = []

  // Add the target color
  options.push({...randomColor})

  // Generate similar but incorrect colors (6 options)
  for (let i = 0; i < 5; i++) {
    const hVariation = (Math.random() * 30 - 15) // -15 to +15 variation
    const sVariation = (Math.random() * 30 - 15) // -15 to +15 variation
    const vVariation = (Math.random() * 30 - 15) // -15 to +15 variation

    const h = Math.round((randomColor.h + hVariation + 360) % 360)
    const s = Math.round(Math.max(0, Math.min(100, randomColor.s + sVariation)))
    const v = Math.round(Math.max(0, Math.min(100, randomColor.v + vVariation)))

    options.push({ h, s, v })
  }

  // Shuffle the options
  return options.sort(() => Math.random() - 0.5)
})

function selectColor(color) {
  state.updateUserColor(color.h, color.s, color.v)
  state.checkGuess()
}

function goToHome() {
  router.push('/')
}

function startOver() {
  state.startOver() // Reset the game state
}

// Define a layout for the grid - now just surrounding color with target in center
const gridStructure = [
  ['bg', 'bg', 'bg'],
  ['bg', 'target', 'bg'],
  ['bg', 'bg', 'bg']
]
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

    <div class="flex flex-col items-center gap-6">
      <!-- Game instructions -->
      <div class="text-center text-white">
        <p>{{ $t('gameModes.contextual.instructions') }}</p>
      </div>

      <!-- Context Color Grid -->
      <div class="mx-auto grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
        <template v-for="(row, rowIndex) in gridStructure" :key="rowIndex">
          <template v-for="(cell, cellIndex) in row" :key="`${rowIndex}-${cellIndex}`">
            <div
              class="h-16 w-16"
              :class="{ 'border-2 border-white': cell === 'target' }"
              :style="`background-color: hsl(${cell === 'target' ? randomColor.h : surroundingColor.h},
                ${cell === 'target' ? randomColor.s : surroundingColor.s}%,
                ${cell === 'target' ? randomColor.v : surroundingColor.v}%)`"
            ></div>
          </template>
        </template>
      </div>

      <!-- Color selection options -->
      <div class="mt-4 w-full">
        <h3 class="mb-2 text-center text-lg font-bold text-white">
          {{ $t('gameModes.contextual.selectPrompt') }}
        </h3>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="(color, index) in colorOptions"
            :key="index"
            class="h-24 w-full rounded-lg hover:scale-105 transition-transform border-2 border-transparent hover:border-white"
            :style="`background-color: hsl(${color.h}, ${color.s}%, ${color.v}%)`"
            @click="selectColor(color)"
          />
        </div>
      </div>
    </div>

    <!-- Last Selected Color (if any) -->
    <div class="flex justify-center mt-4" v-if="userColor.h !== 0 || userColor.s !== 0 || userColor.v !== 0">
      <div class="text-center">
        <p class="text-sm text-white mb-1">{{ $t('gameModes.contextual.lastSelection') }}</p>
        <div
          class="mx-auto h-10 w-10 rounded-lg"
          :style="`background-color: hsl(${userColor.h}, ${userColor.s}%, ${userColor.v}%)`"
        ></div>
      </div>
    </div>
  </div>
</template>
