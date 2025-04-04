<template>
  <div class="w-auto">
    <label v-if="label" :for="id" class="mb-2 block font-medium text-gray-900 dark:text-white">
      {{ label }}
    </label>
    <div class="relative group w-fit" :class="{ 'w-full': fullWidth }">
      <select
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        :class="selectClasses"
        @change="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <slot></slot>
      </select>
      <div 
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 transition-transform duration-200"
        :class="{
          'group-hover:-translate-y-0.5 group-focus-within:-translate-y-1 group-active:translate-y-0.5': is3d,
          'transform-none': !is3d
        }"
      >
        <svg class="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
    <p v-if="helper" class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ helper }}</p>
    <p v-if="error" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { cn } from "../../utils";

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object],
    default: "",
  },
  id: {
    type: String,
    default: () => `select-${Math.random().toString(36).substring(2, 9)}`,
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  variant: {
    type: String,
    default: "default",
    validator: (value) => ["default", "success", "error", "flat"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["xs", "sm", "md", "lg"].includes(value),
  },
  helper: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
  is3d: {
    type: Boolean,
    default: false,
  },
  fullWidth: {
    type: Boolean,
    default: true,
  },
  className: {
    type: String,
    default: "",
  },
  overrideStyles: {
    type: Boolean,
    default: false,
  },
});

const sizeClasses = computed(() => ({
  xs: "px-1.5 py-0.5 text-xs",
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-2",
  lg: "px-4 py-3 text-lg",
}));

const variantClasses = computed(() => ({
  default: "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:focus:border-pink-500 dark:focus:ring-pink-500",
  success: "border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-600 dark:focus:border-green-400 dark:focus:ring-green-400",
  error: "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-400 dark:focus:ring-red-400",
  flat: "bg-gray-200 border-transparent text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600",
}));

const selectClasses = computed(() => {
  // Base classes that are always applied
  const baseClasses = [
    "block appearance-none rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
    "pl-3 pr-10", // Adjust padding for the dropdown arrow
    sizeClasses.value[props.size],
    props.fullWidth ? "w-full" : "",
    props.disabled ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-700" : "",
    props.is3d 
      ? "shadow-[0_4px_0_rgba(0,0,0,0.1),0_5px_5px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_0_rgba(0,0,0,0.1),0_4px_4px_rgba(0,0,0,0.05)] focus:shadow-[0_1px_0_rgba(0,0,0,0.1),0_2px_2px_rgba(0,0,0,0.05)] hover:-translate-y-0.5 focus:-translate-y-1 active:translate-y-0.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:shadow-[0_4px_0_rgba(0,0,0,0.15),0_5px_5px_rgba(0,0,0,0.05)]"
      : "",
  ];

  // Get variant classes if not overridden
  const variant = props.overrideStyles
    ? ""
    : variantClasses.value[props.variant];

  return cn(...baseClasses, variant, props.className);
});

defineEmits(["update:modelValue", "blur", "focus"]);
</script>

<style scoped>
/* Custom styling for the select dropdown */
select {
  background-image: none; /* Remove default arrow */
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

select:focus {
  @apply outline-none ring-2 ring-offset-2;
}

/* For Firefox, which doesn't respect appearance:none for select elements */
@-moz-document url-prefix() {
  select {
    text-indent: 0.01px;
    text-overflow: '';
    padding-right: 2rem;
  }
}
</style>