<template>
  <Modal size="medium" :is-open="settingsPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-gray-900 dark:text-white">{{ $t('settings.title') }}</div>

    <!-- UI Options -->
    <div class="mb-4">
      <div class="mb-2 text-xl font-bold text-pink-600 dark:text-pink-400">{{ $t('settings.UIOptions') }}</div>
      <hr class="mb-4 border-gray-400" />

      <!-- Dark Mode - NEW -->
      <div class="mb-4">
        <label class="mb-2 block font-bold text-gray-900 dark:text-white">{{ $t('settings.theme.title') }}</label>
        <div class="flex space-x-2">
          <BaseButton
            v-for="theme in ['system', 'dark', 'light']"
            :key="theme"
            :variant="currentTheme === theme ? 'primary' : 'secondary'"
            size="sm"
            is3d
            class="flex items-center gap-2"
            @click="setTheme(theme)"
          >
            <ph-device-mobile v-if="theme === 'system'" size="18" />
            <ph-moon v-else-if="theme === 'dark'" size="18" />
            <ph-sun v-else size="18" />
            {{ $t(`settings.theme.${theme}`) }}
          </BaseButton>
        </div>
      </div>

      <!-- Language -->
      <div class="mb-4">
        <label class="mb-2 block font-bold text-gray-900 dark:text-white">{{ $t('settings.language') }}</label>
        <div class="flex space-x-2">
          <BaseButton
            v-for="lang in languages"
            :key="lang.code"
            :variant="settings.language === lang.code ? 'primary' : 'secondary'"
            size="sm"
            is3d
            @click="handleChangeLanguage(lang.code)"
          >
            {{ lang.label }}
          </BaseButton>
        </div>
      </div>

      <!-- Confetti Effect -->
      <div class="mb-4">
        <label class="mb-2 block font-bold text-gray-900 dark:text-white">{{ $t('settings.confetti.label') }}</label>
        <div class="flex space-x-2">
          <BaseButton
            v-for="value in [true, false]"
            :key="value.toString()"
            :variant="settings.enableConfetti === value ? 'primary' : 'secondary'"
            size="sm"
            is3d
            @click="settings.enableConfetti = value"
          >
            {{ value ? $t('settings.confetti.on') : $t('settings.confetti.off') }}
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Game Options - Only shown in game mode -->
    <div v-if="state.settingsMode === 'game'">
      <div class="mb-2 text-xl font-bold text-gray-900 dark:text-white">{{ $t('settings.gameOptions') }}</div>
      <hr class="mb-4 border-gray-400" />

      <!-- Precision - Only shown when NOT in contextual mode -->
      <div v-if="state.gameType.value !== 'contextual'" class="mb-4">
        <label class="mb-2 block font-bold text-gray-900 dark:text-white">{{ $t('settings.precision.label') }}</label>
        <div class="flex space-x-2">
          <BaseButton
            v-for="value in [3, 5, 10, 20, 30]"
            :key="value"
            :variant="settings.precision === value ? 'primary' : 'secondary'"
            size="sm"
            is3d
            @click="settings.precision = value"
          >
            {{ value }}
          </BaseButton>
        </div>
      </div>

      <!-- Color Mode -->
      <div class="mb-4">
        <label class="mb-2 block font-bold text-gray-900 dark:text-white">{{ $t('settings.colorMode.label') }}</label>
        <div class="flex space-x-2">
          <BaseButton
            v-for="value in ['Color', 'B/W']"
            :key="value"
            :variant="settings.mode === value ? 'primary' : 'secondary'"
            size="sm"
            is3d
            @click="settings.mode = value"
          >
            {{ value }}
          </BaseButton>
        </div>
      </div>

      <!-- Max Tries -->
      <div v-if="state.gameType.value !== 'contextual'" class="mb-4">
        <label class="mb-2 block font-bold text-gray-900 dark:text-white">{{ $t('settings.maxTries.label') }}</label>
        <div class="flex space-x-2">
          <BaseButton
            v-for="value in [3, 5, 10]"
            :key="value"
            :variant="settings.maxTries === value ? 'primary' : 'secondary'"
            size="sm"
            is3d
            @click="settings.maxTries = value"
          >
            {{ value }}
          </BaseButton>
        </div>
      </div>

      <!-- Realtime Preview -->
      <div class="mb-4">
        <label class="mb-2 block font-bold text-gray-900 dark:text-white">{{ $t('settings.realtimePreview.label') }}</label>
        <div class="flex space-x-2">
          <BaseButton
            v-for="value in [true, false]"
            :key="value.toString()"
            :variant="settings.realtimePreview === value ? 'primary' : 'secondary'"
            size="sm"
            is3d
            @click="settings.realtimePreview = value"
          >
            {{ value ? 'On' : 'Off' }}
          </BaseButton>
        </div>
      </div>

      <div class="mb-2 rounded-lg bg-gray-800 px-4 py-2 text-sm">{{ $t('settings.notice') }}</div>
      <BaseButton
        variant="primary"
        fullWidth
        is3d
        @click="onApply"
      >
        {{ $t('settings.cta') }}
      </BaseButton>
    </div>

    <div class="mb-4 mt-6">
      <div class="mb-2 text-xl font-bold text-pink-600 dark:text-pink-400">{{ $t('settings.danger') }}</div>
      <hr class="mb-4 border-gray-400" />

      <p class="mb-2 text-gray-900 dark:text-white">{{ $t('settings.confirmReset') }}</p>

      <BaseButton
        variant="danger"
        fullWidth
        is3d
        @click="state.toggleResetPopup(true)"
      >
        {{ $t('settings.resetGameData') }}
      </BaseButton>
    </div>
  </Modal>
</template>

<script setup>
import { PhDeviceMobile, PhMoon, PhSun } from "@phosphor-icons/vue";
import { onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useGlobalGameState } from "../gameState";
import BaseButton from "./base/BaseButton.vue";

const { locale, t: $t } = useI18n();
const state = useGlobalGameState();
const settingsPopupOpen = state.settingsPopupOpen;
const languages = [
	{ code: "zh-TW", label: "繁體中文" },
	{ code: "en", label: "English" },
	{ code: "ja", label: "日本語" },
];
const settings = reactive({
	language: localStorage.getItem("lang") || navigator.language || "zh-TW",
	precision: state.precision.value,
	mode: state.mode.value,
	maxTries: state.maxLife.value,
	realtimePreview: state.realtimePreview.value,
	enableConfetti: true, // Default to enabled
});

// Theme handling
const currentTheme = ref(localStorage.getItem("theme") || "system");

function setTheme(theme) {
	currentTheme.value = theme;

	if (theme === "system") {
		document.documentElement.classList.remove("dark", "light");

		// Apply dark theme if system prefers dark
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			document.documentElement.classList.add("dark");
		}
	} else if (theme === "dark") {
		document.documentElement.classList.add("dark");
		document.documentElement.classList.remove("light");
	} else {
		document.documentElement.classList.remove("dark");
		document.documentElement.classList.add("light");
	}

	localStorage.setItem("theme", theme);
}

const onClose = () => {
	state.toggleSettingsPopup(false);
};

watch(state.settingsPopupOpen, () => {
	if (state.settingsPopupOpen) {
		settings.precision = state.precision.value;
		settings.mode = state.mode.value;
		settings.maxTries = state.maxLife.value;
		settings.realtimePreview = state.realtimePreview.value;
		settings.enableConfetti = state.preferences?.value?.enableConfetti ?? true;
	}
});

const onApply = () => {
	state.updatePrecision(settings.precision);
	state.updateMode(settings.mode);
	state.updateMaxLife(settings.maxTries);
	state.updateRealtimePreview(settings.realtimePreview);
	state.updateConfetti(settings.enableConfetti);
	state.startOver();
	onClose();
};

const handleChangeLanguage = (lang) => {
	settings.language = lang;
	locale.value = lang;
	localStorage.setItem("lang", lang);

	// Also save confetti setting when changing language
	state.updateConfetti(settings.enableConfetti);
};
</script>
