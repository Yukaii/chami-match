<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useChallengeApi } from "../composables/useChallengeApi";
import BaseButton from "./base/BaseButton.vue"; // Assuming BaseButton is needed

const props = defineProps({
	challengeId: {
		type: String,
		required: true,
	},
});

const { getLeaderboard, isLoading, error } = useChallengeApi();
const leaderboardData = ref(null); // Will hold { challengeName, expiresAt, leaderboard: [] }
const refreshInterval = ref(null);

const fetchLeaderboard = async () => {
	if (!props.challengeId) return;
	try {
		leaderboardData.value = await getLeaderboard(props.challengeId);
	} catch (err) {
		// Error is already logged in the composable and stored in 'error' ref
		leaderboardData.value = null; // Clear data on error
	}
};

// Fetch on mount and when challengeId changes
onMounted(fetchLeaderboard);
watch(() => props.challengeId, fetchLeaderboard);

// Optional: Auto-refresh every 30 seconds
onMounted(() => {
	refreshInterval.value = setInterval(fetchLeaderboard, 30000); // Refresh every 30s
});
onUnmounted(() => {
	if (refreshInterval.value) {
		clearInterval(refreshInterval.value);
	}
});

const sortedLeaderboard = computed(() => {
	// The server already sorts, but we can ensure it here too
	return leaderboardData.value?.leaderboard || [];
});

const formatTimestamp = (timestamp) => {
	if (!timestamp) return "N/A";
	return new Date(timestamp).toLocaleString();
};
</script>

<template>
  <div class="p-4 border rounded-lg shadow-md bg-white dark:bg-gray-800">
    <h2 class="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
      Leaderboard: {{ leaderboardData?.challengeName || 'Loading...' }}
    </h2>

    <div v-if="isLoading && !leaderboardData" class="text-center py-4">
      Loading...
    </div>
    <div v-else-if="error" class="text-center py-4 text-red-500">
      Error loading leaderboard: {{ error }}
    </div>
    <div v-else-if="sortedLeaderboard.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
      No scores submitted yet.
    </div>
    <ul v-else class="space-y-2">
      <li
        v-for="(entry, index) in sortedLeaderboard"
        :key="entry.participantId"
        class="flex justify-between items-center p-2 rounded"
        :class="{
          'bg-yellow-100 dark:bg-yellow-800': index === 0,
          'bg-gray-100 dark:bg-gray-700': index > 0,
        }"
      >
        <div class="flex items-center space-x-2">
          <span class="font-medium w-6 text-right">{{ index + 1 }}.</span>
          <span class="truncate">{{ entry.displayName }}</span>
        </div>
        <span class="font-bold text-lg">{{ entry.score }}</span>
        <!-- Optional: Show submission time -->
        <!-- <span class="text-xs text-gray-500">{{ formatTimestamp(entry.submittedAt) }}</span> -->
      </li>
    </ul>

    <div v-if="leaderboardData?.expiresAt" class="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
      Challenge expires: {{ formatTimestamp(leaderboardData.expiresAt) }}
    </div>

    <!-- Add a manual refresh button? -->
     <div class="mt-4 text-center">
        <BaseButton @click="fetchLeaderboard" :disabled="isLoading" size="sm" variant="secondary">
            {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </BaseButton>
     </div>
  </div>
</template>
