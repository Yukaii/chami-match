<template>
  <div class="flex space-x-2">
    <ph-heart :size="20" weight="fill" class="text-pink-600" v-for="life in state.lives" />
  </div>
</template>

<script setup>
import { PhHeart } from "@phosphor-icons/vue"
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
</script>

