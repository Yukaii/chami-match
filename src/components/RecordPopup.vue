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
          <div class="flex items-center justify-between gap-2">
            <div class="text-gray-800 dark:text-white">
              {{ $t('sessionDate') }}:
            </div>
            <BaseSelect 
              v-model="sessionFilter" 
              size="sm"
              variant="flat"
              :fullWidth="true"
              is3d
              className="min-w-[150px]"
            >
              <option value="all">{{ $t('allSessions') }}</option>
              <option v-for="session in availableSessions" :key="session.id" :value="session.id">
                {{ session.isCurrent ? `${$t('currentSession')} - ` : '' }}{{ session.name }}
              </option>
            </BaseSelect>
          </div>

          <!-- Game type filter -->
          <div class="flex items-center justify-between gap-2">
            <div class="text-gray-800 dark:text-white">
              {{ $t('totalRounds') }}: {{ recordCount }}
            </div>
            <BaseSelect 
              v-model="filterType" 
              size="sm"
              variant="flat"
              :fullWidth="true"
              is3d
              className="min-w-[150px]"
            >
              <option value="all">{{ $t('allGameTypes') }}</option>
              <option value="standard">{{ $t('gameModes.standard.name') }}</option>
              <option value="contextual">{{ $t('gameModes.contextual.name') }}</option>
              <option value="relative">{{ $t('gameModes.relative.name') }}</option>
            </BaseSelect>
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
                  <!-- Add color format badge -->
                  <span v-if="isColorRecord(record)" class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
                    {{ getColorFormat(record) }}
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

                  <!-- Display color differences based on color space -->
                  <template v-if="getColorFormat(record) === 'RGB'">
                    <!-- RGB differences -->
                    <div class="flex items-center gap-2">
                      <div class="w-6 font-mono text-red-600 dark:text-red-300">R:</div>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                        <div
                          class="h-full"
                          :class="getColorDifferenceClass(getRgbDifference(record, 'r'))"
                          :style="`width: ${Math.min(100, getRgbDifference(record, 'r'))}%`"
                        ></div>
                      </div>
                      <div class="w-12 text-right font-mono text-xs text-gray-800 dark:text-white">{{ formatDifference(getRgbDifference(record, 'r')) }}</div>
                    </div>

                    <!-- Green difference -->
                    <div class="flex items-center gap-2">
                      <div class="w-6 font-mono text-green-600 dark:text-green-300">G:</div>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                        <div
                          class="h-full"
                          :class="getColorDifferenceClass(getRgbDifference(record, 'g'))"
                          :style="`width: ${Math.min(100, getRgbDifference(record, 'g'))}%`"
                        ></div>
                      </div>
                      <div class="w-12 text-right font-mono text-xs text-gray-800 dark:text-white">{{ formatDifference(getRgbDifference(record, 'g')) }}</div>
                    </div>

                    <!-- Blue difference -->
                    <div class="flex items-center gap-2">
                      <div class="w-6 font-mono text-blue-600 dark:text-blue-300">B:</div>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                        <div
                          class="h-full"
                          :class="getColorDifferenceClass(getRgbDifference(record, 'b'))"
                          :style="`width: ${Math.min(100, getRgbDifference(record, 'b'))}%`"
                        ></div>
                      </div>
                      <div class="w-12 text-right font-mono text-xs text-gray-800 dark:text-white">{{ formatDifference(getRgbDifference(record, 'b')) }}</div>
                    </div>
                  </template>

                  <template v-else-if="getColorFormat(record) === 'OKLAB'">
                    <!-- OKLAB differences -->
                    <div class="flex items-center gap-2">
                      <div class="w-6 font-mono text-purple-600 dark:text-purple-300">L:</div>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                        <div
                          class="h-full"
                          :class="getColorDifferenceClass(getOklabDifference(record, 'L'))"
                          :style="`width: ${Math.min(100, getOklabDifference(record, 'L'))}%`"
                        ></div>
                      </div>
                      <div class="w-12 text-right font-mono text-xs text-gray-800 dark:text-white">{{ formatDifference(getOklabDifference(record, 'L')) }}</div>
                    </div>

                    <!-- a-axis difference -->
                    <div class="flex items-center gap-2">
                      <div class="w-6 font-mono text-emerald-600 dark:text-emerald-300">a:</div>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                        <div
                          class="h-full"
                          :class="getColorDifferenceClass(getOklabDifference(record, 'a'))"
                          :style="`width: ${Math.min(100, getOklabDifference(record, 'a'))}%`"
                        ></div>
                      </div>
                      <div class="w-12 text-right font-mono text-xs text-gray-800 dark:text-white">{{ formatDifference(getOklabDifference(record, 'a')) }}</div>
                    </div>

                    <!-- b-axis difference -->
                    <div class="flex items-center gap-2">
                      <div class="w-6 font-mono text-amber-600 dark:text-amber-300">b:</div>
                      <div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700">
                        <div
                          class="h-full"
                          :class="getColorDifferenceClass(getOklabDifference(record, 'b'))"
                          :style="`width: ${Math.min(100, getOklabDifference(record, 'b'))}%`"
                        ></div>
                      </div>
                      <div class="w-12 text-right font-mono text-xs text-gray-800 dark:text-white">{{ formatDifference(getOklabDifference(record, 'b')) }}</div>
                    </div>
                  </template>

                  <template v-else>
                    <!-- Default HSV differences -->
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
                  </template>
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
import { useI18n } from "vue-i18n";
import {
  hsvToOklab,
  hsvToRgb,
  oklabToHsv,
  rgbToHsv,
} from "../utils/colorSpaceUtils";
import Modal from "./Modal.vue";
import BaseSelect from "./base/BaseSelect.vue";

const { t: $t } = useI18n();

const store = useGameStore();
const filterType = ref("all");
const recordsPerPage = 10;
const currentPage = ref(1);
const recordsLoaded = ref(false);
const rawRecords = ref([]);

// Function to extract records from the Pinia store
function extractRecords() {
  try {
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
  if (!record) return false;

  // Check if it's explicitly a color record
  if (record.type === "color") return true;

  // Check for implicit color record without type field
  if (!record.type) {
    // Has both color objects
    if (record.actualColor && record.guessedColor) return true;

    // Check if actualColor has any color space properties
    if (record.actualColor) {
      if (record.actualColor.r !== undefined) return true;
      if (record.actualColor.L !== undefined) return true;
      if (record.actualColor.h !== undefined) return true;
    }
  }

  return false;
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

// Helper function to determine color format
function getColorFormat(record) {
  if (!record?.actualColor) return "HSV";

  // More precise format detection
  if (
    "L" in record.actualColor &&
    "a" in record.actualColor &&
    "b" in record.actualColor
  ) {
    // OKLAB has specific L, a, b properties
    return "OKLAB";
  }

  if (
    "r" in record.actualColor &&
    "g" in record.actualColor &&
    "b" in record.actualColor
  ) {
    // RGB has specific r, g, b properties
    return "RGB";
  }

  if (
    "h" in record.actualColor &&
    "s" in record.actualColor &&
    "v" in record.actualColor
  ) {
    // HSV has specific h, s, v properties
    return "HSV";
  }

  // If we can't determine format, look for colorSpace property
  return record.colorSpace?.toUpperCase() || "HSV";
}

// Convert any color to HSV for comparison
function convertToHsv(color) {
  if (!color) return { h: 0, s: 0, v: 0 };

  // Already HSV
  if ("h" in color && "s" in color && "v" in color) {
    return { h: color.h || 0, s: color.s || 0, v: color.v || 0 };
  }

  // RGB conversion
  if ("r" in color && "g" in color && "b" in color) {
    return rgbToHsv(color.r || 0, color.g || 0, color.b || 0);
  }

  // OKLAB conversion
  if ("L" in color && "a" in color && "b" in color) {
    return oklabToHsv(color.L || 0, color.a || 0, color.b || 0);
  }

  return { h: 0, s: 0, v: 0 }; // Default fallback
}

// Get valid color style even if color values are missing
function getColorStyle(color) {
  if (!color) return "background-color: gray;";

  // Handle OKLAB color space
  if ("L" in color && "a" in color && "b" in color) {
    const L = color.L ?? 0;
    const a = color.a ?? 0;
    const b = color.b ?? 0;

    // Convert from our sliders' range (-100 to 100) to CSS oklab() range (-0.4 to 0.4)
    // L is already properly scaled (0-100 to 0-1) by dividing by 100
    // But a and b need to be scaled from -100/+100 to -0.4/+0.4
    const cssL = L / 100;
    const cssA = a / 250; // Scale from -100/+100 to -0.4/+0.4
    const cssB = b / 250; // Scale from -100/+100 to -0.4/+0.4

    return `background-color: oklab(${cssL} ${cssA} ${cssB});`;
  }

  // Handle RGB color space
  if ("r" in color && "g" in color && "b" in color) {
    const r = color.r ?? 0;
    const g = color.g ?? 0;
    const b = color.b ?? 0;
    return `background-color: rgb(${r}, ${g}, ${b});`;
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
  if (!record?.actualColor || !record?.guessedColor) return 0;

  // Convert both colors to HSV for comparison
  const actualHsv = convertToHsv(record.actualColor);
  const guessedHsv = convertToHsv(record.guessedColor);

  // Handle hue's circular nature (0-360)
  let diff = Math.abs(actualHsv.h - guessedHsv.h);
  if (diff > 180) diff = 360 - diff;

  return diff;
}

function getSaturationDifference(record) {
  if (!record?.actualColor || !record?.guessedColor) return 0;

  // Convert both colors to HSV for comparison
  const actualHsv = convertToHsv(record.actualColor);
  const guessedHsv = convertToHsv(record.guessedColor);

  return Math.abs(actualHsv.s - guessedHsv.s);
}

function getValueDifference(record) {
  if (!record?.actualColor || !record?.guessedColor) return 0;

  // Convert both colors to HSV for comparison
  const actualHsv = convertToHsv(record.actualColor);
  const guessedHsv = convertToHsv(record.guessedColor);

  return Math.abs(actualHsv.v - guessedHsv.v);
}

// Helper functions to calculate RGB color differences
function getRgbDifference(record, channel) {
  if (!record?.actualColor?.[channel] || !record?.guessedColor?.[channel])
    return 0;

  // Calculate percentage difference (0-100%) from the 0-255 range
  const diff = Math.abs(
    record.actualColor[channel] - record.guessedColor[channel],
  );
  return diff / 2.55; // Convert to percentage (255/100 = 2.55)
}

// Helper functions to calculate OKLAB color differences
function getOklabDifference(record, channel) {
  if (!record?.actualColor?.[channel] || !record?.guessedColor?.[channel])
    return 0;

  // Calculate percentage difference
  // For L: 0-100 is already percentage
  // For a & b: -100 to +100 range needs to be converted to percentage
  if (channel === "L") {
    return Math.abs(record.actualColor[channel] - record.guessedColor[channel]);
  }

  // a and b range from -100 to +100, so divide by 2 to get percentage
  return (
    Math.abs(record.actualColor[channel] - record.guessedColor[channel]) / 2
  );
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
