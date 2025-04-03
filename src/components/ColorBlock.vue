<template>
  <div class="aspect-square w-full max-w-[50%] rounded-lg" :style="{ backgroundColor: colorStr }" />
</template>

<script setup>
import { computed } from "vue";
import { useGameStore } from "../stores/game";
import { hsvToRgb } from "../utils";
import { oklabToRgb } from "../utils/colorSpaceUtils";

const store = useGameStore();
const colorSpace = computed(() => store.colorSpace);

const props = defineProps({
  color: {
    type: Object,
    required: true,
  },
});

const colorStr = computed(() => {
  // Check which color space we're using
  if (colorSpace.value === "rgb") {
    // RGB color space
    const { r, g, b } = props.color;
    return `rgb(${r}, ${g}, ${b})`;
  }

  if (colorSpace.value === "oklab") {
    // OKLAB color space - convert to RGB for display
    const { L, a, b } = props.color;
    const rgb = oklabToRgb(L, a, b);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  // Default HSV color space
  const { h, s, v } = props.color;
  const rgbColor = hsvToRgb(h, s, v);
  return `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
});
</script>
