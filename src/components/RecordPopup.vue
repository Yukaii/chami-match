<template>
  <Modal :is-open="recordPopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-white">{{ $t('gameRecord.title') }}</div>

    <div v-if="!hasRecords" class="text-gray-400 text-center py-8">
      {{ $t('gameRecord.emptyContent') }}
      <!-- Debug button -->
      <div class="mt-4">
        <button
          @click="forceRefreshData"
          class="text-sm px-3 py-1 bg-gray-700 rounded-lg hover:bg-gray-600"
        >
          Refresh Data
        </button>
      </div>
    </div>

    <div v-else class="max-h-[80vh] overflow-auto">
      <!-- Filter controls with session dropdown and game type -->
      <div class="flex flex-col space-y-2 mb-4">
        <!-- Session filter -->
        <div class="flex justify-between items-center">
          <div class="text-white">
            {{ $t('sessionDate') }}:
          </div>
          <select v-model="sessionFilter" class="bg-gray-700 text-white rounded-lg px-3 py-1">
            <option value="all">{{ $t('allSessions') }}</option>
            <option v-for="session in availableSessions" :key="session.id" :value="session.id">
              {{ session.isCurrent ? `${$t('currentSession')} - ` : '' }}{{ session.name }}
            </option>
          </select>
        </div>

        <!-- Game type filter -->
        <div class="flex justify-between items-center">
          <div class="text-white">
            {{ $t('totalRounds') }}: {{ recordCount }}
          </div>
          <select v-model="filterType" class="bg-gray-700 text-white rounded-lg px-3 py-1">
            <option value="all">{{ $t('allGameTypes') }}</option>
            <option value="standard">{{ $t('gameModes.standard.name') }}</option>
            <option value="contextual">{{ $t('gameModes.contextual.name') }}</option>
            <option value="relative">{{ $t('gameModes.relative.name') }}</option>
          </select>
        </div>
      </div>

      <!-- Record items with session header -->
      <div>
        <!-- Group records by session -->
        <template v-for="(record, index) in filteredRecords" :key="record.id">
          <!-- Record item with session indicator -->
          <div class="mb-4 rounded-lg border border-slate-700 p-4">
            <!-- Record header with round and session indicator -->
            <div class="mb-3">
              <div class="flex items-center justify-between">
                <div class="flex gap-2 items-center">
                  <div class="text-white font-semibold">
                    {{ $t('roundCount') }}: {{ record.round }}
                  </div>
                  <span class="text-xs text-gray-400">
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
              <div class="text-xs text-gray-400 mt-1">
                {{ formatSessionDate(record.session?.startedAt) }}
                <span v-if="record.isCurrentSession" class="ml-1 text-blue-400">
                  ({{ $t('currentSession') }})
                </span>
              </div>
            </div>

            <!-- Color-based record content -->
            <template v-if="isColorRecord(record)">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="mb-2 text-white">{{ $t('actualColor') }}</div>
                  <div
                    class="h-16 w-full rounded-lg"
                    :style="getColorStyle(record.actualColor)"
                  ></div>
                </div>
                <div>
                  <div class="mb-2 text-white">{{ $t('guessedColor') }}</div>
                  <div
                    class="h-16 w-full rounded-lg"
                    :style="getColorStyle(record.guessedColor)"
                  ></div>
                </div>
              </div>
            </template>

            <!-- Difference-based record content -->
            <template v-else-if="isDifferenceRecord(record)">
              <div class="mb-3 flex justify-between text-white">
                <div>{{ $t('actualDifference') }}: <span class="font-bold">{{ record.actualDifference }}</span></div>
                <div>{{ $t('guessedDifference') }}: <span class="font-bold">{{ record.guessedDifference }}</span></div>
              </div>

              <!-- Visual representation of differences -->
              <div class="mt-2 h-3 w-full bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-green-500" :style="`width: ${record.actualDifference}%`"></div>
              </div>
              <div class="mt-2 h-3 w-full bg-gray-700 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500" :style="`width: ${record.guessedDifference}%`"></div>
              </div>
              <!-- Scale markers -->
              <div class="mt-1 flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </template>

            <!-- Unknown record type -->
            <template v-else>
              <div class="text-gray-400 italic text-center py-2">
                {{ $t('unknownRecordType') }}
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- Pagination if needed -->
      <div v-if="hasMoreRecords" class="mt-4 text-center">
        <button
          class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          @click="loadMoreRecords"
        >
          {{ $t('loadMore') }}
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useGlobalGameState } from '../gameState';

const state = useGlobalGameState();
const recordPopupOpen = state.recordPopupOpen;
const filterType = ref('all');
const recordsPerPage = 10;
const currentPage = ref(1);
const recordsLoaded = ref(false);
const rawRecords = ref([]);

// Force extract records from the computed property
function extractRecords() {
  try {
    console.log('Extracting records from state...');
    // Try to access the actual array value directly
    if (state.lastTriesOfEachRound && Array.isArray(state.lastTriesOfEachRound.value)) {
      rawRecords.value = state.lastTriesOfEachRound.value;
      console.log('Extracted records from .value:', rawRecords.value);
    } else if (Array.isArray(state.lastTriesOfEachRound)) {
      rawRecords.value = state.lastTriesOfEachRound;
      console.log('Extracted records directly:', rawRecords.value);
    } else {
      console.warn('Could not extract records, invalid format:', state.lastTriesOfEachRound);
      rawRecords.value = [];
    }

    recordsLoaded.value = true;
    return rawRecords.value;
  } catch (error) {
    console.error('Error extracting records:', error);
    rawRecords.value = [];
    return [];
  }
}

// Helper function to check if we have any records
const hasRecords = computed(() => {
  const records = rawRecords.value;
  const result = Array.isArray(records) && records.length > 0;
  console.log('RecordPopup - hasRecords:', result, 'Count:', records?.length || 0);
  return result;
});

// Get total record count
const recordCount = computed(() => {
  const count = rawRecords.value?.length || 0;
  console.log('RecordPopup - recordCount:', count);
  return count;
});

// Session filtering
const sessionFilter = ref('all'); // 'all' or specific sessionId
const availableSessions = computed(() => {
  if (!Array.isArray(rawRecords.value) || rawRecords.value.length === 0) return [];

  // Extract unique sessions from records
  const sessions = {};
  rawRecords.value.forEach(record => {
    if (record.session && record.sessionId) {
      sessions[record.sessionId] = record.session;
    }
  });

  return Object.entries(sessions).map(([id, session]) => ({
    id,
    name: formatSessionDate(session.startedAt),
    isCurrent: id === state.currentSession?.id
  }));
});

// Format session date for display
function formatSessionDate(timestamp) {
  try {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  } catch (e) {
    return 'Invalid Date';
  }
}

// Filter records by session and game type
const filteredRecords = computed(() => {
  console.log('RecordPopup - Computing filteredRecords');

  if (!hasRecords.value) {
    console.log('RecordPopup - No records to filter');
    return [];
  }

  const records = rawRecords.value;
  console.log('RecordPopup - Raw records for filtering:', records);

  // Apply session filter first
  let filtered = records;
  if (sessionFilter.value !== 'all') {
    filtered = filtered.filter(record => record.sessionId === sessionFilter.value);
  }

  // Then apply game type filter
  if (filterType.value !== 'all') {
    filtered = filtered.filter(record => {
      // Handle both old and new format records
      const recordType = record?.gameType || 'standard';
      return recordType === filterType.value;
    });
  }

  const paged = filtered.slice(0, recordsPerPage * currentPage.value);
  console.log('RecordPopup - Filtered records count:', paged.length);
  return paged;
});

// Watch for popup opening and refresh data
watch(recordPopupOpen, (isOpen) => {
  if (isOpen) {
    console.log('RecordPopup opened - forcing record refresh');
    // Force records to refresh when popup opens
    setTimeout(() => {
      extractRecords();
    }, 100); // Small delay to ensure state is updated
  }
});

// Debug function to manually reload data
function forceRefreshData() {
  console.log('Manual refresh triggered');
  extractRecords();
}

onMounted(() => {
  console.log('RecordPopup mounted');
  extractRecords(); // Try to load records on mount
});

// Helper functions to check record types safely with support for old record format
function isColorRecord(record) {
  return record && (
    record.type === 'color' ||
    (!record.type && record.actualColor && record.guessedColor)
  );
}

function isDifferenceRecord(record) {
  return record && (
    record.type === 'difference' ||
    (record.actualDifference !== undefined && record.guessedDifference !== undefined)
  );
}

// Format game type for display with fallback
function formatGameType(type) {
  if (!type) return 'Standard';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Get valid color style even if color values are missing
function getColorStyle(color) {
  if (!color) return 'background-color: gray;';

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
  state.toggleRecordPopup(false);
  // Reset pagination when closing the popup
  currentPage.value = 1;
  filterType.value = 'all';
};
</script>
