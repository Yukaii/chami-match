<template>
  <div :class="className" @click="onClose">
    <div
      class="animate-pop-in z-50 flex max-h-[80%] w-[90%] flex-col space-y-4 overflow-auto rounded-xl border-2 border-white/30  bg-gray-100 p-6 shadow-2xl transition-all duration-300 dark:border-gray-600/30 dark:bg-gray-800"
      :class="[sizeClass]"
      @click.stop
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { cn } from "../utils/index";

const props = defineProps({
  isOpen: Boolean,
  modalClass: {
    type: String,
    default: "",
  },
  size: {
    type: String,
    default: "default",
    validator: (value) =>
      ["small", "default", "medium", "large", "xl"].includes(value),
  },
});

const sizeClass = computed(() => {
  const sizes = {
    small: "max-w-xs",
    default: "max-w-xs",
    medium: "max-w-md",
    large: "max-w-lg",
    xl: "max-w-xl",
  };
  return sizes[props.size] || sizes.default;
});

const className = computed(() => {
  return cn(
    "fixed left-0 top-0 z-50 flex size-full items-center justify-center bg-black/50 backdrop-blur-xs",
    props.modalClass,
    !props.isOpen && "hidden",
  );
});

const emit = defineEmits(["onClose"]);
const onClose = () => {
  emit("onClose");
};
</script>

<style scoped>
@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  50% {
    opacity: 1;
    transform: scale(1.02) translateY(-5px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

.animate-pop-in {
  animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
</style>
