<template>
  <div class="flex w-full justify-between space-x-4">
    <div class="flex gap-2">
      <div class="tooltip">
        <div class="button-3d flex items-center rounded-lg bg-pink-600 p-2 text-white">
          <ph-hand-fist :size="20" />
          <i class="fas fa-fist-raised text-white" />
          <span class="ml-2 text-white">{{ state.winningStreak }}</span>
        </div>
        <span class="tooltiptext">{{ $t('comboCount') }}</span>
      </div>
      <div class="tooltip">
        <div class="button-3d flex items-center rounded-lg bg-pink-600 p-2 text-white">
          <ph-chart-line :size="20" />
          <i class="fas fa-chart-line" />
          <span class="ml-2 text-white">{{ state.winRate.value }}</span>
        </div>
        <span class="tooltiptext">{{ $t('winningRate') }}</span>
      </div>
      <div class="tooltip">
        <div class="button-3d flex items-center rounded-lg bg-pink-600 p-2 text-white">
          <ph-arrows-clockwise :size="20" />
          <span class="ml-2">{{ state.currentRound }}</span>
        </div>
        <span class="tooltiptext">{{ $t('roundCount') }}</span>
      </div>
    </div>

    <div class="flex gap-2">
      <button class="button-3d rounded-lg bg-pink-600 p-2 text-white" @click="state.toggleSettingsPopup(true)">
        <ph-gear-six :size="20" />
      </button>

      <button class="button-3d rounded-lg bg-pink-600 p-2 text-white" @click="state.toggleRecordPopup(true)">
        <ph-clock-counter-clockwise :size="20" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { useGlobalGameState } from '../gameState'
import { PhClockCounterClockwise, PhArrowsClockwise, PhChartLine, PhHandFist, PhGearSix } from '@phosphor-icons/vue'

const state = useGlobalGameState()
</script>
