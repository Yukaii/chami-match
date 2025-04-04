<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="mb-2 block font-medium text-gray-900 dark:text-white">
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="id"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxLength"
        :class="inputClasses"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
      />
      <div v-if="$slots.prefix" class="absolute inset-y-0 left-0 flex items-center pl-3">
        <slot name="prefix" />
      </div>
      <div v-if="$slots.suffix" class="absolute inset-y-0 right-0 flex items-center pr-3">
        <slot name="suffix" />
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
    type: [String, Number],
    default: "",
  },
  id: {
    type: String,
    default: () => `input-${Math.random().toString(36).substring(2, 9)}`,
  },
  label: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
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
    validator: (value) => ["default", "success", "error"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  maxLength: {
    type: [String, Number],
    default: undefined,
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
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-2",
  lg: "px-4 py-3 text-lg",
}));

const variantClasses = computed(() => ({
  default:
    "border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:focus:border-pink-500 dark:focus:ring-pink-500",
  success:
    "border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-600 dark:focus:border-green-400 dark:focus:ring-green-400",
  error:
    "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-400 dark:focus:ring-red-400",
}));

const inputClasses = computed(() => {
  // Base classes that are always applied
  const baseClasses = [
    "block rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2",
    sizeClasses.value[props.size],
    props.fullWidth ? "w-full" : "",
    props.$slots?.prefix ? "pl-10" : "",
    props.$slots?.suffix ? "pr-10" : "",
    props.disabled
      ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-700"
      : "",
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
/* Improve the focus ring visibility for both light and dark modes */
input:focus {
  @apply outline-none ring-2 ring-offset-2;
}
</style>