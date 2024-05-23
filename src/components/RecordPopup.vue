<template>
  <Modal :is-open="recordPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg text-white">{{ $t('gameRecord.title') }}</div>
    <div v-if="recentRecords?.length > 0" class="space-y-2">
      <!-- Record Items -->
      <div v-for="(record, index) in recentRecords" :key="index"
        class="grid grid-cols-5 items-center gap-2 rounded-lg bg-gray-800 p-2">
        <!-- Success Indicator -->
        <div class="flex justify-center">
          <span v-if="record.wasSuccess">
            <ph-check-circle :size="16" class="text-green-500" />
          </span>
          <span v-else>
            <ph-x-circle :size="16" class="text-red-500" />
          </span>
        </div>

        <div class="col-span-2 flex space-x-2">
          <ColorBlock :color="record.actualColor" />
          <ColorBlock :color="record.guessedColor" />
        </div>

        <div class="col-span-2 flex flex-col text-right">
          <span class="text-orange-300">
            H: {{ record.actualColor.h }} ({{ record.guessedColor.h - record.actualColor.h }})
          </span>
          <span class="text-orange-300">
            S: {{ record.actualColor.s }} ({{ record.guessedColor.s - record.actualColor.s }})
          </span>
          <span class="text-orange-300">
            V: {{ record.actualColor.v }} ({{ record.guessedColor.v - record.actualColor.v }})
          </span>
        </div>
      </div>
    </div>
    <div v-else class="text-balance pb-4 text-center text-white">{{ $t('gameRecord.emptyContent') }}</div>
    <button class="button-3d mt-4 w-full rounded-lg bg-pink-600 px-4 py-2 text-white" @click="onClose">
      {{ $t('close') }}
    </button>
  </Modal>
</template>

<script setup>
import { PhCheckCircle, PhXCircle } from '@phosphor-icons/vue'
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
const recordPopupOpen = state.recordPopupOpen

const onClose = () => {
  state.toggleRecordPopup(false)
}

const recentRecords = computed(() => state.lastTriesOfEachRound.value.slice(0, 5))
</script>
