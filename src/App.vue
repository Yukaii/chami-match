<script setup>
import { useI18n } from 'vue-i18n'
import { useGlobalGameState } from './gameState'
import WelcomeScreen from './components/WelcomeScreen.vue'
import GameScreen from './components/GameScreen.vue'

const { t, locale } = useI18n()
const state = useGlobalGameState()

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
</script>

<template>
  <div class="size-full">
    <WelcomeScreen v-if="!state.isGameActive.value" />
    <GameScreen v-else />

    <!-- Popups should be available on both screens -->
    <RecordPopup />
    <SettingsPopup />
    <AboutPopup />
    <ResetGameDataConfirmPopup />
  </div>
</template>
