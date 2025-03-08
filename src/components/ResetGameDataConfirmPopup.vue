<template>
  <Modal :is-open="resetPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-gray-900 dark:text-white">{{ $t('reset.title') }}</div>
    <p class="mb-2 text-gray-900 dark:text-white">{{ $t('reset.message') }}</p>
    <div class="flex w-full justify-around">
      <BaseButton
        variant="danger"
        is3d
        class="mt-4"
        @click="onReset"
      >
        {{ $t('reset.confirm') }}
      </BaseButton>
      <BaseButton
        variant="primary"
        is3d
        class="mt-4"
        @click="onClose"
      >
        {{ $t('reset.cancel') }}
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

const onReset = () => {
	resetGameData();
};
</script>
