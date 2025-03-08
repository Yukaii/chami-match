<script setup>
import { onErrorCaptured, ref, useSlots } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const error = ref(null);
const slots = useSlots();

onErrorCaptured((err) => {
	error.value = err;
	console.error("ErrorBoundary caught an error:", err);
	return false; // prevent error from propagating further
});

const resetError = () => {
	error.value = null;
};

const refreshPage = () => {
	window.location.reload();
};

const copyErrorStack = () => {
	if (error.value?.stack) {
		navigator.clipboard
			.writeText(error.value.stack)
			.then(() => {
				// Optional: show a brief notification that the copy was successful
				// This could be implemented with a toast notification component if available
				console.log("Error stack copied to clipboard");
			})
			.catch((err) => {
				console.error("Failed to copy error stack:", err);
			});
	}
};
</script>

<template>
  <div class="h-full">
    <template v-if="error">
      <div class="error-boundary flex flex-col items-center justify-center p-5">
        <h2 class="mb-3 text-xl font-bold text-red-500">{{ t('errorBoundary.title') || 'Oops, something went wrong!' }}</h2>
        <p class="mb-5 text-center">{{ t('errorBoundary.message') || 'The application encountered an unexpected error.' }}</p>

        <div class="mb-5 flex space-x-3">
          <button
            class="rounded-sm bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
            @click="resetError"
          >
            {{ t('errorBoundary.retry') || 'Retry' }}
          </button>

          <button
            class="rounded-sm bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
            @click="refreshPage"
          >
            {{ t('errorBoundary.refresh') || 'Refresh Page' }}
          </button>

          <button
            class="rounded-sm bg-gray-600 px-4 py-2 text-white transition hover:bg-gray-700"
            @click="copyErrorStack"
          >
            {{ t('errorBoundary.copyError') || 'Copy Error' }}
          </button>
        </div>

        <pre class="mt-5 max-w-full overflow-auto rounded-sm bg-gray-800 p-3 text-sm text-red-300">{{ error.stack }}</pre>
      </div>
    </template>
    <template v-else>
      <slot />
    </template>
  </div>
</template>
