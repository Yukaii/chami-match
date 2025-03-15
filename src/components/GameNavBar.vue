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
</script>

<template>
  <div class="flex w-full justify-between">
    <BaseButton variant="secondary" size="sm" @click="goToHome">
      <span class="mr-1 text-lg">←</span> {{ $t('home') }}
    </BaseButton>
    <BaseButton variant="secondary" size="sm" @click="startOver">
      {{ $t('startOver') }}
    </BaseButton>
  </div>
</template>
