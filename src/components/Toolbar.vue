<template>
  <div class="flex w-full space-x-4 justify-between">
    <div class="flex gap-2">
      <div class="tooltip">
        <div class="bg-pink-600 rounded-lg px-2 py-2 flex items-center button-3d text-white">
          <ph-hand-fist :size="20" />
          <i class="fas fa-fist-raised text-white"></i>
          <span class="ml-2 text-white">{{ state.winningStreak }}</span>
        </div>
        <span class="tooltiptext">連擊數</span>
      </div>
      <div class="tooltip">
        <div class="bg-pink-600 rounded-lg px-2 py-2 flex items-center button-3d text-white">
          <ph-chart-line :size="20" />
          <i class="fas fa-chart-line"></i>
          <span class="ml-2 text-white">{{ state.winRate.value }}</span>
        </div>
        <span class="tooltiptext">勝率</span>
      </div>
      <div class="tooltip">
        <div class="bg-pink-600 rounded-lg px-2 py-2 flex items-center button-3d text-white">
          <ph-arrows-clockwise :size="20" />
          <span class="ml-2">{{ state.currentRound }}</span>
        </div>
        <span class="tooltiptext">回合數</span>
      </div>
    </div>

    <button @click="$emit('toggleRecord')" class="bg-pink-600 p-2 rounded-lg text-white button-3d">
      <ph-clock-counter-clockwise :size="20" />
    </button>
  </div>
</template>


<script setup>
import { useGlobalGameState } from '../gameState'
import { PhClockCounterClockwise, PhArrowsClockwise, PhChartLine, PhHandFist } from '@phosphor-icons/vue'

const state = useGlobalGameState()
</script>
