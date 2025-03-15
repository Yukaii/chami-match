<template>
  <Modal size="medium" :is-open="store.settingsPopupOpen" @on-close="onClose">
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
    <div v-if="store.settingsMode === 'game'">
      <div class="mb-2 text-xl font-bold text-gray-900 dark:text-white">{{ $t('settings.gameOptions') }}</div>
      <hr class="mb-4 border-gray-400" />

      <!-- Precision - Only shown when NOT in contextual mode -->
      <div v-if="store.gameType.value !== 'contextual'" class="mb-4">
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
      <div v-if="store.gameType.value !== 'contextual'" class="mb-4">
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

      <div class="mb-2 rounded-lg px-4 py-2 text-sm">{{ $t('settings.notice') }}</div>
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
        @click="store.toggleResetPopup(true)"
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
import { useGameStore } from "../stores/game";
import BaseButton from "./base/BaseButton.vue";

const { locale, t: $t } = useI18n();
const store = useGameStore();
const languages = [
	{ code: "zh-TW", label: "繁體中文" },
	{ code: "en", label: "English" },
	{ code: "ja", label: "日本語" },
];
const settings = reactive({
	language: localStorage.getItem("lang") || navigator.language || "zh-TW",
	precision: store.precision,
	mode: store.mode,
	maxTries: store.maxLife,
	realtimePreview: store.realtimePreview,
	enableConfetti: store.preferences.enableConfetti || true,
});

// Theme handling
const currentTheme = ref(localStorage.getItem("theme") || "system");

const applyTheme = (theme) => {
	if (theme === "system") {
		// Remove any theme class to respect system preference
		document.documentElement.classList.remove("dark", "light");
		localStorage.setItem("theme", "system");

		// Check system preference to set UI appropriately
		if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			document.documentElement.classList.add("dark");
		}
	} else if (theme === "dark") {
		document.documentElement.classList.add("dark");
		document.documentElement.classList.remove("light");
		localStorage.setItem("theme", "dark");
	} else {
		document.documentElement.classList.remove("dark");
		document.documentElement.classList.add("light");
		localStorage.setItem("theme", "light");
	}
};

function setTheme(theme) {
	currentTheme.value = theme;

	applyTheme(theme);
}

const onClose = () => {
	store.toggleSettingsPopup();
};

// Fix: Watch the store property directly
watch(
	() => store.settingsPopupOpen,
	(isOpen) => {
		if (isOpen) {
			settings.precision = store.precision;
			settings.mode = store.mode;
			settings.maxTries = store.maxLife;
			settings.realtimePreview = store.realtimePreview;
			settings.enableConfetti = store.preferences.enableConfetti ?? true;
		}
	},
);

const onApply = () => {
	store.updatePrecision(settings.precision);
	store.updateMode(settings.mode);
	store.updateMaxLife(settings.maxTries);
	store.updateRealtimePreview(settings.realtimePreview);
	store.updateConfetti(settings.enableConfetti);
	store.startOver();
	onClose();
};

const handleChangeLanguage = (lang) => {
	settings.language = lang;
	locale.value = lang;
	localStorage.setItem("lang", lang);

	// Also save confetti setting when changing language
	store.updateConfetti(settings.enableConfetti);
};

onMounted(() => {
	// Ensure currentTheme.value has a valid value
	if (!["system", "dark", "light"].includes(currentTheme.value)) {
		currentTheme.value = "system";
	}

	// Apply the theme
	applyTheme(currentTheme.value);

	// Listen for system preference changes when in system mode
	window
		.matchMedia("(prefers-color-scheme: dark)")
		.addEventListener("change", (e) => {
			if (currentTheme.value === "system") {
				if (e.matches) {
					document.documentElement.classList.add("dark");
				} else {
					document.documentElement.classList.remove("dark");
				}
			}
		});
});
</script>
