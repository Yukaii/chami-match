<script setup>
import { useRoute } from "vue-router";
import ChallengeLeaderboard from "../../components/ChallengeLeaderboard.vue";
import BaseButton from "../../components/base/BaseButton.vue"; // For back button

const route = useRoute();
const challengeId = route.params.id;
</script>

<template>
  <div class="p-4 max-w-2xl mx-auto">
     <div class="mb-4">
        <router-link to="/">
            <BaseButton variant="outline" size="sm">
                &larr; Back to Home
            </BaseButton>
        </router-link>
     </div>
    <ChallengeLeaderboard v-if="challengeId" :challenge-id="challengeId" />
    <div v-else class="text-center text-red-500">
        Invalid Challenge ID provided.
    </div>
  </div>
</template>
