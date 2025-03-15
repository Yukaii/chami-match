<script setup>
import { useRouter } from "vue-router";
import { useGameStore } from "../stores/game";
import BaseButton from "./base/BaseButton.vue";

const store = useGameStore();
const router = useRouter();

function startStandardGame() {
	store.updateGameType("standard");
	store.startOver(); // Initialize a new game
	router.push("/game");
}

function startContextualGame() {
	store.updateGameType("contextual");
	store.startOver(); // Initialize a new game
	router.push("/context-game");
}

function startRelativeGame() {
	store.updateGameType("relative");
	store.startOver(); // Initialize a new game
	router.push("/relative-game");
}

function startColorGame() {
	store.updateGameType("image");
	store.startOver(); // Initialize a new game
	router.push("/color-game");
}

function openSettings() {
	store.settingsMode = "global";
	store.toggleSettingsPopup();
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
        :override-styles="true"
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
        :override-styles="true"
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
        :override-styles="true"
        @click="startRelativeGame"
      >
        {{ $t('startRelativeGame') }}
      </BaseButton>

      <BaseButton
        variant="primary"
        is3d
        size="lg"
        full-width
        class-name="bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700 border-b-4 border-amber-700 dark:border-amber-800"
        :override-styles="true"
        @click="startColorGame"
      >
        {{ $t('startColorGame') }}
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
        @click="store.toggleAboutPopup()"
      >
        {{ $t('about.title') }}
      </BaseButton>
    </div>
  </div>
</template>
