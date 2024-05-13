<script setup>
import { useI18n } from 'vue-i18n'

import { useGlobalGameState } from './gameState'

const { t, locale } = useI18n()

watch(
  locale,
  () => {
    console.log('locale', locale.value)

    useHead({
      title: t('title'),
      meta: [
        {
          name: 'description',
          content: t('description'),
        },
      ],
    })

    useSeoMeta({
      title: t('title'),
      description: t('description'),
      ogDescription: t('description'),
      ogTitle: t('title'),
      ogImage: `${import.meta.env.VITE_BASE_URL}/og.png`,
      twitterCard: 'summary_large_image',
    })
  },
  { immediate: true }
)

const state = useGlobalGameState()
const randomColor = state.randomColor
const userColor = state.userColor
const mode = state.mode
const realtimePreview = state.realtimePreview

const userH = ref(userColor.h)
const userS = ref(userColor.s)
const userV = ref(userColor.v)

const hsv = computed(() => {
  const hsv = [parseInt(userH.value, 10), parseInt(userS.value, 10), parseInt(userV.value, 10)]
  if (mode.value === 'B/W') {
    hsv[0] = 0
    hsv[1] = 0
  }
	return hsv
})

const submit = () => {
  state.updateUserColor(...hsv.value)
  state.checkGuess()
}

watch([hsv, realtimePreview], () => {
	if (realtimePreview.value) {
		state.updateUserColor(...hsv.value)
	}
})
</script>

<template>
  <div class="flex size-full flex-col justify-between p-2 pb-4">
    <div class="flex flex-col gap-3">
      <Toolbar />
      <HealthBar />
    </div>

    <div class="flex gap-2">
      <ColorBlock :color="randomColor" />
      <ColorBlock :color="userColor" />
    </div>

    <!-- Sliders and Submit Button -->
    <div class="flex flex-col space-y-4">
      <!-- Hue Slider -->
      <div class="flex items-center">
        <span class="mr-2 text-orange-300">H:</span>
        <input v-model="userH" type="range" min="0" max="360" class="slider hue-slider" />
        <span class="ml-2 min-w-[65px] rounded-lg bg-gray-700 px-4 py-2 text-center text-white">{{ userH }}</span>
      </div>
      <!-- Saturation Slider -->
      <div class="flex items-center">
        <span class="mr-2 text-orange-300">S:</span>
        <input v-model="userS" type="range" min="0" max="100" class="slider saturation-slider" />
        <span class="ml-2 min-w-[65px] rounded-lg bg-gray-700 px-4 py-2 text-center text-white">{{ userS }}</span>
      </div>
      <!-- Value Slider -->
      <div class="flex items-center">
        <span class="mr-2 text-orange-300">V:</span>
        <input v-model="userV" type="range" min="0" max="100" class="slider value-slider" />
        <span class="ml-2 min-w-[65px] rounded-lg bg-gray-700 px-4 py-2 text-center text-white">{{ userV }}</span>
      </div>

      <!-- Submit Button -->
      <button class="button-3d w-full rounded-lg bg-pink-600 px-4 py-2 text-white" @click="submit">
        {{ $t('submit') }}
      </button>
    </div>

    <RecordPopup />
    <SettingsPopup />
    <AboutPopup />
    <ResetGameDataConfirmPopup />
  </div>
</template>
