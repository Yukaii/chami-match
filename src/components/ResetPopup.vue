<template>
  <Modal :is-open="resetPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-white">{{ $t('reset.title') }}</div>

    <p class="mb-6 text-center text-white">{{ $t('reset.message') }}</p>

    <div class="flex space-x-4">
      <BaseButton
        variant="secondary"
        className="flex-1"
        is3d
        @click="onClose"
      >
        {{ $t('reset.cancel') }}
      </BaseButton>

      <BaseButton
        variant="danger"
        className="flex-1"
        is3d
        @click="confirmReset"
      >
        {{ $t('reset.confirm') }}
      </BaseButton>
    </div>
  </Modal>
</template>

<script setup>
import { resetGameData, useGlobalGameState } from "../gameState";
import BaseButton from "./base/BaseButton.vue";

const state = useGlobalGameState();
const resetPopupOpen = state.resetPopupOpen;

const onClose = () => {
	state.toggleResetPopup(false);
};

const confirmReset = () => {
	resetGameData();
	onClose();
};
</script>
