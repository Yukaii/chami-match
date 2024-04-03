<script setup>
import Toolbar from './components/Toolbar.vue'
import HealthBar from './components/HealthBar.vue'
import { useGlobalGameState } from './gameState'

const state = useGlobalGameState()
const stateString = JSON.stringify(state, null, 2)
</script>

<template>
  <div class="w-full h-full py-2 px-2">
    <toolbar />
    <health-bar />
  </div>
</template>

<style scoped>

</style>
