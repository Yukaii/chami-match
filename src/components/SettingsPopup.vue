<template>
  <Modal size="medium" :is-open="store.settingsPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-gray-900 dark:text-white">{{ $t('settings.title') }}</div>

<!-- Server Settings -->
<div class="mb-4">
<div class="mb-2 text-xl font-bold text-pink-600 dark:text-pink-400">{{ $t('settings.serverSettings') }}</div>
<hr class="mb-4 border-gray-400" />

<!-- Challenge Server URL -->
<div class="mb-4">
  <BaseInput
    id="serverUrl"
    v-model="settings.serverUrl"
    :label="$t('settings.serverUrl')"
    :placeholder="defaultServerUrl"
    is3d
  >
    <template #suffix>
      <BaseButton
        variant="secondary"
        size="sm"
        is3d
        class="flex items-center gap-1"
        @click="resetServerUrl"
      >
        <ph-arrow-counter-clockwise size="18" />
        {{ $t('settings.resetToDefault') }}
      </BaseButton>
    </template>
  </BaseInput>
  <div v-if="store.isServerAvailable" class="mt-1 text-sm text-green-600 dark:text-green-400">
    {{ $t('settings.serverStatus.available') }}
  </div>
  <div v-else class="mt-1 text-sm text-red-600 dark:text-red-400">
    {{ $t('settings.serverStatus.unavailable') }}
  </div>
</div>
</div>

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

      <!-- Display Name -->
      <div class="mb-4">
        <BaseInput
          id="displayName"
          v-model="settings.displayName"
          :label="$t('settings.displayName')"
          :maxLength="50"
          is3d
        />
      </div>

    </div>

    <!-- Game Options - Only shown in game mode -->
    <div v-if="store.settingsMode === 'game'">
      <div class="mb-2 text-xl font-bold text-gray-900 dark:text-white">{{ $t('settings.gameOptions') }}</div>
      <hr class="mb-4 border-gray-400" />

      <!-- Precision - Only shown when NOT in contextual mode or image mode -->
      <div v-if="isBasicGameType" class="mb-4">
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

      <!-- Color Mode - Not shown in image mode -->
      <div v-if="isNotImageMode" class="mb-4">
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

      <!-- Color Space - Only shown in standard mode -->
      <div v-if="store.gameType === 'standard'" class="mb-4">
        <label class="mb-2 block font-bold text-gray-900 dark:text-white">{{ $t('settings.colorSpace.label') || 'Color Space' }}</label>
        <div class="flex space-x-2">
          <BaseButton
            v-for="value in ['hsv', 'rgb', 'oklab']"
            :key="value"
            :variant="settings.colorSpace === value ? 'primary' : 'secondary'"
            size="sm"
            is3d
            @click="settings.colorSpace = value"
          >
            {{ value.toUpperCase() }}
          </BaseButton>
        </div>
      </div>

      <!-- Max Tries -->
      <div v-if="isBasicGameType" class="mb-4">
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
      <div v-if="isBasicGameType" class="mb-4">
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

      <!-- Recall Timeout - Only shown when in recall mode -->
      <div v-if="store.gameType === 'recall'" class="mb-4">
        <label class="mb-2 block font-bold text-gray-900 dark:text-white">{{ $t('settings.recallTimeout.label') }}</label>
        <div class="flex space-x-2">
          <BaseButton
            v-for="value in [3, 5, 10]"
            :key="value"
            :variant="settings.recallTimeout === value ? 'primary' : 'secondary'"
            size="sm"
            is3d
            @click="settings.recallTimeout = value"
          >
            {{ value }}s
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
import {
  PhArrowCounterClockwise,
  PhDeviceMobile,
  PhMoon,
  PhSun,
} from "@phosphor-icons/vue";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useGameStore } from "../stores/game";
import BaseButton from "./base/BaseButton.vue";
import BaseInput from "./base/BaseInput.vue";

const { locale, t: $t } = useI18n();
const store = useGameStore();
const defaultServerUrl =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8787"; // Use correct env var
const languages = [
  { code: "zh-TW", label: "繁體中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
];

// Computed properties for game type conditions
const isBasicGameType = computed(
  () =>
    store.gameType !== "image" &&
    store.gameType !== "contextual" &&
    store.gameType !== "recall",
);

const isNotImageMode = computed(() => store.gameType !== "image");

const settings = reactive({
  language: localStorage.getItem("lang") || navigator.language || "zh-TW",
  precision: store.precision,
  mode: store.mode,
  colorSpace: store.colorSpace,
  maxTries: store.maxLife,
  realtimePreview: store.realtimePreview,
  enableConfetti: store.preferences.enableConfetti || true,
  recallTimeout: store.recallTimeout,
  displayName: store.preferences.displayName || "Player",
  serverUrl: store.challengeServerUrl, // Add server URL
});

const resetServerUrl = () => {
  settings.serverUrl = defaultServerUrl;
};

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
  // Save display name when closing, regardless of mode
  // Save server URL and display name when closing, regardless of mode
  store.updateChallengeServerUrl(settings.serverUrl); // Save server URL
  store.updateDisplayName(settings.displayName);
  store.toggleSettingsPopup();
};

// Fix: Watch the store property directly
watch(
  () => store.settingsPopupOpen,
  (isOpen) => {
    if (isOpen) {
      settings.precision = store.precision;
      settings.mode = store.mode;
      settings.colorSpace = store.colorSpace;
      settings.maxTries = store.maxLife;
      settings.realtimePreview = store.realtimePreview;
      settings.enableConfetti = store.preferences.enableConfetti ?? true;
      settings.recallTimeout = store.recallTimeout;
      settings.displayName = store.preferences.displayName || "Player"; // Sync display name
      settings.serverUrl = store.challengeServerUrl; // Sync server URL
    }
  },
);

const onApply = async () => {
  // Update server URL and check availability first
  await store.updateChallengeServerUrl(settings.serverUrl);

  // Update other settings
  store.updatePrecision(settings.precision);
  store.updateMode(settings.mode);
  store.updateColorSpace(settings.colorSpace);
  store.updateMaxLife(settings.maxTries);
  store.updateRealtimePreview(settings.realtimePreview);
  store.updateConfetti(settings.enableConfetti);
  store.updateRecallTimeout(settings.recallTimeout);
  store.updateDisplayName(settings.displayName);
  store.startOver();
  onClose();
};

const handleChangeLanguage = (lang) => {
  settings.language = lang;
  locale.value = lang;
  localStorage.setItem("lang", lang);

  // Also save confetti and display name setting when changing language
  store.updateConfetti(settings.enableConfetti);
  store.updateDisplayName(settings.displayName);
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
