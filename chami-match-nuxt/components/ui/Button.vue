<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  is3d: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  className: {
    type: String,
    default: ''
  },
  overrideStyles: {
    type: Boolean,
    default: false
  }
});
</script>

<template>
  <button 
    :class="[
      !overrideStyles ? variantClass : '',
      sizeClass,
      fullWidth ? 'w-full' : '',
      is3d && !overrideStyles ? '!border-b-4 !border-opacity-75' : '',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      'relative inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      className
    ]"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script>
export default {
  computed: {
    variantClass() {
      const variants = {
        primary: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-700',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 dark:border-gray-600',
        success: 'bg-green-500 hover:bg-green-600 text-white border-green-700',
        danger: 'bg-red-500 hover:bg-red-600 text-white border-red-700',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-700',
        info: 'bg-cyan-500 hover:bg-cyan-600 text-white border-cyan-700',
      };
      return variants[this.variant] || variants.primary;
    },
    sizeClass() {
      const sizes = {
        sm: 'text-sm px-2 py-1',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
      };
      return sizes[this.size] || sizes.md;
    }
  }
}
</script>