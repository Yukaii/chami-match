<template>
  <div :class="className" @click="onClose">
    <div
      class="z-50 flex max-h-[80%] w-[90%] flex-col space-y-4 overflow-auto rounded-md bg-[#1f2937] p-4"
      :class="[sizeClass]"
      @click.stop
    >
      <slot />
    </div>
  </div>
</template>

<script setup>
import { cn } from '../utils/index'
import { computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  modalClass: {
    type: String,
    default: '',
  },
  size: {
    type: String,
    default: 'default',
    validator: (value) => ['small', 'default', 'medium', 'large', 'xl'].includes(value)
  }
})

const sizeClass = computed(() => {
  const sizes = {
    small: 'max-w-xs',
    default: 'max-w-xs',
    medium: 'max-w-md',
    large: 'max-w-lg',
    xl: 'max-w-xl'
  }
  return sizes[props.size] || sizes.default
})

const className = computed(() => {
  return cn(
    'fixed left-0 top-0 z-50 flex size-full items-center justify-center bg-black/50',
    props.modalClass,
    !props.isOpen && 'hidden'
  )
})

const emit = defineEmits(['onClose'])
const onClose = () => {
  emit('onClose')
}
</script>
