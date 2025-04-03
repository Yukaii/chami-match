<script setup>
import { useRouter } from "vue-router";
import { useGameStore } from "../stores/game";
import BaseButton from "./base/BaseButton.vue";

const router = useRouter();
const store = useGameStore();
const emit = defineEmits(["startOver"]);

function goToHome() {
  router.push("/");
}

function startOver() {
  // Use the Pinia store to reset
  store.startOver();

  // Still emit event for backward compatibility
  emit("startOver");
}

function viewLeaderboard() {
  if (store.currentChallengeId) {
    // router.push({ name: 'ChallengeLeaderboard', params: { id: store.currentChallengeId } }); // No longer navigate
    store.toggleLeaderboardPopup(); // Toggle the popup instead
  }
}

function startChallenge() {
  store.toggleCreateChallengePopup();
}
</script>

<template>
  <div class="flex w-full justify-between items-center">
    <BaseButton variant="secondary" size="sm" @click="goToHome">
      <span class="mr-1 text-lg">←</span> {{ $t('home') }}
    </BaseButton>

    <!-- Challenge buttons and indicators -->
      <div class="flex items-center gap-2">
      <!-- Challenge Mode Indicator -->
      <div v-if="store.currentChallengeId && store.isServerAvailable" class="text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-400 dark:border-purple-500 rounded px-2 py-0.5">
        {{ $t('challengeMode') }}
      </div>

      <!-- View Leaderboard Button (only in challenge mode and when server is available) -->
      <BaseButton v-if="store.currentChallengeId && store.isServerAvailable" variant="info" size="sm" @click="viewLeaderboard">
        {{ $t('viewLeaderboard') }}
      </BaseButton>

      <!-- Create Challenge Button (not in challenge mode and when server is available) -->
      <BaseButton v-if="!store.currentChallengeId && store.isServerAvailable" variant="secondary" size="sm" @click="startChallenge">
        {{ $t('challengeFriends') }}
      </BaseButton>

      <!-- Server Unavailable Warning -->
      <div v-if="!store.isServerAvailable" class="text-xs text-red-500 dark:text-red-400">
        Server unavailable
      </div>
    </div>

    <BaseButton variant="secondary" size="sm" @click="startOver">
      {{ $t('startOver') }}
    </BaseButton>
  </div>
</template>
