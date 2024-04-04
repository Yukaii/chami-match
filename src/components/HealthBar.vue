<template>
  <div class="flex space-x-2">
    <PhHeart
      v-for="life in lives"
      :key="life"
      :size="20"
      weight="fill"
      class="text-pink-600"
    />
  </div>
</template>

<script setup>
import { PhHeart } from '@phosphor-icons/vue'
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
const lives = state.lives
</script>
