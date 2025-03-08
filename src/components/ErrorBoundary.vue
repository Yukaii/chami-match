<script setup>
import { ref, onErrorCaptured, useSlots } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const error = ref(null)
const slots = useSlots()

onErrorCaptured((err) => {
  error.value = err
  console.error('ErrorBoundary caught an error:', err)
  return false // prevent error from propagating further
})

const resetError = () => {
  error.value = null
}

const refreshPage = () => {
  window.location.reload()
}

const copyErrorStack = () => {
  if (error.value && error.value.stack) {
    navigator.clipboard.writeText(error.value.stack)
      .then(() => {
        // Optional: show a brief notification that the copy was successful
        // This could be implemented with a toast notification component if available
        console.log('Error stack copied to clipboard')
      })
      .catch(err => {
        console.error('Failed to copy error stack:', err)
      })
  }
}
</script>

<template>
  <div class="h-full">
    <template v-if="error">
      <div class="error-boundary p-5 flex flex-col items-center justify-center">
        <h2 class="text-xl font-bold text-red-500 mb-3">{{ t('errorBoundary.title') || 'Oops, something went wrong!' }}</h2>
        <p class="mb-5 text-center">{{ t('errorBoundary.message') || 'The application encountered an unexpected error.' }}</p>

        <div class="flex space-x-3 mb-5">
          <button
            @click="resetError"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            {{ t('errorBoundary.retry') || 'Retry' }}
          </button>

          <button
            @click="refreshPage"
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            {{ t('errorBoundary.refresh') || 'Refresh Page' }}
          </button>

          <button
            @click="copyErrorStack"
            class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            {{ t('errorBoundary.copyError') || 'Copy Error' }}
          </button>
        </div>

        <pre class="mt-5 p-3 bg-gray-800 text-red-300 rounded text-sm overflow-auto max-w-full">{{ error.stack }}</pre>
      </div>
    </template>
    <template v-else>
      <slot />
    </template>
  </div>
</template>
