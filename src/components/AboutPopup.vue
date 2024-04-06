<template>
  <Modal :is-open="aboutPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-white">{{ $t('about.title') }}</div>

    <p class="mb-2">
      <i18n-t keypath="about.text1">
        <template #colorTest>
          <a
            class="text-blue-500 underline"
            href="https://dream7fragment.itch.io/color-test"
            target="_blank"
            rel="noopener noreferrer"
            >color-test</a
          >
        </template>
        <template #fragment>
          <a
            class="text-blue-500 underline"
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
            class="text-blue-500 underline"
            href="https://github.com/Yukaii/chami-match"
            target="_blank"
            rel="noopener noreferrer"
            ><ph-github-logo :size="20" class="inline" />{{ $t('about.repository') }}</a
          >
        </template>
      </i18n-t>
    </p>

    <div class="flex w-full justify-center">
      <button class="button-3d mt-4 rounded-lg bg-pink-600 px-4 py-2 text-white" @click="onClose">
        {{ $t('about.close') }}
      </button>
    </div>
  </Modal>
</template>

<script setup>
import { PhGithubLogo } from '@phosphor-icons/vue'
import { useGlobalGameState } from '../gameState'

const state = useGlobalGameState()
const aboutPopupOpen = state.aboutPopupOpen

const onClose = () => {
  state.toggleAboutPopup(false)
}
</script>
