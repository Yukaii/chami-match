<script setup>
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
</script>

<template>
  <div class="flex size-full flex-col items-center justify-center gap-6 p-4">
    <div class="text-center">
      <h1 class="mb-2 text-4xl font-bold text-orange-300">{{ $t('title') }}</h1>
      <p class="text-lg text-gray-200">{{ $t('description') }}</p>
    </div>

    <div class="flex w-full max-w-md flex-col gap-4">
      <button
        class="button-3d rounded-lg bg-pink-600 px-6 py-3 text-xl text-white"
        @click="state.startGame"
      >
        {{ $t('startGame') }}
      </button>

      <!-- Placeholder for future game modes -->
      <!-- <button class="button-3d rounded-lg bg-purple-600 px-6 py-3 text-xl text-white">
        {{ $t('otherMode') }}
      </button> -->

      <button
        class="mt-4 rounded-lg bg-gray-700 px-6 py-2 text-white"
        @click="state.toggleSettingsPopup()"
      >
        {{ $t('settings.title') }}
      </button>

      <button
        class="rounded-lg bg-gray-700 px-6 py-2 text-white"
        @click="state.toggleAboutPopup()"
      >
        {{ $t('about.title') }}
      </button>
    </div>
  </div>
</template>
