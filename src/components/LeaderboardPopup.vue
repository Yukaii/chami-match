<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useGameStore } from '../stores/game';
import { useChallengeApi } from '../composables/useChallengeApi';
import Modal from './Modal.vue';
import BaseButton from './base/BaseButton.vue';

const store = useGameStore();
const emit = defineEmits(['close']);
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
    console.error('Failed to refresh leaderboard:', err);
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
  emit('close');
};
</script>

<template>
  <Modal :is-open="true" @close="closePopup">
    <template #header>
      <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
        {{ challenge?.challengeName || $t('challengeMode') }} {/* Use challengeName from response */}
      </h3>
    </template>

    <div v-if="isLoading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
    </div>

    <div v-else-if="error" class="text-red-500 text-center py-4">
      {{ error }}
    </div>

    <div v-else-if="challenge" class="mt-2">
      <div v-if="challenge.expiresAt" class="mb-4"> {/* Conditionally show expiration */}
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ $t('challenge.expiresAt') }}: {{ formatDate(challenge.expiresAt) }}
        </p>
      </div>

      <!-- Leaderboard -->
      <div class="space-y-2">
        {/* Iterate over challenge.leaderboard instead of challenge.participants */}
        <div v-for="(entry, index) in challenge.leaderboard" 
             :key="entry.participantId"
             :class="{
               'bg-purple-100 dark:bg-purple-900': entry.participantId === store.currentParticipantId,
               'bg-gray-50 dark:bg-gray-800': entry.participantId !== store.currentParticipantId
             }"
             class="p-3 rounded-lg flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span class="font-bold">{{ index + 1 }}.</span>
            <span>{{ entry.displayName }}</span> {/* Use entry.displayName */}
            <span v-if="entry.participantId === store.currentParticipantId" 
                  class="text-xs text-purple-600 dark:text-purple-400">
              ({{ $t('you') || 'You' }}) {/* Add fallback for 'you' */}
            </span>
          </div>
          <div class="font-bold">{{ entry.score }}</div> {/* Use entry.score */}
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
