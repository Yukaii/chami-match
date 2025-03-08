<template>
  <button
    :type="type"
    :class="[
      'rounded-lg font-medium transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-offset-2',
      'hover:-translate-y-1 hover:scale-[1.02] active:translate-y-1',
      sizeClasses[size],
      variantClasses[variant],
      fullWidth ? 'w-full' : '',
      is3d ? '3d-button' : '',
      disabled ? 'cursor-not-allowed opacity-50' : '',
      className
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <div class="relative flex items-center justify-center">
      <slot />
    </div>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'outline', 'ghost'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  type: {
    type: String,
    default: 'button',
  },
  fullWidth: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  is3d: {
    type: Boolean,
    default: false,
  },
  className: {
    type: String,
    default: '',
  },
});

const variantClasses = computed(() => ({
  primary: 'bg-linear-to-b from-pink-500 to-pink-600 dark:from-pink-500 dark:to-pink-700 text-white hover:from-pink-400 hover:to-pink-500 dark:hover:from-pink-400 dark:hover:to-pink-600 focus:ring-pink-400 dark:focus:ring-pink-500 border-b-4 border-pink-700 dark:border-pink-800',
  secondary: 'bg-linear-to-b from-slate-400 to-slate-500 dark:from-gray-600 dark:to-gray-800 text-white hover:from-slate-300 hover:to-slate-400 dark:hover:from-gray-500 dark:hover:to-gray-700 focus:ring-slate-400 dark:focus:ring-gray-600 border-b-4 border-slate-600 dark:border-gray-900',
  danger: 'bg-linear-to-b from-red-400 to-red-500 dark:from-red-600 dark:to-red-800 text-white hover:from-red-300 hover:to-red-400 dark:hover:from-red-500 dark:hover:to-red-700 focus:ring-red-400 dark:focus:ring-red-500 border-b-4 border-red-600 dark:border-red-800',
  outline: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-400 dark:focus:ring-gray-500',
  ghost: 'bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-300 dark:focus:ring-gray-600',
}));

const sizeClasses = computed(() => ({
  sm: 'px-2 py-1 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg',
}));

defineEmits(['click']);
</script>

<style scoped>
.3d-button {
  box-shadow: 0px 6px 0px rgba(0, 0, 0, 0.2), 0px 8px 10px rgba(0, 0, 0, 0.15);
  transform-style: preserve-3d;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-width 0.15s ease;
}

.3d-button:hover {
  box-shadow: 0px 4px 0px rgba(0, 0, 0, 0.2), 0px 5px 8px rgba(0, 0, 0, 0.15);
}

.3d-button:active {
  box-shadow: 0px 2px 0px rgba(0, 0, 0, 0.2), 0px 3px 5px rgba(0, 0, 0, 0.15);
  border-bottom-width: 2px;
}

/* Improve the focus ring visibility for both light and dark modes */
button:focus {
  @apply outline-none ring-2 ring-offset-2;
}

/* Light mode adjustments */
.light button.3d-button {
  box-shadow: 0px 6px 0px rgba(0, 0, 0, 0.15), 0px 8px 10px rgba(0, 0, 0, 0.1);
}
</style>
