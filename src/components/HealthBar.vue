<template>
  <div class="flex space-x-2">
    <div
      v-for="life in store.maxLife"
      :key="life"
      class="heart-container transition-all duration-300"
      :class="{
        'animate-bounce-subtle': life <= store.lives,
        'opacity-40': life > store.lives,
        'delay-100': life === 2,
        'delay-200': life === 3,
        'delay-300': life === 4,
        'delay-400': life === 5
      }"
    >
      <PhosphorIconHeart
        :size="24"
        weight="fill"
        class="drop-shadow-md transition-colors duration-300"
        :class="{
          'text-pink-600 drop-shadow-[0_0_3px_rgba(219,39,119,0.5)]': life <= store.lives,
          'text-gray-400 dark:text-gray-600': life > store.lives
        }"
      />
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from "../stores/game";

const store = useGameStore();
</script>

<style scoped>
.heart-container {
  transform-origin: center bottom;
}
</style>
