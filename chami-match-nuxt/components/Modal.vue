<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
});

const emit = defineEmits(['on-close']);

const closeModal = () => {
  emit('on-close');
};

// Prevent clicks inside the modal from bubbling to the backdrop
const preventBubbling = (event) => {
  event.stopPropagation();
};
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity" 
      @click="closeModal"
    >
      <div 
        :class="[
          'bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-auto transform transition-all',
          'max-h-[90vh] border border-gray-200 dark:border-gray-700',
          size === 'small' ? 'max-w-sm w-full' : 
          size === 'large' ? 'max-w-3xl w-full' : 
          'max-w-lg w-full'
        ]" 
        @click="preventBubbling"
      >
        <div class="p-6">
          <div class="absolute right-4 top-4">
            <button 
              @click="closeModal"
              class="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>