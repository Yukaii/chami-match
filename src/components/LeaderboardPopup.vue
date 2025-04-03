<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useChallengeApi } from "../composables/useChallengeApi";
import { useGameStore } from "../stores/game";
import Modal from "./Modal.vue";
import BaseButton from "./base/BaseButton.vue";

const store = useGameStore();
const emit = defineEmits(["close"]);
// Destructure the correct function name: getLeaderboard
const { getLeaderboard, isLoading, error } = useChallengeApi();

const challenge = ref(null);
const refreshInterval = ref(null);

const refreshLeaderboard = async () => {
	if (!store.currentChallengeId) return;

	try {
		// Call the correct function: getLeaderboard
		const result = await getLeaderboard(store.currentChallengeId);
		// The leaderboard endpoint returns { challengeName, expiresAt, leaderboard }
		// We need to adjust how we store/display this
		challenge.value = result; // Store the whole response for now
	} catch (err) {
		console.error("Failed to refresh leaderboard:", err);
	}
};

// Auto-refresh every 30 seconds
onMounted(async () => {
	await refreshLeaderboard();
	refreshInterval.value = setInterval(refreshLeaderboard, 30000);
});

onBeforeUnmount(() => {
	if (refreshInterval.value) {
		clearInterval(refreshInterval.value);
	}
});

const formatDate = (dateStr) => {
	return new Date(dateStr).toLocaleString();
};

const closePopup = () => {
	emit("close");
};
</script>

<template>
  <Modal :is-open="true" @close="closePopup">
    <template #header>
      <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
        {{ challenge?.challengeName || $t('challengeMode') }} <!-- Use challengeName from response -->
      </h3>
    </template>

    <div v-if="isLoading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
    </div>

    <div v-else-if="error" class="text-red-500 text-center py-4">
      {{ error }}
    </div>

    <div v-else-if="challenge" class="mt-2">
      <!-- Display Game Mode and Expiration -->
      <div class="mb-4 text-sm text-gray-500 dark:text-gray-400 space-y-1">
         <p v-if="challenge.gameMode">
           <span class="font-semibold">{{ $t('gameModeLabel') || 'Mode' }}:</span>
           {{ $t(`gameModes.${challenge.gameMode}.name`, challenge.gameMode) }} <!-- Translate game mode name -->
         </p>
         <p v-if="challenge.expiresAt">
           <span class="font-semibold">{{ $t('challenge.expiresAt') || 'Expires' }}:</span>
           {{ formatDate(challenge.expiresAt) }}
         </p>
      </div>


      <!-- Leaderboard -->
      <div class="space-y-2">
        <!-- Header Row -->
        <div class="p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
          <div class="flex items-center gap-2 w-3/5"> <!-- Adjust width as needed -->
            <span>#</span>
            <span>{{ $t('leaderboard.name') || 'Name' }}</span>
          </div>
          <div class="w-1/5 text-right">{{ $t('leaderboard.streak') || 'Streak' }}</div> <!-- Adjust width and alignment -->
        </div>

        <!-- Iterate over challenge.leaderboard instead of challenge.participants -->
        <div v-for="(entry, index) in challenge.leaderboard"
             :key="entry.participantId"
             :class="{
               'bg-purple-100 dark:bg-purple-900': entry.participantId === store.currentParticipantId,
               'bg-gray-50 dark:bg-gray-800': entry.participantId !== store.currentParticipantId
             }"
             class="p-3 rounded-lg flex items-center justify-between"
        >
          <div class="flex items-center gap-2 w-3/5"> <!-- Match width with header -->
            <span class="font-bold w-6 text-right">{{ index + 1 }}.</span> <!-- Fixed width for rank -->
            <span class="truncate">{{ entry.displayName }}</span> <!-- Use entry.displayName, truncate if long -->
            <span v-if="entry.participantId === store.currentParticipantId"
                  class="text-xs text-purple-600 dark:text-purple-400 ml-1 flex-shrink-0"> <!-- Prevent shrinking -->
              ({{ $t('you') || 'You' }}) <!-- Add fallback for 'you' -->
            </span>
          </div>
          <!-- Display winningStreak instead of score -->
          <div class="font-bold w-1/5 text-right">{{ entry.winningStreak }}</div> <!-- Match width and alignment with header -->
        </div>
      </div>

      <div class="mt-4 flex justify-end space-x-2">
        <BaseButton variant="secondary" @click="refreshLeaderboard">
          {{ $t('refresh') }}
        </BaseButton>
        <BaseButton variant="primary" @click="closePopup">
          {{ $t('close') }}
        </BaseButton>
      </div>
    </div>
  </Modal>
</template>
