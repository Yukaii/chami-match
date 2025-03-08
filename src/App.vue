<script setup>
import { useI18n } from 'vue-i18n'

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
</script>

<template>
  <div class="size-full">
    <RouterView />

    <!-- Popups should be available on both screens -->
    <RecordPopup />
    <SettingsPopup />
    <AboutPopup />
    <ResetGameDataConfirmPopup />
  </div>
</template>
