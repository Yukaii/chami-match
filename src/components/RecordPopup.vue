<template>
  <Modal :is-open="recordPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg text-white">{{ $t('gameRecord') }}</div>
    <div class="space-y-2">
      <!-- Record Items -->
      <div v-for="(record, index) in recentRecords" :key="index"
        class="flex items-center justify-between rounded-lg bg-gray-800 p-2">
        <div class="flex w-full max-w-20 space-x-2">
          <ColorBlock :color="record.actualColor" />
          <ColorBlock :color="record.guessedColor" />
        </div>
        <div class="flex flex-1 flex-col text-right">
          <span class="text-orange-300">H: {{ record.actualColor.h }} ({{ record.guessedColor.h - record.actualColor.h
            }})</span>
          <span class="text-orange-300">S: {{ record.actualColor.s }} ({{ record.guessedColor.s - record.actualColor.s
            }})</span>
          <span class="text-orange-300">V: {{ record.actualColor.v }} ({{ record.guessedColor.v - record.actualColor.v
            }})</span>
        </div>
      </div>
    </div>
    <button class="button-3d mt-4 w-full rounded-lg bg-pink-600 px-4 py-2 text-white" @click="onClose">
      {{ $t('close') }}</button>
  </Modal>
</template>

<script setup>
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
const recordPopupOpen = state.recordPopupOpen

const onClose = () => {
  state.toggleRecordPopup(false)
}

const recentRecords = computed(() => state.lastTriesOfEachRound.value.slice(0, 5))
</script>
