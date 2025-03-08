<script setup>
import { ref } from "vue";
import TestErrorComponent from "../components/TestErrorComponent.vue";

const showComponent = ref(true);
const resetComponent = () => {
	showComponent.value = false;
	setTimeout(() => {
		showComponent.value = true;
	}, 10);
};

// Function that throws error after async operation
const asyncOperation = async () => {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			reject(new Error("Async operation failed"));
		}, 500);
	});
};

// Function to trigger async error
const triggerAsyncError = async () => {
	try {
		await asyncOperation();
	} catch (error) {
		throw new Error("Caught and rethrown: " + error.message);
	}
};
</script>

<template>
  <div class="container mx-auto p-6">
    <h1 class="mb-6 text-2xl font-bold">Error Boundary Test Page</h1>

    <div class="mb-6 space-y-2">
      <p>This page allows you to test different error scenarios to see how the ErrorBoundary component handles them.</p>
      <p class="text-yellow-500">Remember to comment out or remove this page before production!</p>
    </div>

    <div class="mb-6 space-x-3">
      <button class="rounded-sm bg-blue-600 px-4 py-2 text-white" @click="resetComponent">
        Reset Component
      </button>
      <button class="rounded-sm bg-purple-600 px-4 py-2 text-white" @click="triggerAsyncError">
        Async Error
      </button>
      <button class="rounded-sm bg-red-600 px-4 py-2 text-white" @click="() => { throw new Error('Direct Error') }">
        Direct Error
      </button>
    </div>

    <div v-if="showComponent" class="rounded-sm border p-4">
      <TestErrorComponent />
    </div>
  </div>
</template>
