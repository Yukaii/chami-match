<template>
  <button
    :type="type"
    :class="buttonClasses"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <div class="relative flex items-center justify-center">
      <slot />
    </div>
  </button>
</template>

<script setup>
import { computed } from "vue";
import { cn } from "../../utils";

const props = defineProps({
  variant: {
    type: String,
    default: "primary",
    validator: (value) =>
      ["primary", "secondary", "danger", "outline", "ghost"].includes(value),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["xs", "sm", "md", "lg"].includes(value),
  },
  type: {
    type: String,
    default: "button",
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
  // Updated to match attribute in the template
  className: {
    type: String,
    default: "",
  },
  // Add a new prop to control whether className should completely override styles
  overrideStyles: {
    type: Boolean,
    default: false,
  },
});

const variantClasses = computed(() => ({
  primary:
    "bg-linear-to-b from-pink-500 to-pink-600 dark:from-pink-500 dark:to-pink-700 text-white hover:from-pink-400 hover:to-pink-500 focus:from-pink-400 focus:to-pink-500 dark:hover:from-pink-400 dark:hover:to-pink-600 dark:focus:from-pink-400 dark:focus:to-pink-600 focus:ring-pink-400 dark:focus:ring-pink-500 border-b-4 border-pink-700 dark:border-pink-800",
  secondary:
    "bg-linear-to-b from-slate-300 to-slate-400 dark:from-gray-500 dark:to-gray-700 text-gray-800 dark:text-white hover:from-slate-200 hover:to-slate-300 focus:from-slate-200 focus:to-slate-300 dark:hover:from-gray-400 dark:hover:to-gray-600 dark:focus:from-gray-400 dark:focus:to-gray-600 focus:ring-slate-400 dark:focus:ring-gray-600 border-b-4 border-slate-500 dark:border-gray-900",
  danger:
    "bg-linear-to-b from-red-400 to-red-500 dark:from-red-600 dark:to-red-800 text-white hover:from-red-300 hover:to-red-400 focus:from-red-300 focus:to-red-400 dark:hover:from-red-500 dark:hover:to-red-700 dark:focus:from-red-500 dark:focus:to-red-700 focus:ring-red-400 dark:focus:ring-red-500 border-b-4 border-red-600 dark:border-red-800",
  outline:
    "bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 focus:bg-gray-50 dark:hover:bg-gray-700 dark:focus:bg-gray-700 focus:ring-gray-400 dark:focus:ring-gray-500",
  ghost:
    "bg-transparent text-gray-700 dark:text-gray-200 hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700 focus:ring-gray-300 dark:focus:ring-gray-600",
}));

const sizeClasses = computed(() => ({
  xs: "px-1.5 py-0.5 text-xs",
  sm: "px-2 py-1 text-sm",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-lg",
}));

const buttonClasses = computed(() => {
  // Base classes that are always applied and don't conflict with variants
  const baseClasses = [
    "rounded-lg font-medium transition-all duration-200",
    "focus:outline-hidden focus:ring-2 focus:ring-offset-2",
    "hover:-translate-y-1 hover:scale-[1.02] focus:-translate-y-1 focus:scale-[1.02] active:translate-y-1",
    sizeClasses.value[props.size],
    props.fullWidth ? "w-full" : "",
    props.is3d
      ? "shadow-[0_6px_0_rgba(0,0,0,0.2),0_8px_10px_rgba(0,0,0,0.15)] [transform-style:preserve-3d] transition-all duration-150 ease-in hover:shadow-[0_4px_0_rgba(0,0,0,0.2),0_5px_8px_rgba(0,0,0,0.15)] active:shadow-[0_2px_0_rgba(0,0,0,0.2),0_3px_5px_rgba(0,0,0,0.15)] active:border-b-2 dark:shadow-[0_6px_0_rgba(0,0,0,0.15),0_8px_10px_rgba(0,0,0,0.1)]"
      : "",
    props.disabled ? "cursor-not-allowed opacity-50" : "",
  ];

  // Get variant classes
  const variant = props.overrideStyles
    ? ""
    : variantClasses.value[props.variant];

  // Let tailwind-merge handle the conflicts naturally
  return cn(...baseClasses, variant, props.className);
});

defineEmits(["click"]);
</script>

<style scoped>
/* Improve the focus ring visibility for both light and dark modes */
button:focus {
  @apply outline-none ring-2 ring-offset-2;
}
</style>
