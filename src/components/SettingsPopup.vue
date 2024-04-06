<template>
  <Modal :is-open="settingsPopupOpen" @on-close="onClose">
    <div class="text-center text-lg font-bold text-white">{{ $t('settings.title') }}</div>

    <!--Language-->
    <div>
      <label class="mb-2 block font-bold text-white">{{ $t('settings.language.label') }}</label>
      <div class="flex space-x-2">
        <button v-for="lang in languages" :key="lang.code" class="button-3d"
          :class="`px-2 py-1 rounded-lg ${settings.language === lang.code ? 'bg-pink-600' : 'bg-slate-600'}`"
          @click="settings.language = lang.code">{{ lang.label }}</button>
      </div>
    </div>

    <!-- Precision -->
    <div>
      <label class="mb-2 block font-bold text-white">{{ $t('settings.precision.label') }}</label>
      <div class="flex space-x-2">
        <button v-for="value in [3, 5, 10, 20, 30]" :key="value" class="button-3d"
          :class="`px-2 py-1 rounded-lg ${settings.precision === value ? 'bg-pink-600' : 'bg-slate-600'}`"
          @click="settings.precision = value">
          {{ value }}
        </button>
      </div>
    </div>

    <!-- Color Mode -->
    <div>
      <label class="mb-2 block font-bold text-white">{{ $t('settings.colorMode.label') }}</label>
      <div class="flex space-x-2">
        <button v-for="value in ['Color', 'B/W']" :key="value" class="button-3d"
          :class="`px-2 py-1 rounded-lg ${settings.mode === value ? 'bg-pink-600' : 'bg-slate-600'}`"
          @click="settings.mode = value">
          {{ value }}
        </button>
      </div>
    </div>

    <!-- Max Tries -->
    <div>
      <label class="mb-2 block font-bold text-white">{{ $t('settings.maxTries.label') }}</label>
      <div class="flex space-x-2">
        <button v-for="value in [3, 5, 10]" :key="value" class="button-3d"
          :class="`px-2 py-1 rounded-lg ${settings.maxTries === value ? 'bg-pink-600' : 'bg-slate-600'}`"
          @click="settings.maxTries = value">
          {{ value }}
        </button>
      </div>
    </div>

    <button class="button-3d !mt-8 w-full rounded-lg bg-pink-600 px-4 py-2 text-white" @click="onApply">
      {{ $t('settings.cta') }}
    </button>
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
})

const onClose = () => {
  settings.language = localStorage.getItem('lang') || navigator.language || 'zh-TW'
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
  state.updatePrecision(settings.precision)
  state.updateMode(settings.mode)
  state.updateMaxLife(settings.maxTries)
  state.startOver()
  localStorage.setItem('lang', settings.language)
  locale.value = settings.language
  onClose()
}
</script>
