<template>
  <Modal :is-open="store.aboutPopupOpen" size="medium" @on-close="onClose">
    <div class="mb-6 text-center text-xl font-bold text-pink-600 dark:text-pink-400">
      {{ $t('about.title') }}
    </div>

    <div class="toy-panel mb-6">
      <p class="mb-4">
        <i18n-t keypath="about.text1">
          <template #colorTest>
            <a
              class="text-blue-500 underline transition-colors hover:text-blue-700"
              href="https://dream7fragment.itch.io/color-test"
              target="_blank"
              rel="noopener noreferrer"
              >color-test</a
            >
          </template>
          <template #fragment>
            <a
              class="text-blue-500 underline transition-colors hover:text-blue-700"
              href="https://www.facebook.com/Dream7Fragment"
              target="_blank"
              rel="noopener noreferrer"
              >Fragment</a
            >
          </template>
        </i18n-t>
      </p>
      <p>
        <i18n-t keypath="about.text2">
          <template #githubRepo>
            <a
              class="inline-flex items-center gap-1 text-blue-500 underline transition-colors hover:text-blue-700"
              href="https://github.com/Yukaii/chami-match"
              target="_blank"
              rel="noopener noreferrer"
              ><ph-github-logo :size="20" class="inline" />{{ $t('about.repository') }}</a
            >
          </template>
        </i18n-t>
      </p>
    </div>

    <!-- Developer Credits -->
    <div class="toy-panel mb-6">
      <div class="mb-2 text-xl font-bold text-pink-600 dark:text-pink-400">{{ $t('about.developerCredits') }}</div>
      <hr class="mb-4 border-gray-300 dark:border-gray-600" />
      <p class="mb-2">{{ $t('about.developerText') }}</p>
      <ul class="list-inside list-disc space-y-2 text-pink-500 dark:text-pink-400">
        <li class="transition-transform hover:translate-x-1">
          <a class="text-blue-500 underline transition-colors hover:text-blue-700" href="https://github.com/Yukaii" target="_blank" rel="noopener noreferrer"
            >Yukai</a
          >
        </li>
        <li class="transition-transform hover:translate-x-1">
          <a
            class="text-blue-500 underline transition-colors hover:text-blue-700"
            href="https://github.com/alan10332000"
            target="_blank"
            rel="noopener noreferrer"
            >Alan</a
          >
        </li>
      </ul>
    </div>

    <div class="flex w-full justify-center gap-4">
      <BaseButton
        variant="primary"
        is3d
        size="lg"
        @click="shareWebsite"
      >
        <div class="flex items-center gap-1">
          <ph-share-network :size="20" />
          {{ $t('about.share') }}
        </div>
      </BaseButton>
      <BaseButton
        variant="secondary"
        is3d
        size="lg"
        @click="onClose"
      >
        {{ $t('about.close') }}
      </BaseButton>
    </div>
  </Modal>
</template>

<script setup>
import { useGameStore } from "../stores/game";
import BaseButton from "./base/BaseButton.vue";

const store = useGameStore();

const onClose = () => {
	store.toggleAboutPopup();
};

const shareWebsite = async () => {
	const url = window.location.origin;

	if (navigator.share) {
		try {
			await navigator.share({
				title: "Chami Match",
				url: url,
			});
		} catch (error) {
			console.error("Error sharing:", error);
		}
	} else {
		// Fallback to clipboard
		try {
			await navigator.clipboard.writeText(url);
			alert("URL copied to clipboard!");
		} catch (error) {
			console.error("Failed to copy:", error);
			// Ultimate fallback - show URL to manually copy
			prompt("Copy this URL:", url);
		}
	}
};
</script>
