<script setup>
import { onMounted, ref } from "vue";

const shouldError = ref(false);
const errorType = ref("render");

// This will cause an error during rendering if shouldError is true
const triggerRenderError = () => {
  shouldError.value = true;
  errorType.value = "render";
};

// This will cause an error in a method
const triggerMethodError = () => {
  errorType.value = "method";
  // Immediately throw an error
  throw new Error("Manual method error thrown for testing");
};

// This will cause an error in a computed property
const triggerComputedError = () => {
  errorType.value = "computed";
};

// This computed property will throw if errorType is 'computed'
const errorProneComputed = computed(() => {
  if (errorType.value === "computed") {
    throw new Error("Computed property error for testing");
  }
  return "No error in computed";
});

// This will cause an error in lifecycle hook
const triggerLifecycleError = () => {
  errorType.value = "lifecycle";
  // Force component re-render
  shouldError.value = false;
  nextTick(() => {
    shouldError.value = true;
  });
};

// Watch for errorType 'lifecycle' and throw in onMounted
onMounted(() => {
  if (errorType.value === "lifecycle") {
    throw new Error("Lifecycle hook error for testing");
  }
});
</script>

<template>
  <div class="rounded-sm border bg-gray-800 p-6">
    <h3 class="mb-4 text-xl">Error Testing Component</h3>

    <div class="space-y-4">
      <div class="space-x-2">
        <button class="rounded-sm bg-red-600 px-3 py-1 text-white" @click="triggerRenderError">
          Render Error
        </button>
        <button class="rounded-sm bg-orange-600 px-3 py-1 text-white" @click="triggerMethodError">
          Method Error
        </button>
        <button class="rounded-sm bg-yellow-600 px-3 py-1 text-white" @click="triggerComputedError">
          Computed Error
        </button>
        <button class="rounded-sm bg-green-600 px-3 py-1 text-white" @click="triggerLifecycleError">
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
