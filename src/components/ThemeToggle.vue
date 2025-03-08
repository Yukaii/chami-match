<template>
  <BaseTooltip position="bottom">
    <BaseButton
      variant="outline"
      size="sm"
      @click="toggleTheme"
    >
      <PhDeviceMobile v-if="currentTheme === 'system'" :size="20" />
      <PhMoon v-else-if="currentTheme === 'dark'" :size="20" />
      <PhSun v-else :size="20" />
    </BaseButton>
    <template #tooltip>
      {{ themeTooltipText }}
    </template>
  </BaseTooltip>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { PhSun, PhMoon, PhDeviceMobile } from '@phosphor-icons/vue';
import BaseTooltip from './base/BaseTooltip.vue';
import BaseButton from './base/BaseButton.vue';

const currentTheme = ref('system');

const themeTooltipText = computed(() => {
  switch (currentTheme.value) {
    case 'system': return $t('settings.theme.system');
    case 'dark': return $t('settings.theme.light');
    case 'light': return $t('settings.theme.dark');
  }
});

const applyTheme = (theme) => {
  if (theme === 'system') {
    // Remove any theme class to respect system preference
    document.documentElement.classList.remove('dark', 'light');
    localStorage.setItem('theme', 'system');

    // Check system preference to set UI appropriately
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  } else if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.setItem('theme', 'light');
  }
};

const toggleTheme = () => {
  // Cycle through: system -> dark -> light -> system
  if (currentTheme.value === 'system') {
    currentTheme.value = 'dark';
  } else if (currentTheme.value === 'dark') {
    currentTheme.value = 'light';
  } else {
    currentTheme.value = 'system';
  }

  applyTheme(currentTheme.value);
};

onMounted(() => {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme && ['system', 'dark', 'light'].includes(savedTheme)) {
    currentTheme.value = savedTheme;
  } else {
    // Default to system theme if no preference is saved
    currentTheme.value = 'system';
  }

  // Apply the theme
  applyTheme(currentTheme.value);

  // Listen for system preference changes when in system mode
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (currentTheme.value === 'system') {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  });
});
</script>
