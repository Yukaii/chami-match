<template>
  <BaseTooltip position="bottom">
    <BaseButton
      variant="outline"
      size="sm"
      @click="toggleTheme"
    >
      <PhMoon v-if="isDarkMode" :size="20" />
      <PhSun v-else :size="20" />
    </BaseButton>
    <template #tooltip>
      {{ isDarkMode ? $t('settings.theme.light') : $t('settings.theme.dark') }}
    </template>
  </BaseTooltip>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { PhSun, PhMoon } from '@phosphor-icons/vue';
import BaseTooltip from './base/BaseTooltip.vue';
import BaseButton from './base/BaseButton.vue';

const isDarkMode = ref(false);

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value;

  if (isDarkMode.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
};

onMounted(() => {
  // Check for saved theme preference or prefer-color-scheme
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  isDarkMode.value = savedTheme === 'dark' || (savedTheme !== 'light' && prefersDark);

  if (isDarkMode.value) {
    document.documentElement.classList.add('dark');
  }
});
</script>
