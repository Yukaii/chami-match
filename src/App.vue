<script setup>
import Toolbar from './components/Toolbar.vue'
import HealthBar from './components/HealthBar.vue'
import ColorBlock from './components/ColorBlock.vue'
import { useGlobalGameState } from './gameState'

const state = useGlobalGameState()
const stateString = JSON.stringify(state, null, 2)
</script>

<template>
  <div class="w-full h-full py-2 px-2">
    <toolbar />
    <health-bar />

    <div class="flex gap-2">
      <color-block :color="state.randomColor.value" />
      <color-block :color="state.userColor.value" />
    </div>
  </div>
</template>

<style scoped>

</style>
