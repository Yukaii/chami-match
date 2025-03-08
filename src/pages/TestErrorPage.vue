<script setup>
import TestErrorComponent from '../components/TestErrorComponent.vue'
import { ref } from 'vue'

const showComponent = ref(true)
const resetComponent = () => {
  showComponent.value = false
  setTimeout(() => {
    showComponent.value = true
  }, 10)
}

// Function that throws error after async operation
const asyncOperation = async () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Async operation failed'))
    }, 500)
  })
}

// Function to trigger async error
const triggerAsyncError = async () => {
  try {
    await asyncOperation()
  } catch (error) {
    throw new Error('Caught and rethrown: ' + error.message)
  }
}
</script>

<template>
  <div class="container mx-auto p-6">
    <h1 class="text-2xl font-bold mb-6">Error Boundary Test Page</h1>

    <div class="mb-6 space-y-2">
      <p>This page allows you to test different error scenarios to see how the ErrorBoundary component handles them.</p>
      <p class="text-yellow-500">Remember to comment out or remove this page before production!</p>
    </div>

    <div class="mb-6 space-x-3">
      <button @click="resetComponent" class="px-4 py-2 bg-blue-600 text-white rounded">
        Reset Component
      </button>
      <button @click="triggerAsyncError" class="px-4 py-2 bg-purple-600 text-white rounded">
        Async Error
      </button>
      <button @click="() => { throw new Error('Direct Error') }" class="px-4 py-2 bg-red-600 text-white rounded">
        Direct Error
      </button>
    </div>

    <div v-if="showComponent" class="border p-4 rounded">
      <TestErrorComponent />
    </div>
  </div>
</template>
