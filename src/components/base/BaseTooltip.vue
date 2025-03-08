<template>
  <div class="group relative inline-block">
    <slot />
    <div
      class="invisible absolute z-10 min-w-32 scale-95 rounded-xl border border-gray-600/20 bg-linear-to-b from-gray-700/90 to-gray-800/90 px-3 py-2 text-center text-sm text-white opacity-0 shadow-lg backdrop-blur-xs transition-all duration-200 group-hover:visible group-hover:scale-100 group-hover:opacity-100 dark:from-gray-700/90 dark:to-black/90"
      :class="[
        positionClass,
        className,
        'tooltip-arrow'
      ]"
    >
      <slot name="tooltip" />
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
	position: {
		type: String,
		default: "bottom",
		validator: (value) => ["top", "right", "bottom", "left"].includes(value),
	},
	className: {
		type: String,
		default: "",
	},
});

const positionClass = computed(() => {
	switch (props.position) {
		case "top":
			return "bottom-full left-1/2 -translate-x-1/2 mb-3 arrow-bottom";
		case "right":
			return "left-full top-1/2 -translate-y-1/2 ml-3 arrow-left";
		case "bottom":
			return "top-full left-1/2 -translate-x-1/2 mt-3 arrow-top";
		case "left":
			return "right-full top-1/2 -translate-y-1/2 mr-3 arrow-right";
		default:
			return "top-full left-1/2 -translate-x-1/2 mt-3 arrow-top";
	}
});
</script>

<style scoped>
.tooltip-arrow::before {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  background: inherit;
  border: inherit;
  transform: rotate(45deg);
}

.arrow-top::before {
  top: -5px;
  left: 50%;
  margin-left: -5px;
  border-right: none;
  border-bottom: none;
}

.arrow-bottom::before {
  bottom: -5px;
  left: 50%;
  margin-left: -5px;
  border-left: none;
  border-top: none;
}

.arrow-left::before {
  left: -5px;
  top: 50%;
  margin-top: -5px;
  border-right: none;
  border-top: none;
}

.arrow-right::before {
  right: -5px;
  top: 50%;
  margin-top: -5px;
  border-left: none;
  border-bottom: none;
}
</style>
