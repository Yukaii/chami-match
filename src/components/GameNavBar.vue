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
    router.push({ name: 'ChallengeLeaderboard', params: { id: store.currentChallengeId } });
  }
}
</script>

<template>
  <div class="flex w-full justify-between items-center">
    <BaseButton variant="secondary" size="sm" @click="goToHome">
      <span class="mr-1 text-lg">←</span> {{ $t('home') }}
    </BaseButton>

    <!-- Challenge Mode Indicator -->
    <div v-if="store.currentChallengeId" class="text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-400 dark:border-purple-500 rounded px-2 py-0.5">
      Challenge Mode
    </div>

    <!-- View Leaderboard Button (only in challenge mode) -->
     <BaseButton v-if="store.currentChallengeId" variant="info" size="sm" @click="viewLeaderboard">
       {{ $t('viewLeaderboard') }} <!-- Add translation -->
     </BaseButton>

    <BaseButton variant="secondary" size="sm" @click="startOver">
      {{ $t('startOver') }}
    </BaseButton>
  </div>
</template>
