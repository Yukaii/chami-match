<script setup>
import { useRouter } from 'vue-router'
import { useGlobalGameState } from '../gameState'

const router = useRouter()
const state = useGlobalGameState()
const relativeColors = state.relativeColors
const mode = state.mode

// Create a computed property for the slider - modified to not use .value
const valueDifference = computed({
  get: () => state.userValueDifference,
  set: (value) => state.updateUserValueDifference(parseInt(value, 10))
})

function submit() {
  state.checkGuess() // Changed from checkRelativeGuess to use the unified API
}

function goToHome() {
  router.push('/')
}

function startOver() {
  state.startOver() // Reset the game state
}
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2 pb-4">
    <div class="flex flex-col gap-3">
      <!-- Navigation bar -->
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
        <p>{{ $t('gameModes.relative.instructions') }}</p>
      </div>

      <!-- Two color boxes side by side -->
      <div class="flex justify-center gap-8 w-full">
        <div
          class="h-32 w-32 rounded-lg border-2 border-white shadow-lg"
          :style="`background-color: hsl(${relativeColors.color1.h}, ${relativeColors.color1.s}%, ${relativeColors.color1.v}%)`"
        ></div>
        <div
          class="h-32 w-32 rounded-lg border-2 border-white shadow-lg"
          :style="`background-color: hsl(${relativeColors.color2.h}, ${relativeColors.color2.s}%, ${relativeColors.color2.v}%)`"
        ></div>
      </div>

      <!-- Value difference control -->
      <div class="w-full max-w-md">
        <label class="mb-2 block text-center font-bold text-white">{{ $t('gameModes.relative.valueDifference') }}</label>
        <div class="flex items-center">
          <input
            v-model="valueDifference"
            type="range"
            min="1"
            max="100"
            class="slider w-full"
          />
          <span class="ml-2 min-w-[65px] rounded-lg bg-gray-700 px-4 py-2 text-center text-white">{{ valueDifference }}</span>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <button class="button-3d w-full rounded-lg bg-pink-600 px-4 py-2 text-white mt-6" @click="submit">
      {{ $t('submit') }}
    </button>
  </div>
</template>
