<script setup>
import { useRouter } from 'vue-router'
import { useGlobalGameState } from '../gameState'
import BaseButton from './base/BaseButton.vue'
import BaseSlider from './base/BaseSlider.vue'

const router = useRouter()
const state = useGlobalGameState()
const randomColor = state.randomColor
const userColor = state.userColor
const mode = state.mode
const realtimePreview = state.realtimePreview

const userH = ref(userColor.h)
const userS = ref(userColor.s)
const userV = ref(userColor.v)

const hsv = computed(() => {
  const hsv = [parseInt(userH.value, 10), parseInt(userS.value, 10), parseInt(userV.value, 10)]
  if (mode.value === 'B/W') {
    hsv[0] = 0
    hsv[1] = 0
  }
  return hsv
})

const submit = () => {
  state.updateUserColor(...hsv.value)
  state.checkGuess()
}

watch([hsv, realtimePreview], () => {
  if (realtimePreview.value) {
    state.updateUserColor(...hsv.value)
  }
})

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
      <!-- Navigation bar separate from game toolbar -->
      <div class="flex w-full justify-between">
        <BaseButton variant="secondary" size="sm" @click="goToHome">
          <span class="mr-1 text-lg">←</span> {{ $t('home') }}
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="startOver">
          {{ $t('startOver') }}
        </BaseButton>
      </div>

      <!-- Regular game toolbar with all stats -->
      <Toolbar />
      <HealthBar />
    </div>

    <div class="flex gap-2">
      <ColorBlock :color="randomColor" />
      <ColorBlock :color="userColor" />
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
