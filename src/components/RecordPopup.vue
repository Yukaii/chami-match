<template>
  <Modal :is-open="store.recordPopupOpen" size="medium" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-gray-900 dark:text-white">{{ $t('gameRecord.title') }}</div>

    <div v-if="!hasRecords" class="py-8 text-center text-gray-500 dark:text-gray-400">
      {{ $t('gameRecord.emptyContent') }}
      <!-- Debug button -->
      <div class="mt-4">
        <button
          class="rounded-lg bg-gray-300 px-3 py-1 text-sm text-gray-800 hover:bg-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          @click="forceRefreshData"
        >
          Refresh Data
        </button>
      </div>
    </div>

    <div v-else class="max-h-[80vh] overflow-auto">
      <!-- Filter controls with session dropdown and game type - now sticky -->
      <div class="sticky top-0 z-10 mb-4 bg-white px-2 pb-2 pt-1 shadow-md dark:bg-gray-800">
        <div class="flex flex-col space-y-2">
          <!-- Session filter -->
          <div class="flex items-center justify-between gap-1">
            <div class="text-gray-800 dark:text-white">
              {{ $t('sessionDate') }}:
            </div>
            <select v-model="sessionFilter" class="rounded-lg bg-gray-200 px-3 py-1 text-gray-800 dark:bg-gray-700 dark:text-white">
              <option value="all">{{ $t('allSessions') }}</option>
              <option v-for="session in availableSessions" :key="session.id" :value="session.id">
                {{ session.isCurrent ? `${$t('currentSession')} - ` : '' }}{{ session.name }}
              </option>
            </select>
          </div>

          <!-- Game type filter -->
          <div class="flex items-center justify-between gap-1">
            <div class="text-gray-800 dark:text-white">
              {{ $t('totalRounds') }}: {{ recordCount }}
            </div>
            <select v-model="filterType" class="rounded-lg bg-gray-200 px-3 py-1 text-gray-800 dark:bg-gray-700 dark:text-white">
              <option value="all">{{ $t('allGameTypes') }}</option>
              <option value="standard">{{ $t('gameModes.standard.name') }}</option>
              <option value="contextual">{{ $t('gameModes.contextual.name') }}</option>
              <option value="relative">{{ $t('gameModes.relative.name') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Record items with session header - now with padding -->
      <div class="pt-2">
        <!-- Group records by session -->
        <template v-for="(record) in filteredRecords" :key="record.id">
          <!-- Record item with session indicator -->
          <div class="mb-4 rounded-lg border border-gray-300 bg-white p-4 dark:border-slate-700 dark:bg-transparent">
            <!-- Record header with round and session indicator -->
            <div class="mb-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="font-semibold text-gray-900 dark:text-white">
                    {{ $t('roundCount') }}: {{ record.round }}
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatGameType(record.gameType) }}
                  </span>
                </div>
                <div
                  class="rounded-lg px-2 py-1 text-white"
                  :class="record.wasSuccess ? 'bg-green-700' : 'bg-red-700'"
                >
                  {{ record.wasSuccess ? '✓' : '✗' }}
                </div>
              </div>

              <!-- Session date -->
              <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ formatSessionDate(record.session?.startedAt) }}
                <span v-if="record.isCurrentSession" class="ml-1 text-blue-600 dark:text-blue-400">
                  ({{ $t('currentSession') }})
                </span>
              </div>
            </div>

            <!-- Color-based record content -->
            <template v-if="isColorRecord(record)">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="mb-2 text-gray-800 dark:text-white">{{ $t('actualColor') }}</div>
                  <div
                    class="h-16 w-full rounded-lg"
                    :style="getColorStyle(record.actualColor)"
                  ></div>
                </div>
                <div>
                  <div class="mb-2 text-gray-800 dark:text-white">{{ $t('guessedColor') }}</div>
                  <div
                    class="h-16 w-full rounded-lg"
                    :style="getColorStyle(record.guessedColor)"
                  ></div>
                </div>
              </div>

              <!-- Add numeric color differences only for standard mode -->
              <template v-if="record.gameType === 'standard'">
                <div class="mt-3 space-y-1 rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                  <div class="flex justify-between text-sm">
                    <div class="text-gray-800 dark:text-white">{{ $t('colorDifferences') }}:</div>
                    <div class="text-gray-800 dark:text-white">{{ $t('precisionTarget') }}: ±{{ record.session?.precision || 10 }}</div>
                  </div>

                  <!-- Hue difference -->
                  <div class="flex items-center gap-2">
                    <div class="w-6 font-mono text-pink-600 dark:text-pink-300">H:</div>
                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                      <div
                        class="h-full"
                        :class="getColorDifferenceClass(getHueDifference(record))"
                        :style="`width: ${Math.min(100, getHueDifference(record))}%`"
                      ></div>
                    </div>
                    <div class="w-12 text-right font-mono text-xs text-gray-800 dark:text-white">{{ formatDifference(getHueDifference(record)) }}</div>
                  </div>

                  <!-- Saturation difference -->
                  <div class="flex items-center gap-2">
                    <div class="w-6 font-mono text-pink-600 dark:text-pink-300">S:</div>
                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                      <div
                        class="h-full"
                        :class="getColorDifferenceClass(getSaturationDifference(record))"
                        :style="`width: ${Math.min(100, getSaturationDifference(record))}%`"
                      ></div>
                    </div>
                    <div class="w-12 text-right font-mono text-xs text-gray-800 dark:text-white">{{ formatDifference(getSaturationDifference(record)) }}</div>
                  </div>

                  <!-- Value difference -->
                  <div class="flex items-center gap-2">
                    <div class="w-6 font-mono text-pink-600 dark:text-pink-300">V:</div>
                    <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                      <div
                        class="h-full"
                        :class="getColorDifferenceClass(getValueDifference(record))"
                        :style="`width: ${Math.min(100, getValueDifference(record))}%`"
                      ></div>
                    </div>
                    <div class="w-12 text-right font-mono text-xs text-gray-800 dark:text-white">{{ formatDifference(getValueDifference(record)) }}</div>
                  </div>
                </div>
              </template>
            </template>

            <!-- Difference-based record content -->
            <template v-else-if="isDifferenceRecord(record)">
              <div class="mb-3 flex justify-between text-gray-800 dark:text-white">
                <div>{{ $t('actualDifference') }}: <span class="font-bold">{{ record.actualDifference }}</span></div>
                <div>{{ $t('guessedDifference') }}: <span class="font-bold">{{ record.guessedDifference }}</span></div>
              </div>

              <!-- Visual representation of differences -->
              <div class="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                <div class="h-full bg-green-500" :style="`width: ${record.actualDifference}%`"></div>
              </div>
              <div class="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                <div class="h-full bg-blue-500" :style="`width: ${record.guessedDifference}%`"></div>
              </div>
              <!-- Scale markers -->
              <div class="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </template>

            <!-- Unknown record type -->
            <template v-else>
              <div class="py-2 text-center italic text-gray-500 dark:text-gray-400">
                {{ $t('unknownRecordType') }}
              </div>
            </template>
          </div>
        </template>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useGameStore } from "../stores/game";

const store = useGameStore();
const filterType = ref("all");
const recordsPerPage = 10;
const currentPage = ref(1);
const recordsLoaded = ref(false);
const rawRecords = ref([]);

// Function to extract records from the Pinia store
function extractRecords() {
	try {
		console.log("Extracting records from store...");
		// Get records directly from the store's getter
		rawRecords.value = store.lastTriesOfEachRound || [];
		console.log("Extracted records:", rawRecords.value);
		recordsLoaded.value = true;
		return rawRecords.value;
	} catch (error) {
		console.error("Error extracting records:", error);
		rawRecords.value = [];
		return [];
	}
}

// Helper function to check if we have any records
const hasRecords = computed(() => {
	const records = rawRecords.value;
	const result = Array.isArray(records) && records.length > 0;
	console.log(
		"RecordPopup - hasRecords:",
		result,
		"Count:",
		records?.length || 0,
	);
	return result;
});

// Get total record count
const recordCount = computed(() => {
	const count = rawRecords.value?.length || 0;
	console.log("RecordPopup - recordCount:", count);
	return count;
});

// Session filtering
const sessionFilter = ref("all"); // 'all' or specific sessionId
const availableSessions = computed(() => {
	if (!Array.isArray(rawRecords.value) || rawRecords.value.length === 0)
		return [];

	// Extract unique sessions from records
	const sessions = {};
	rawRecords.value.forEach((record) => {
		if (record.session && record.sessionId) {
			sessions[record.sessionId] = record.session;
		}
	});

	return Object.entries(sessions).map(([id, session]) => ({
		id,
		name: formatSessionDate(session.startedAt),
		isCurrent: id === store.currentSession?.id,
	}));
});

// Format session date for display
function formatSessionDate(timestamp) {
	try {
		if (!timestamp) return "Unknown";
		const date = new Date(timestamp * 1000);
		return date.toLocaleString();
	} catch (e) {
		return "Invalid Date";
	}
}

// Filter records by session and game type
const filteredRecords = computed(() => {
	console.log("RecordPopup - Computing filteredRecords");

	if (!hasRecords.value) {
		console.log("RecordPopup - No records to filter");
		return [];
	}

	const records = rawRecords.value;
	console.log("RecordPopup - Raw records for filtering:", records);

	// Apply session filter first
	let filtered = records;
	if (sessionFilter.value !== "all") {
		filtered = filtered.filter(
			(record) => record.sessionId === sessionFilter.value,
		);
	}

	// Then apply game type filter
	if (filterType.value !== "all") {
		filtered = filtered.filter((record) => {
			// Handle both old and new format records
			const recordType = record?.gameType || "standard";
			return recordType === filterType.value;
		});
	}

	const paged = filtered.slice(0, recordsPerPage * currentPage.value);
	console.log("RecordPopup - Filtered records count:", paged.length);
	return paged;
});

// Watch for popup opening and refresh data
watch(
	() => store.recordPopupOpen,
	(isOpen) => {
		if (isOpen) {
			console.log("RecordPopup opened - forcing record refresh");
			// Force records to refresh when popup opens
			setTimeout(() => {
				extractRecords();
			}, 100); // Small delay to ensure store is updated

			// Reset filter values when opening the popup to maintain consistent state
			sessionFilter.value = "all";
			filterType.value = "all";
		}
	},
);

// Debug function to manually reload data
function forceRefreshData() {
	console.log("Manual refresh triggered");
	store.refreshGameRecords(); // Use the store's refresh method
	extractRecords();
}

onMounted(() => {
	console.log("RecordPopup mounted");
	extractRecords(); // Try to load records on mount
});

// Helper functions to check record types safely with support for old record format
function isColorRecord(record) {
	return (
		record &&
		(record.type === "color" ||
			(!record.type && record.actualColor && record.guessedColor))
	);
}

function isDifferenceRecord(record) {
	return (
		record &&
		(record.type === "difference" ||
			(record.actualDifference !== undefined &&
				record.guessedDifference !== undefined))
	);
}

// Format game type for display with fallback
function formatGameType(type) {
	if (!type) return "Standard";
	return type.charAt(0).toUpperCase() + type.slice(1);
}

// Get valid color style even if color values are missing
function getColorStyle(color) {
	if (!color) return "background-color: gray;";

	// Handle RGB color space
	if ('r' in color && 'g' in color && 'b' in color) {
		const r = color.r ?? 0;
		const g = color.g ?? 0;
		const b = color.b ?? 0;
		return `background-color: rgb(${r}, ${g}, ${b});`;
	}

	// Handle OKLAB color space
	if ('L' in color && 'a' in color && 'b' in color) {
		const L = color.L ?? 0;
		const a = color.a ?? 0;
		const b = color.b ?? 0;
		return `background-color: oklab(${L} ${a} ${b});`;
	}

	// Default to HSV color space
	const h = color.h ?? 0;
	const s = color.s ?? 0;
	const v = color.v ?? 0;
	return `background-color: hsl(${h}, ${s}%, ${v}%);`;
}

// Load more records
function loadMoreRecords() {
	currentPage.value++;
}

const onClose = () => {
	store.toggleRecordPopup();
	// Reset pagination when closing the popup
	currentPage.value = 1;
	// Don't reset filter values here to make them sticky between sessions
};

// Helper functions to calculate color differences
function getHueDifference(record) {
	if (!record?.actualColor?.h || !record?.guessedColor?.h) return 0;

	// Handle hue's circular nature (0-360)
	let diff = Math.abs(record.actualColor.h - record.guessedColor.h);
	if (diff > 180) diff = 360 - diff;

	return diff;
}

function getSaturationDifference(record) {
	if (!record?.actualColor?.s || !record?.guessedColor?.s) return 0;
	return Math.abs(record.actualColor.s - record.guessedColor.s);
}

function getValueDifference(record) {
	if (!record?.actualColor?.v || !record?.guessedColor?.v) return 0;
	return Math.abs(record.actualColor.v - record.guessedColor.v);
}

// Format difference to show + or - prefix
function formatDifference(value) {
	return value.toFixed(1);
}

// Get CSS class based on whether the difference is within precision
function getColorDifferenceClass(diff) {
	const precision = 10; // Default precision
	return diff <= precision ? "bg-green-500" : "bg-red-500";
}
</script>
