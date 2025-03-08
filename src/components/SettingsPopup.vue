<template>
  <Modal :is-open="settingsPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-white">{{ $t('settings.title') }}</div>

    <!-- UI Options -->
    <div class="mb-4">
      <div class="mb-2 text-xl font-bold text-white">{{ $t('settings.UIOptions') }}</div>
      <hr class="mb-4 border-gray-400" />

      <!-- Language -->
      <div class="mb-4">
        <label class="mb-2 block font-bold text-white">{{ $t('settings.language') }}</label>
        <div class="flex space-x-2">
          <button
            v-for="lang in languages"
            :key="lang.code"
            class="button-3d"
            :class="`px-2 py-1 rounded-lg ${settings.language === lang.code ? 'bg-pink-600' : 'bg-slate-600'}`"
            @click="handleChangeLanguage(lang.code)"
          >
            {{ lang.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Game Options - Only shown in game mode -->
    <div v-if="state.settingsMode === 'game'">
      <div class="mb-2 text-xl font-bold text-white">{{ $t('settings.gameOptions') }}</div>
      <hr class="mb-4 border-gray-400" />

      <!-- Precision -->
      <div class="mb-4">
        <label class="mb-2 block font-bold text-white">{{ $t('settings.precision.label') }}</label>
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
        <label class="mb-2 block font-bold text-white">{{ $t('settings.colorMode.label') }}</label>
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
        <label class="mb-2 block font-bold text-white">{{ $t('settings.maxTries.label') }}</label>
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

      <!-- Realtime Preview -->
      <div class="mb-4">
        <label class="mb-2 block font-bold text-white">{{ $t('settings.realtimePreview.label') }}</label>
        <div class="flex space-x-2">
          <button
            v-for="value in [true, false]"
            :key="value.toString()"
            class="button-3d"
            :class="`px-2 py-1 rounded-lg ${settings.realtimePreview === value ? 'bg-pink-600' : 'bg-slate-600'}`"
            @click="settings.realtimePreview = value"
          >
            {{ value ? 'On' : 'Off' }}
          </button>
        </div>
      </div>

      <div class="mb-2 rounded-lg bg-gray-800 px-4 py-2 text-sm">{{ $t('settings.notice') }}</div>
      <button class="button-3d w-full rounded-lg bg-pink-600 px-4 py-2 text-white" @click="onApply">
        {{ $t('settings.cta') }}
      </button>
    </div>

    <div class="mb-4 mt-6">
      <div class="mb-2 text-xl font-bold text-white">{{ $t('settings.danger') }}</div>
      <hr class="mb-4 border-gray-400" />

      <p class="mb-2 text-white">{{ $t('settings.confirmReset') }}</p>

      <button
        class="button-3d w-full rounded-lg bg-red-600 px-4 py-2 text-white"
        @click="state.toggleResetPopup(true)"
      >
        {{ $t('settings.resetGameData') }}
      </button>
    </div>
  </Modal>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

import { useGlobalGameState } from '../gameState'

const { locale } = useI18n()
const state = useGlobalGameState()
const settingsPopupOpen = state.settingsPopupOpen
const languages = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
]
const settings = reactive({
  language: localStorage.getItem('lang') || navigator.language || 'zh-TW',
  precision: state.precision.value,
  mode: state.mode.value,
  maxTries: state.maxLife.value,
  realtimePreview: state.realtimePreview.value,
})

const onClose = () => {
  state.toggleSettingsPopup(false)
}

watch(state.settingsPopupOpen, () => {
  if (state.settingsPopupOpen) {
    settings.precision = state.precision.value
    settings.mode = state.mode.value
    settings.maxTries = state.maxLife.value
    settings.realtimePreview = state.realtimePreview.value
  }
})

const onApply = () => {
  state.updatePrecision(settings.precision)
  state.updateMode(settings.mode)
  state.updateMaxLife(settings.maxTries)
  state.updateRealtimePreview(settings.realtimePreview)
  state.startOver()
  onClose()
}

const handleChangeLanguage = (lang) => {
  settings.language = lang
  locale.value = lang
  localStorage.setItem('lang', lang)
}
</script>
