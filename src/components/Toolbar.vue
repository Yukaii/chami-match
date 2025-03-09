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
            <span class="ml-2">{{ state.currentRound }}</span>
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
            <span class="ml-2">{{ state.winningStreak }}</span>
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
            <span class="ml-2">{{ state.winRate.value }}</span>
          </BaseButton>
          <template #tooltip>{{ $t('winningRate') }}</template>
        </BaseTooltip>
      </slot>
    </div>

    <div class="flex gap-2">
      <slot name="right">
        <BaseTooltip>
          <BaseButton variant="primary" size="sm" @click="state.toggleRecordPopup(true)">
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
          <BaseButton variant="primary" size="sm" @click="state.toggleAboutPopup(true)">
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
import { useGlobalGameState } from "../gameState";
import { cn } from "../utils/index";

import BaseButton from "./base/BaseButton.vue";
import BaseTooltip from "./base/BaseTooltip.vue";

const state = useGlobalGameState();

function openSettings() {
	state.settingsMode = "game";
	state.toggleSettingsPopup(true);
}

const isShaking = ref(false);
const isFlipping = ref(false);

watch(
	[state.winningStreak, state.currentRound],
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
