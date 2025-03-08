<script setup>
import { useRouter } from "vue-router";
import { useGlobalGameState } from "../gameState";
import BaseButton from "./base/BaseButton.vue";

const state = useGlobalGameState();
const router = useRouter();

function startStandardGame() {
	state.updateGameType("standard");
	state.startOver(); // Initialize a new game
	router.push("/game");
}

function startContextualGame() {
	state.updateGameType("contextual");
	state.startOver(); // Initialize a new game
	router.push("/context-game");
}

function startRelativeGame() {
	state.updateGameType("relative");
	state.startOver(); // Initialize a new game
	router.push("/relative-game");
}

function openSettings() {
	state.settingsMode = "global";
	state.toggleSettingsPopup();
}
</script>

<template>
  <div class="flex size-full flex-col items-center justify-center gap-6 p-4">
    <div class="text-center">
      <h1 class="mb-2 text-4xl font-bold text-pink-600 dark:text-orange-300">{{ $t('title') }}</h1>
      <p class="text-lg text-gray-600 dark:text-gray-200">{{ $t('description') }}</p>
    </div>

    <div class="flex w-full max-w-md flex-col gap-4">
      <BaseButton
        variant="primary"
        is3d
        size="lg"
        full-width
        class-name="bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 border-b-4 border-green-700 dark:border-green-800"
        @click="startStandardGame"
      >
        {{ $t('startStandardGame') }}
      </BaseButton>

      <BaseButton
        variant="primary"
        is3d
        size="lg"
        full-width
        class-name="bg-purple-500 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-700 border-b-4 border-purple-700 dark:border-purple-800"
        @click="startContextualGame"
      >
        {{ $t('startContextualGame') }}
      </BaseButton>

      <BaseButton
        variant="primary"
        is3d
        size="lg"
        full-width
        class-name="bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 border-b-4 border-blue-700 dark:border-blue-800"
        @click="startRelativeGame"
      >
        {{ $t('startRelativeGame') }}
      </BaseButton>

      <div class="mt-4">
        <BaseButton
          variant="secondary"
          full-width
          @click="openSettings"
        >
          {{ $t('settings.title') }}
        </BaseButton>
      </div>

      <BaseButton
        variant="secondary"
        full-width
        @click="state.toggleAboutPopup()"
      >
        {{ $t('about.title') }}
      </BaseButton>
    </div>
  </div>
</template>
