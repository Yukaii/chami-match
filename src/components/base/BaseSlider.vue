<template>
  <div class="flex w-full items-center">
    <label v-if="label" class="mr-2 font-medium text-pink-500 dark:text-orange-300">{{ label }}:</label>
    <div class="relative flex h-8 flex-1 items-center">
      <!-- Actual input slider that's invisible but handles interaction -->
      <input
        :value="modelValue"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :class="[
          'toy-slider absolute z-10 size-full cursor-pointer opacity-0',
          className
        ]"
        @input="handleInput"
        @mousedown="isActive = true"
        @mouseup="isActive = false"
        @mouseleave="isActive = false"
      />

      <!-- Visible slider track with gradient background that's always fully visible -->
      <div
        class="h-4 w-full overflow-hidden rounded-full border border-gray-300 shadow-inner dark:border-gray-600"
        :class="[variantBackgroundClass]"
      >
        <!-- No progress bar filling - the background gradient is always visible -->
      </div>

      <!-- Slider thumb/handle -->
      <div
        class="absolute top-1/2 size-6 origin-center -translate-y-1/2 cursor-grab rounded-full border-2 border-gray-200 bg-white shadow-md transition-transform duration-75 ease-out hover:scale-110 active:cursor-grabbing dark:border-gray-500 dark:bg-gray-200"
        :class="[isActive ? 'scale-110 ring-2 ring-pink-400' : '']"
        :style="{
          left: `calc(${percentage}% - ${percentage === 0 ? '0px' : percentage === 100 ? '24px' : '12px'})`,
        }"
      >
        <div class="absolute inset-0 rounded-full bg-linear-to-b from-white to-gray-100 opacity-80 dark:from-gray-100 dark:to-gray-300"></div>
      </div>
    </div>

    <!-- Value display -->
    <div v-if="showValue" class="ml-3 min-w-[65px] rounded-lg border border-gray-300 bg-linear-to-b from-gray-100 to-gray-200 px-4 py-2 text-center text-gray-800 shadow-md dark:border-gray-600 dark:from-gray-700 dark:to-gray-800 dark:text-white">
      {{ modelValue }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: [Number, String],
    required: true,
  },
  min: {
    type: [Number, String],
    default: 0,
  },
  max: {
    type: [Number, String],
    default: 100,
  },
  step: {
    type: [Number, String],
    default: 1,
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'hue', 'saturation', 'value'].includes(value),
  },
  label: {
    type: String,
    default: '',
  },
  showValue: {
    type: Boolean,
    default: true,
  },
  className: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const isActive = ref(false);

const percentage = computed(() => {
  const numerator = Number(props.modelValue) - Number(props.min);
  const denominator = Number(props.max) - Number(props.min);
  return (numerator / denominator) * 100;
});

const variantBackgroundClass = computed(() => {
  switch (props.variant) {
    case 'hue':
      return 'hue-slider';
    case 'saturation':
      return 'saturation-slider';
    case 'value':
      return 'value-slider';
    default:
      return 'bg-linear-to-r from-pink-400 to-pink-600';
  }
});

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};
</script>

<style scoped>
.toy-slider {
  -webkit-appearance: none;
  appearance: none;
}

.toy-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  cursor: pointer;
}

.toy-slider:focus {
  outline: none;
}

.hue-slider {
  background: linear-gradient(
    to right,
    #ff0000 0%,
    #ffff00 17%,
    #00ff00 33%,
    #00ffff 50%,
    #0000ff 67%,
    #ff00ff 83%,
    #ff0000 100%
  );
}

.saturation-slider {
  background: linear-gradient(to right, #808080, #0000ff);
}

.value-slider {
  background: linear-gradient(to right, #000000, #ffffff);
}
</style>
