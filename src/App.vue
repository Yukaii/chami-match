<template>
  <div class="app-container h-full">
    <div class="app-content h-full">
      <NuxtErrorBoundary>
        <NuxtPage />
        <template #error="{ error }">
          <div class="error-container">
            <h1>Error encountered</h1>
            <p>{{ error }}</p>
            <button @click="error.value = null">Clear error</button>
          </div>
        </template>
      </NuxtErrorBoundary>
    </div>
    <NuxtErrorBoundary>
      <LazySettingsPopup />
    </NuxtErrorBoundary>
    <NuxtErrorBoundary>
      <LazyAboutPopup />
    </NuxtErrorBoundary>
    <NuxtErrorBoundary>
      <LazyRecordPopup />
    </NuxtErrorBoundary>
    <NuxtErrorBoundary>
      <LazyResetPopup />
    </NuxtErrorBoundary>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';

// Theme handling moved to the ThemeToggle component and app initialization
onMounted(() => {
  // Apply saved theme on initial load
  const savedTheme = localStorage.getItem("theme") || "dark"; // Default to dark
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  }
  
  // Initialize all stores that need initialization
  const { initializeStores } = useStores();
  initializeStores();
});

// Set up SEO and meta tags
useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Chami Match` : 'Chami Match';
  },
  meta: [
    { name: 'description', content: () => useI18n().t('description') },
  ],
});

// Update SEO meta when locale changes
const { locale } = useI18n();
watch(
  locale,
  () => {
    useSeoMeta({
      title: useI18n().t('title'),
      description: useI18n().t('description'),
      ogDescription: useI18n().t('description'),
      ogTitle: useI18n().t('title'),
      ogImage: `/og.png`,
      twitterCard: "summary_large_image",
    });
  },
  { immediate: true },
);
</script>

<style>
/* Global styles that you may want to include */
html, body, #__nuxt {
  height: 100%;
}

.dark {
  color-scheme: dark;
}

.error-container {
  padding: 2rem;
  text-align: center;
}

.error-container button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #ff5050;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
</style>
