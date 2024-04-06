<template>
  <Modal :is-open="settingsPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg text-white font-bold">Settings</div>

    <!-- Precision -->
    <div class="mb-4">
      <label class="text-white font-bold block mb-2">Precision</label>
      <div class="flex space-x-2">
        <button
          v-for="value in [3, 5, 10, 20, 30]"
          :key="value"
          class="button-3d"
          :class="`px-2 py-1 rounded-lg ${settings.precision === value ? 'bg-pink-600' : 'bg-slate-600'}`"
          @click="settings.precision = value"
        >
          {{ value }}
        </button>
      </div>
    </div>

    <!-- Color Mode -->
    <div class="mb-4">
      <label class="text-white font-bold block mb-2">Color Mode</label>
      <div class="flex space-x-2">
        <button
          v-for="value in ['Color', 'B/W']"
          :key="value"
          class="button-3d"
          :class="`px-2 py-1 rounded-lg ${settings.mode === value ? 'bg-pink-600' : 'bg-slate-600'}`"
          @click="settings.mode = value"
        >
          {{ value }}
        </button>
      </div>
    </div>

    <!-- Max Tries -->
    <div class="mb-4">
      <label class="text-white font-bold block mb-2">Max Tries</label>
      <div class="flex space-x-2">
        <button
          v-for="value in [3, 5, 10]"
          :key="value"
          class="button-3d"
          :class="`px-2 py-1 rounded-lg ${settings.maxTries === value ? 'bg-pink-600' : 'bg-slate-600'}`"
          @click="settings.maxTries = value"
        >
          {{ value }}
        </button>
      </div>
    </div>

    <button class="button-3d mt-4 w-full rounded-lg bg-pink-600 px-4 py-2 text-white" @click="onApply">
      Apply
    </button>
  </Modal>
</template>

<script setup>
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
const settingsPopupOpen = state.settingsPopupOpen
const settings = reactive({
  precision: state.precision.value,
  mode: state.mode.value,
  maxTries: state.maxLife.value,
})

const onClose = () => {
  state.toggleSettingsPopup(false)
}

watch(state.settingsPopupOpen, () => {
  if (state.settingsPopupOpen) {
    settings.precision = state.precision.value
    settings.mode = state.mode.value
    settings.maxTries = state.maxLife.value
  }
})

const onApply = () => {
  state.updatePrecision(settings.precision);
  state.updateMode(settings.mode);
  state.updateMaxLife(settings.maxTries);
  state.startOver()
  onClose()
}
</script>
