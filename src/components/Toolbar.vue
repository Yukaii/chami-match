<template>
  <div class="flex w-full justify-between space-x-4">
    <div class="flex gap-2">
      <slot name="left">
        <BaseTooltip>
          <BaseButton
            variant="primary"
            size="sm"
            class-name="cursor-default pointer-events-none"
            :is3d="false"
          >
            <ph-arrows-clockwise :size="20" />
            <span class="ml-2">{{ store.currentRound }}</span>
          </BaseButton>
          <template #tooltip>{{ $t('roundCount') }}</template>
        </BaseTooltip>

        <BaseTooltip>
          <BaseButton
            variant="primary"
            size="sm"
            class-name="cursor-default pointer-events-none"
            :is3d="false"
            :class="className"
          >
            <ph-hand-fist :size="20" />
            <span class="ml-2">{{ store.winningStreak }}</span>
          </BaseButton>
          <template #tooltip>{{ $t('comboCount') }}</template>
        </BaseTooltip>

        <BaseTooltip>
          <BaseButton
            variant="primary"
            size="sm"
            class-name="cursor-default pointer-events-none"
            :is3d="false"
          >
            <ph-chart-line :size="20" />
            <span class="ml-2">{{ store.winRate }}</span>
          </BaseButton>
          <template #tooltip>{{ $t('winningRate') }}</template>
        </BaseTooltip>
      </slot>
    </div>

    <div class="flex gap-2">
      <slot name="right">
        <BaseTooltip>
          <BaseButton variant="primary" size="sm" @click="store.toggleRecordPopup()">
            <ph-clock-counter-clockwise :size="20" />
          </BaseButton>
          <template #tooltip>{{ $t('gameRecord.title') }}</template>
        </BaseTooltip>

        <BaseTooltip>
          <BaseButton variant="primary" size="sm" @click="openSettings">
            <ph-gear-six :size="20" />
          </BaseButton>
          <template #tooltip>{{ $t('settings.title') }}</template>
        </BaseTooltip>

        <BaseTooltip>
          <BaseButton variant="primary" size="sm" @click="store.toggleAboutPopup()">
            <ph-question :size="20" />
          </BaseButton>
          <template #tooltip>{{ $t('about.title') }}</template>
        </BaseTooltip>
      </slot>
    </div>
  </div>
</template>

<script setup>
import {
	PhArrowsClockwise,
	PhChartLine,
	PhClockCounterClockwise,
	PhGearSix,
	PhHandFist,
	PhQuestion,
} from "@phosphor-icons/vue";
import { ref, computed, watch } from "vue";
import { useGameStore } from "../stores/game";
import { cn } from "../utils/index";

import BaseButton from "./base/BaseButton.vue";
import BaseTooltip from "./base/BaseTooltip.vue";

const store = useGameStore();

function openSettings() {
	store.settingsMode = "game";
	store.toggleSettingsPopup();
}

const isShaking = ref(false);
const isFlipping = ref(false);

// Fix: Watch the store getters directly with proper function
watch(
	() => [store.winningStreak, store.currentRound],
	([count, round], [prevCount, prevRound]) => {
		if (round === 1) {
			// round reset
			return;
		}

		if (count === prevCount + 1) {
			// win!
			isFlipping.value = true;
			setTimeout(() => {
				isFlipping.value = false;
			}, 600);
		} else {
			isShaking.value = true;
			setTimeout(() => {
				isShaking.value = false;
			}, 300);
		}
	},
);

const className = computed(() => {
	return cn(
		isFlipping.value && "animate-flip",
		isShaking.value && "animate-shake",
	);
});
</script>
