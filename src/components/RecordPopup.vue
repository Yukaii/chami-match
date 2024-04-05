<template>
  <Modal :isOpen="recordPopupOpen" @onClose="onClose">
    <div class="text-white text-lg mb-4 text-center">遊戲記錄</div>
    <div class="space-y-2">
      <!-- Record Items -->
      <div
        v-for="(record, index) in recentRecords"
        :key="index"
        class="bg-gray-800 p-2 rounded-lg flex justify-between items-center"
      >
        <div class="flex space-x-2 w-full max-w-20">
          <ColorBlock :color="record.actualColor" />
          <ColorBlock :color="record.guessedColor" />
        </div>
        <div class="flex flex-col flex-1 text-right">
          <span class="text-orange-300">H: {{ record.actualColor.h }} ({{ record.guessedColor.h - record.actualColor.h }})</span>
          <span class="text-orange-300">S: {{ record.actualColor.s }} ({{ record.guessedColor.s - record.actualColor.s }})</span>
          <span class="text-orange-300">V: {{ record.actualColor.v }} ({{ record.guessedColor.v - record.actualColor.v }})</span>
        </div>
      </div>
    </div>
    <button class="bg-pink-600 px-4 py-2 rounded-lg text-white w-full mt-4 button-3d" @click="onClose">關閉</button>
  </Modal>
</template>

<script setup>
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
const recordPopupOpen = state.recordPopupOpen
const recentRecords = state.lastTriesOfEachRound

const onClose = () => {
  state.toggleRecordPopup(false)
}
</script>
