<script setup>
import { useRouter } from 'vue-router'
import { useGlobalGameState } from '../gameState'
import BaseButton from './base/BaseButton.vue'
import BaseSlider from './base/BaseSlider.vue'

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
        <BaseButton variant="secondary" size="sm" @click="goToHome">
          <span class="text-lg mr-1">←</span> {{ $t('home') }}
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="startOver">
          {{ $t('startOver') }}
        </BaseButton>
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
      <div class="flex w-full justify-center gap-8">
        <div
          class="size-32 rounded-lg border-2 border-white shadow-lg"
          :style="`background-color: hsl(${relativeColors.color1.h}, ${relativeColors.color1.s}%, ${relativeColors.color1.v}%)`"
        ></div>
        <div
          class="size-32 rounded-lg border-2 border-white shadow-lg"
          :style="`background-color: hsl(${relativeColors.color2.h}, ${relativeColors.color2.s}%, ${relativeColors.color2.v}%)`"
        ></div>
      </div>

      <!-- Value difference control -->
      <div class="w-full max-w-md">
        <label class="mb-2 block text-center font-bold text-white">{{ $t('gameModes.relative.valueDifference') }}</label>
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
    >
      {{ $t('submit') }}
    </BaseButton>
  </div>
</template>
