<script setup>
import { ref } from 'vue'
import Toolbar from './components/Toolbar.vue'
import HealthBar from './components/HealthBar.vue'
import ColorBlock from './components/ColorBlock.vue'

import { useGlobalGameState } from './gameState'

const state = useGlobalGameState()
const randomColor = state.randomColor
const userColor = state.userColor

const userH = ref(userColor.value.h)
const userS = ref(userColor.value.s)
const userV = ref(userColor.value.v)

const submit = () => {
  state.updateUserColor(userH.value, userS.value, userV.value)
  state.checkGuess()
}
</script>

<template>
  <div class="w-full h-full py-2 px-2 flex flex-col justify-between">
    <div class="flex flex-col gap-2">
      <toolbar />
      <health-bar />
    </div>

    <div class="flex gap-2">
      <color-block :color="randomColor" />
      <color-block :color="userColor" />
    </div>


    <!-- Sliders and Confirm Button -->
    <div class="flex flex-col space-y-4">
      <!-- Hue Slider -->
      <div class="flex items-center">
        <span class="text-orange-300 mr-2">H:</span>
        <input type="range" min="0" max="360" v-model="userH" class="slider hue-slider">
        <span class="bg-gray-700 text-white px-4 py-2 rounded-lg ml-2">{{ userH }}</span>
      </div>
      <!-- Saturation Slider -->
      <div class="flex items-center">
        <span class="text-orange-300 mr-2">S:</span>
        <input type="range" min="0" max="100" v-model="userS" class="slider">
        <span class="bg-gray-700 text-white px-4 py-2 rounded-lg ml-2">{{ userS }}</span>
      </div>
      <!-- Value Slider -->
      <div class="flex items-center">
        <span class="text-orange-300 mr-2">V:</span>
        <input type="range" min="0" max="100" v-model="userV" class="slider">
        <span class="bg-gray-700 text-white px-4 py-2 rounded-lg ml-2">{{ userV }}</span>
      </div>

      <!-- Confirm Button -->
      <button class="bg-pink-600 px-4 py-2 rounded-lg text-white w-full button-3d" @click="submit">確定</button>
    </div>
  </div>
</template>

<style scoped>

</style>
