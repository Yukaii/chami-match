<script setup>
import { useGlobalGameState } from './gameState'

const state = useGlobalGameState()
const randomColor = state.randomColor
const userColor = state.userColor

const userH = ref(userColor.h)
const userS = ref(userColor.s)
const userV = ref(userColor.v)

const submit = () => {
  state.updateUserColor(parseInt(userH.value, 10), parseInt(userS.value, 10), parseInt(userV.value, 10))
  state.checkGuess()
}
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2">
    <div class="flex flex-col gap-2">
      <Toolbar />
      <HealthBar />
    </div>

    <div class="flex gap-2">
      <ColorBlock :color="randomColor" />
      <ColorBlock :color="userColor" />
    </div>

    <!-- Sliders and Confirm Button -->
    <div class="flex flex-col space-y-4">
      <!-- Hue Slider -->
      <div class="flex items-center">
        <span class="mr-2 text-orange-300">H:</span>
        <input v-model="userH" type="range" min="0" max="360" class="slider hue-slider" />
        <span class="ml-2 rounded-lg bg-gray-700 px-4 py-2 text-white min-w-[65px] text-center">{{ userH }}</span>
      </div>
      <!-- Saturation Slider -->
      <div class="flex items-center">
        <span class="mr-2 text-orange-300">S:</span>
        <input v-model="userS" type="range" min="0" max="100" class="slider" />
        <span class="ml-2 rounded-lg bg-gray-700 px-4 py-2 text-white min-w-[65px] text-center">{{ userS }}</span>
      </div>
      <!-- Value Slider -->
      <div class="flex items-center">
        <span class="mr-2 text-orange-300">V:</span>
        <input v-model="userV" type="range" min="0" max="100" class="slider" />
        <span class="ml-2 rounded-lg bg-gray-700 px-4 py-2 text-white min-w-[65px] text-center">{{ userV }}</span>
      </div>

      <!-- Confirm Button -->
      <button class="button-3d w-full rounded-lg bg-pink-600 px-4 py-2 text-white" @click="submit">確定</button>
    </div>

    <RecordPopup />
  </div>
</template>
