<template>
  <div class="flex w-full justify-between space-x-4">
    <div class="flex gap-2">
      <slot name="left">
        <div class="tooltip">
          <div class="button-3d flex items-center rounded-lg bg-pink-600 p-2 text-white">
            <ph-arrows-clockwise :size="20" />
            <span class="ml-2">{{ state.currentRound }}</span>
          </div>
          <span class="tooltiptext">{{ $t('roundCount') }}</span>
        </div>

        <div class="tooltip">
          <div :class="cn('button-3d flex items-center rounded-lg bg-pink-600 p-2 text-white', className)">
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
      </slot>
    </div>

    <div class="flex gap-2">
      <slot name="right">
        <div class="tooltip">
          <button class="button-3d rounded-lg bg-pink-600 p-2 text-white" @click="state.toggleRecordPopup(true)">
            <ph-clock-counter-clockwise :size="20" />
          </button>
          <span class="tooltiptext">{{ $t('gameRecord.title') }}</span>
        </div>

        <div class="tooltip">
          <button class="button-3d rounded-lg bg-pink-600 p-2 text-white" @click="openSettings">
            <ph-gear-six :size="20" />
          </button>
          <span class="tooltiptext">{{ $t('settings.title') }}</span>
        </div>

        <div class="tooltip">
          <button class="button-3d rounded-lg bg-pink-600 p-2 text-white" @click="state.toggleAboutPopup(true)">
            <ph-question :size="20" />
          </button>
          <span class="tooltiptext">{{ $t('about.title') }}</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { useGlobalGameState } from '../gameState'
import { cn } from '../utils/index'
import {
  PhClockCounterClockwise,
  PhArrowsClockwise,
  PhChartLine,
  PhHandFist,
  PhGearSix,
  PhQuestion,
} from '@phosphor-icons/vue'

const state = useGlobalGameState()

function openSettings() {
  state.settingsMode = 'game'
  state.toggleSettingsPopup(true)
}

const isShaking = ref(false)
const isFlipping = ref(false)

watch([state.winningStreak, state.currentRound], ([count, round], [prevCount, prevRound]) => {
  if (round === 1) {
    // round reset
    return
  }

  if (count == (prevCount + 1)) {
    // win!
    isFlipping.value = true
    setTimeout(() => {
      isFlipping.value = false
    }, 600)
  } else {
    isShaking.value = true
    setTimeout(() => {
      isShaking.value = false
    }, 300)
  }
})

const className = computed(() => {
  return cn(
    isFlipping.value && 'animate-flip',
    isShaking.value && 'animate-shake',
  )
})
</script>
