<template>
  <div class="w-full aspect-square max-w-[50%] rounded-lg" :style="{ backgroundColor: colorStr }"></div>
</template>

<script setup>
import { computed } from 'vue'
import { hsvToRgb } from '../utils'

const props = defineProps({
  color: {
    type: Object,
    required: true
  }
})

const { h, s, v } = props.color
const rgbColor = hsvToRgb(h, s, v)
const colorStr = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`
</script>
