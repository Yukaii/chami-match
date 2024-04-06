<template>
  <div :class="className" @click="onClose">
    <div class="z-50 flex w-[90%] max-w-xs flex-col space-y-4 rounded-md bg-[#1f2937] p-4" @click.stop>
      <slot />
    </div>
  </div>
</template>

<script setup>
import { twMerge } from 'tailwind-merge'

const props = defineProps({
  isOpen: Boolean,
  modalClass: {
    type: String,
    default: '',
  },
})

const className = computed(() => {
  return twMerge(
    'fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50',
    props.modalClass,
    !props.isOpen && 'hidden'
  )
})

const emit = defineEmits(['onClose'])
const onClose = () => {
  emit('onClose')
}
</script>
