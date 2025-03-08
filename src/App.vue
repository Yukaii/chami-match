<script setup>
import { useI18n } from 'vue-i18n'
import SettingsPopup from './components/SettingsPopup.vue'
import AboutPopup from './components/AboutPopup.vue'
import RecordPopup from './components/RecordPopup.vue'
import ResetPopup from './components/ResetPopup.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'

const { t, locale } = useI18n()
const isDarkMode = true // always dark mode for this game

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
  <div class="app-container h-full" :class="{ 'dark-theme': isDarkMode }">
    <div class="app-content h-full">
      <ErrorBoundary>
        <router-view />
      </ErrorBoundary>
    </div>
    <ErrorBoundary>
      <SettingsPopup />
    </ErrorBoundary>

    <ErrorBoundary>
      <AboutPopup />
    </ErrorBoundary>

    <ErrorBoundary>
      <RecordPopup />
    </ErrorBoundary>

    <ErrorBoundary>
      <ResetPopup />
    </ErrorBoundary>
  </div>
</template>
