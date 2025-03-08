<script setup>
import { ref, onMounted } from 'vue'

const shouldError = ref(false)
const errorType = ref('render')

// This will cause an error during rendering if shouldError is true
const triggerRenderError = () => {
  shouldError.value = true
  errorType.value = 'render'
}

// This will cause an error in a method
const triggerMethodError = () => {
  errorType.value = 'method'
  // Immediately throw an error
  throw new Error('Manual method error thrown for testing')
}

// This will cause an error in a computed property
const triggerComputedError = () => {
  errorType.value = 'computed'
}

// This computed property will throw if errorType is 'computed'
const errorProneComputed = computed(() => {
  if (errorType.value === 'computed') {
    throw new Error('Computed property error for testing')
  }
  return 'No error in computed'
})

// This will cause an error in lifecycle hook
const triggerLifecycleError = () => {
  errorType.value = 'lifecycle'
  // Force component re-render
  shouldError.value = false
  nextTick(() => {
    shouldError.value = true
  })
}

// Watch for errorType 'lifecycle' and throw in onMounted
onMounted(() => {
  if (errorType.value === 'lifecycle') {
    throw new Error('Lifecycle hook error for testing')
  }
})
</script>

<template>
  <div class="p-6 border rounded bg-gray-800">
    <h3 class="text-xl mb-4">Error Testing Component</h3>

    <div class="space-y-4">
      <div class="space-x-2">
        <button @click="triggerRenderError" class="px-3 py-1 bg-red-600 text-white rounded">
          Render Error
        </button>
        <button @click="triggerMethodError" class="px-3 py-1 bg-orange-600 text-white rounded">
          Method Error
        </button>
        <button @click="triggerComputedError" class="px-3 py-1 bg-yellow-600 text-white rounded">
          Computed Error
        </button>
        <button @click="triggerLifecycleError" class="px-3 py-1 bg-green-600 text-white rounded">
          Lifecycle Error
        </button>
      </div>

      <div>
        Current error type: {{ errorType }}
      </div>

      <!-- This will cause a render error if shouldError is true -->
      <div v-if="shouldError">
        {{ nonExistentVariable.property }}
      </div>

      <!-- This will show computed error -->
      <div>
        Computed value: {{ errorProneComputed }}
      </div>
    </div>
  </div>
</template>
