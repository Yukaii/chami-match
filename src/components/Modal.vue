<template>
    <div :class="className" @click="onClose">
        <div class="w-[90%] max-w-xs bg-[#1f2937] rounded-md p-4 z-50" @click.stop>
            <slot/>
        </div>
    </div>
</template>

<script setup>
import { twMerge } from 'tailwind-merge'

const props = defineProps({
  isOpen: Boolean,
  onClose: Function,
  modalClass: String
});

const className = computed(() => {
  return twMerge('fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50 z-50', props.modalClass, !props.isOpen && 'hidden')
})
</script>
