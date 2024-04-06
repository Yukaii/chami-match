<template>
  <Modal :is-open="resetPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-white">{{ $t('reset.title') }}</div>
    <p class="mb-2 text-white">{{ $t('reset.message') }}</p>
    <div class="flex w-full justify-around">
      <button class="button-3d mt-4 rounded-lg bg-slate-600 px-4 py-2 text-white" @click="onReset">
        {{ $t('reset.confirm') }}
      </button>
      <button class="button-3d mt-4 rounded-lg bg-pink-600 px-4 py-2 text-white" @click="onClose">
        {{ $t('reset.cancel') }}
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

const onReset = () => {
  resetGameData()
}
</script>
