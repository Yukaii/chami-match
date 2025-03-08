<template>
  <Modal :is-open="recordPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-white">{{ $t('gameRecord.title') }}</div>
    <div v-if="validRecords.length === 0" class="text-gray-400">
      {{ $t('gameRecord.emptyContent') }}
    </div>
    <div v-else class="max-h-[80vh] overflow-auto">
      <div
        v-for="(record, index) in validRecords"
        :key="index"
        class="mb-4 rounded-lg border border-slate-700 p-4"
      >
        <div class="mb-2 flex items-center justify-between">
          <div class="text-white">
            {{ $t('roundCount') }}: {{ record.round }}
          </div>
          <div
            class="rounded-lg px-2 py-1 text-white"
            :class="record.wasSuccess ? 'bg-green-700' : 'bg-red-700'"
          >
            {{ record.wasSuccess ? '✓' : '✗' }}
          </div>
        </div>

        <!-- Standard/Contextual Mode Display -->
        <template v-if="hasColorProperties(record)">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="mb-2 text-white">{{ $t('actualColor') }}</div>
              <div
                class="h-16 w-full rounded-lg"
                :style="`background-color: hsl(${record.actualColor.h}, ${record.actualColor.s}%, ${record.actualColor.v}%)`"
              ></div>
            </div>
            <div>
              <div class="mb-2 text-white">{{ $t('guessedColor') }}</div>
              <div
                class="h-16 w-full rounded-lg"
                :style="`background-color: hsl(${record.guessedColor.h}, ${record.guessedColor.s}%, ${record.guessedColor.v}%)`"
              ></div>
            </div>
          </div>
        </template>

        <!-- Relative Mode Display -->
        <template v-else-if="hasDifferenceProperties(record)">
          <div class="mb-2 text-white">
            <div class="mb-2">{{ $t('actualDifference') }}: <span class="font-bold">{{ record.actualDifference }}</span></div>
            <div>{{ $t('guessedDifference') }}: <span class="font-bold">{{ record.guessedDifference }}</span></div>
          </div>

          <div class="mt-2 h-2 w-full bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-green-500" :style="`width: ${record.actualDifference}%`"></div>
          </div>
          <div class="mt-1 h-2 w-full bg-gray-700 rounded-full overflow-hidden">
            <div class="h-full bg-blue-500" :style="`width: ${record.guessedDifference}%`"></div>
          </div>
          <div class="mt-1 flex justify-between text-xs text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </template>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
const recordPopupOpen = state.recordPopupOpen

// Filter out invalid records with safety checks
const validRecords = computed(() => {
  // Check if lastTriesOfEachRound exists and is an array
  if (!state.lastTriesOfEachRound || !Array.isArray(state.lastTriesOfEachRound)) {
    return [];
  }

  return state.lastTriesOfEachRound.filter(record =>
    record && typeof record === 'object' && 'round' in record && 'wasSuccess' in record
  );
});

// Helper function to determine if a record has color properties
function hasColorProperties(record) {
  return record && record.actualColor && record.guessedColor;
}

// Helper function to determine if a record has difference properties
function hasDifferenceProperties(record) {
  return record && record.actualDifference !== undefined && record.guessedDifference !== undefined;
}

const onClose = () => {
  state.toggleRecordPopup(false)
}
</script>
