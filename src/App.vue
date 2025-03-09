<script setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import AboutPopup from "./components/AboutPopup.vue";
import ErrorBoundary from "./components/ErrorBoundary.vue";
import RecordPopup from "./components/RecordPopup.vue";
import ResetPopup from "./components/ResetPopup.vue";
import SettingsPopup from "./components/SettingsPopup.vue";

const { t, locale } = useI18n();

// Theme handling moved to the ThemeToggle component and app initialization
onMounted(() => {
	// Apply saved theme on initial load
	const savedTheme = localStorage.getItem("theme") || "dark"; // Default to dark
	if (savedTheme === "dark") {
		document.documentElement.classList.add("dark");
	}
});

watch(
	locale,
	() => {
		useHead({
			title: t("title"),
			meta: [
				{
					name: "description",
					content: t("description"),
				},
			],
		});

		useSeoMeta({
			title: t("title"),
			description: t("description"),
			ogDescription: t("description"),
			ogTitle: t("title"),
			ogImage: `${import.meta.env.VITE_BASE_URL}/og.png`,
			twitterCard: "summary_large_image",
		});
	},
	{ immediate: true },
);
</script>

<template>
  <div class="app-container h-full">
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
