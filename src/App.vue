<script setup>
import HelloWorld from './components/HelloWorld.vue'
import { useGlobalGameState } from './gameState'

const state = useGlobalGameState()
const stateString = JSON.stringify(state, null, 2)
</script>

<template>
  <div>
    <pre class="max-w-full">
      <code class="whitespace-pre-wrap">
        {{ stateString }}
      </code>
    </pre>
  </div>
</template>

<style scoped>

</style>
