<template>
  <Modal :is-open="resetPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-white">{{ $t('reset.title') }}</div>

    <p class="mb-6 text-center text-white">{{ $t('reset.message') }}</p>

    <div class="flex space-x-4">
      <button
        class="button-3d flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white"
        @click="onClose"
      >
        {{ $t('reset.cancel') }}
      </button>

      <button
        class="button-3d flex-1 rounded-lg bg-red-600 px-4 py-2 text-white"
        @click="confirmReset"
      >
        {{ $t('reset.confirm') }}
      </button>
    </div>
  </Modal>
</template>

<script setup>
import { useGlobalGameState, resetGameData } from '../gameState'

const state = useGlobalGameState()
const resetPopupOpen = state.resetPopupOpen

const onClose = () => {
  state.toggleResetPopup(false)
}

const confirmReset = () => {
  resetGameData()
  onClose()
}
</script>
