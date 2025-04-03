<script setup>
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import AboutPopup from "./components/AboutPopup.vue";
import CreateChallengePopup from "./components/CreateChallengePopup.vue";
import ErrorBoundary from "./components/ErrorBoundary.vue";
import LeaderboardPopup from "./components/LeaderboardPopup.vue"; // Import Leaderboard Popup
import RecordPopup from "./components/RecordPopup.vue";
import ResetPopup from "./components/ResetPopup.vue";
import SettingsPopup from "./components/SettingsPopup.vue";
import { useGameStore } from "./stores/game"; // Import store

const { t, locale } = useI18n();
const store = useGameStore(); // Use the store

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

    <!-- Conditionally render the Create Challenge Popup -->
    <ErrorBoundary>
       <CreateChallengePopup v-if="store.createChallengePopupOpen" @close="store.toggleCreateChallengePopup" />
    </ErrorBoundary>

    <!-- Conditionally render the Leaderboard Popup -->
    <ErrorBoundary>
       <LeaderboardPopup v-if="store.leaderboardPopupOpen" @close="store.toggleLeaderboardPopup" />
    </ErrorBoundary>
  </div>
</template>
