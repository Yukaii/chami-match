<template>
  <Modal :is-open="store.resetPopupOpen" @on-close="onClose">
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
import { useGameStore } from "../stores/game";
import BaseButton from "./base/BaseButton.vue";

const store = useGameStore();

const onClose = () => {
	store.toggleResetPopup();
};

const confirmReset = () => {
	store.resetGameData();
	onClose();
};
</script>
