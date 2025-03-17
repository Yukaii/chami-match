import { useStorage } from "@vueuse/core";
import { nanoid } from "nanoid";
import { defineStore } from "pinia";
import { computed, watch } from "vue";
import { celebrateFirstTry } from "../utils/confetti";
import { createGameMode } from "./modes";

function createSession({ maxLife, precision, mode, gameType }) {
  return {
    id: nanoid(),
    startedAt: Math.floor(Date.now() / 1000), // UNIX timestamp
    maxLife,
    precision,
    mode,
    gameType,
  };
}

export const useGameStore = defineStore("game", () => {
  // Reactive state using Composition API style
  const sessions = useStorage("sessions", []);
  const preferences = useStorage("preferences", {
    maxLife: 5,
    precision: 10,
    mode: "Color",
    colorSpace: "hsv", // Default color space
    realtimePreview: false,
    gameType: "standard",
    enableConfetti: true,
    lastPlayedGameType: null, // Track the last played game type
    recallTimeout: 5, // Default recall timeout
  });
  const history = useStorage("history", []);
  
  // Session state
  const currentSession = ref(null);
  const currentRound = ref(0);
  const score = ref(0);
  const currentGameMode = ref(null);
  
  // UI state
  const recordPopupOpen = ref(false);
  const settingsPopupOpen = ref(false);
  const aboutPopupOpen = ref(false);
  const resetPopupOpen = ref(false);
  const settingsMode = ref("global");
  
  // Other state
  const lives = ref(5);
  const attemptCount = ref(0);

  // Computed properties
  const maxLife = computed(() => {
    // Override maxLife for contextual and image mode to always be 2
    if (
      preferences.value.gameType === "contextual" ||
      preferences.value.gameType === "image" ||
      preferences.value.gameType === "recall"
    ) {
      return 2;
    }
    return preferences.value.maxLife || 5;
  });

  const precision = computed(() => preferences.value.precision || 10);
  const mode = computed(() => preferences.value.mode || "Color");
  const colorSpace = computed(() => preferences.value.colorSpace || "hsv");
  const realtimePreview = computed(() => preferences.value.realtimePreview || false);
  const gameType = computed(() => preferences.value.gameType || "standard");
  const recallTimeout = computed(() => preferences.value.recallTimeout || 5);

  // Current game mode state accessors
  const currentModeState = computed(() => currentGameMode.value?.state);
  const randomColor = computed(() => currentGameMode.value?.state?.randomColor);
  const userColor = computed(() => currentGameMode.value?.state?.userColor);
  const relativeColors = computed(() => currentGameMode.value?.state?.relativeColors);
  const userValueDifference = computed(() => currentGameMode.value?.state?.userValueDifference);
  const surroundingColor = computed(() => currentGameMode.value?.state?.surroundingColor);
  const colorOptions = computed(() => currentGameMode.value?.state?.colorOptions || []);

  // Game statistics
  const winRate = computed(() => {
    if (currentRound.value === 1) {
      return "0%";
    }
    const successfulRounds = history.value
      .filter((item) => item.sessionId === currentSession.value?.id)
      .filter((item, i, arr) => {
        // Is this the last try of the round or last item in history?
        return (
          item.wasSuccess &&
          (i === arr.length - 1 || arr[i + 1].round !== item.round)
        );
      }).length;
    const winPercentage = (successfulRounds / (currentRound.value - 1)) * 100;
    return `${Number.parseInt(winPercentage, 10)}%`;
  });

  const winningStreak = computed(() => {
    let streak = 0;
    let roundToCheck = currentRound.value - 1;
    while (roundToCheck > 0) {
      // Find the last try of the round
      const lastTryOfRound = history.value
        .slice()
        .reverse()
        .find((item) => item.round === roundToCheck);
      if (lastTryOfRound?.wasSuccess) {
        streak++;
        roundToCheck--;
      } else {
        break;
      }
    }
    return streak;
  });

  const lastTriesOfEachRound = computed(() => {
    try {
      // Check if history is valid
      if (!Array.isArray(history.value)) {
        console.warn("History is not an array:", history.value);
        return [];
      }
      // Group records by session
      const recordsBySession = {};
      // Process all records from history
      history.value.forEach((record) => {
        if (!record || !record.sessionId || !record.round) return;
        // Initialize session if needed
        if (!recordsBySession[record.sessionId]) {
          recordsBySession[record.sessionId] = new Map();
        }
        // Only keep the last attempt for each round in this session
        recordsBySession[record.sessionId].set(record.round, record);
      });
      // Flatten and process all session records
      let allRecords = [];
      Object.keys(recordsBySession).forEach((sessionId) => {
        const sessionRecords = Array.from(
          recordsBySession[sessionId].values(),
        );
        // Find the corresponding session
        const session = sessions.value.find((s) => s.id === sessionId);
        if (session) {
          // Process all records in this session
          const processedRecords = sessionRecords.map((record) => {
            // Normalize record structure for compatibility
            if (!record.id) record.id = nanoid();
            if (!record.timestamp) record.timestamp = Date.now();
            if (!record.gameType)
              record.gameType = session.gameType || "standard";
            return {
              ...record,
              session: Object.assign({}, session),
              isCurrentSession: sessionId === currentSession.value?.id,
            };
          });
          allRecords = [...allRecords, ...processedRecords];
        }
      });
      // Sort records by timestamp (most recent first)
      allRecords.sort((a, b) => {
        // Put current session at the top
        if (a.isCurrentSession !== b.isCurrentSession) {
          return a.isCurrentSession ? -1 : 1;
        }
        // Then sort by timestamp (most recent first)
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
      const MAX_RECORDS = 50;
      return allRecords.slice(0, MAX_RECORDS);
    } catch (error) {
      console.error("Error getting round history:", error);
      return [];
    }
  });

  const lastPlayedGameType = computed(() => {
    return (
      preferences.value.lastPlayedGameType ||
      preferences.value.gameType ||
      "standard"
    );
  });

  // Actions
  function resetGameData() {
    localStorage.removeItem("sessions");
    localStorage.removeItem("preferences");
    localStorage.removeItem("history");
    window.location.reload();
  }

  function initGameMode() {
    // Create game mode with current preferences
    const newMode = createGameMode(gameType.value, {
      colorMode: mode.value,
      colorSpace: colorSpace.value,
      precision: precision.value,
      realtimePreview: realtimePreview.value,
    });
    // Initialize mode-specific state
    const modeState = newMode.initState();
    newMode.state = modeState;
    // Update current game mode
    currentGameMode.value = newMode;
    return modeState;
  }

  function startOver() {
    // Create a new session
    const session = createSession({
      maxLife: maxLife.value,
      precision: precision.value,
      mode: mode.value,
      gameType: gameType.value,
    });
    currentSession.value = session;
    sessions.value.push(session);
    // Reset the round and score
    currentRound.value = 0;
    score.value = 0;
    lives.value = maxLife.value;
    // Initialize the game mode
    initGameMode();
    // Start a new round
    startNewRound();
  }

  function startNewRound() {
    // Increment the round and reset lives
    currentRound.value++;
    lives.value = maxLife.value;
    attemptCount.value = 0;
    // Let the current game mode handle round initialization
    if (currentGameMode.value) {
      currentGameMode.value.startRound();
      // For contextual mode, ensure colorOptions are generated
      if (
        gameType.value === "contextual" &&
        (!currentGameMode.value.state.colorOptions ||
          currentGameMode.value.state.colorOptions.length === 0)
      ) {
        currentGameMode.value.state.colorOptions =
          currentGameMode.value.generateColorOptions();
      }
    }
  }

  function recordRound(wasSuccess) {
    if (!currentGameMode.value) return;
    try {
      // Increment attempt counter
      attemptCount.value++;
      // Get mode-specific record data
      const record = currentGameMode.value.createHistoryRecord(
        wasSuccess,
        currentRound.value,
        currentSession.value.id,
      );
      // Add common fields to ensure consistency
      const completeRecord = {
        id: nanoid(),
        timestamp: Date.now(),
        sessionId: currentSession.value.id,
        round: currentRound.value,
        gameType: gameType.value,
        wasSuccess,
        attempt: attemptCount.value,
        ...record,
      };
      // Add to history
      history.value.push(completeRecord);
      // Update score and lives
      if (wasSuccess) {
        score.value++;
        // Only celebrate if this was the first attempt AND it was successful AND confetti is enabled
        if (attemptCount.value === 1 && preferences.value.enableConfetti) {
          celebrateFirstTry();
        }
      } else {
        lives.value--;
      }
      // Check if we need a new round
      if (wasSuccess || lives.value === 0) {
        startNewRound();
      }
    } catch (error) {
      console.error("Error recording game round:", error);
    }
  }

  function checkGuess() {
    if (!currentGameMode.value) return;
    const isCorrect = currentGameMode.value.checkGuess();
    recordRound(isCorrect);
  }

  function updateUserColor(h, s, v) {
    if (currentGameMode.value?.updateUserColor) {
      currentGameMode.value.updateUserColor(h, s, v);
    }
  }

  function updateUserValueDifference(value) {
    if (currentGameMode.value?.updateUserValueDifference) {
      currentGameMode.value.updateUserValueDifference(value);
    }
  }

  // Settings updates
  function updateMode(newMode) {
    preferences.value.mode = newMode;
  }

  function updateColorSpace(newColorSpace) {
    preferences.value.colorSpace = newColorSpace;
    // If we have an active game mode, update its color space
    currentGameMode.value?.setColorSpace?.(newColorSpace);
  }

  function updatePrecision(newPrecision) {
    preferences.value.precision = newPrecision;
  }

  function updateMaxLife(newMaxLife) {
    preferences.value.maxLife = newMaxLife;
  }

  function updateRealtimePreview(preview) {
    preferences.value.realtimePreview = preview;
  }

  function updateGameType(newGameType) {
    preferences.value.gameType = newGameType;
    // Also update lastPlayedGameType
    preferences.value.lastPlayedGameType = newGameType;
    // Immediately update lives when game type changes
    lives.value =
      newGameType === "contextual" ||
      newGameType === "image" ||
      newGameType === "recall"
        ? 2
        : preferences.value.maxLife || 5;
  }

  function updateLastPlayedGameType(gameType) {
    // Specifically update only the last played game type
    preferences.value.lastPlayedGameType = gameType;
  }

  function updateConfetti(enabled) {
    preferences.value.enableConfetti = enabled;
  }

  function updateRecallTimeout(newTimeout) {
    preferences.value.recallTimeout = newTimeout;
  }

  // Toggle UI states
  function toggleRecordPopup() {
    recordPopupOpen.value = !recordPopupOpen.value;
  }

  function toggleSettingsPopup() {
    settingsPopupOpen.value = !settingsPopupOpen.value;
  }

  function toggleAboutPopup() {
    aboutPopupOpen.value = !aboutPopupOpen.value;
  }

  function toggleResetPopup() {
    resetPopupOpen.value = !resetPopupOpen.value;
  }

  function refreshGameRecords() {
    // This is a hack to force the store to recognize history has changed
    history.value = [...history.value];
    return lastTriesOfEachRound.value;
  }

  function migrateHistoryRecords() {
    try {
      if (Array.isArray(history.value)) {
        history.value = history.value.map((record) => {
          // Check if it's an old format record that needs migration
          if (record?.sessionId && record.round && !record.id) {
            return {
              id: nanoid(),
              timestamp: Date.now(),
              sessionId: record.sessionId,
              round: record.round,
              gameType: "standard", // Old records were from standard mode
              wasSuccess: record.wasSuccess,
              type: "color",
              guessedColor: record.guessedColor,
              actualColor: record.actualColor,
            };
          }
          return record; // Already in new format or unrecognized
        });
      }
    } catch (error) {
      console.error("Error migrating history records:", error);
    }
  }

  // Initialize the store
  function initStore() {
    if (!currentSession.value) {
      const session = createSession({
        maxLife: maxLife.value,
        precision: precision.value,
        mode: mode.value,
        gameType: gameType.value,
      });
      currentSession.value = session;
      sessions.value.push(session);
      initGameMode();
    }
    // Run migration when initializing
    migrateHistoryRecords();

    // Set up watches for state changes
    watch(
      () => preferences.value.gameType,
      (newGameType) => {
        lives.value =
          newGameType === "contextual" ||
          newGameType === "image" ||
          newGameType === "recall"
            ? 2
            : preferences.value.maxLife || 5;
      },
    );
  }

  return {
    // State
    sessions,
    preferences,
    history,
    currentSession,
    currentRound,
    score,
    currentGameMode,
    recordPopupOpen,
    settingsPopupOpen,
    aboutPopupOpen,
    resetPopupOpen,
    settingsMode,
    lives,
    attemptCount,
    
    // Getters
    maxLife,
    precision,
    mode,
    colorSpace,
    realtimePreview,
    gameType,
    recallTimeout,
    currentModeState,
    randomColor,
    userColor,
    relativeColors,
    userValueDifference,
    surroundingColor,
    colorOptions,
    winRate,
    winningStreak,
    lastTriesOfEachRound,
    lastPlayedGameType,
    
    // Actions
    resetGameData,
    initGameMode,
    startOver,
    startNewRound,
    recordRound,
    checkGuess,
    updateUserColor,
    updateUserValueDifference,
    updateMode,
    updateColorSpace,
    updatePrecision,
    updateMaxLife,
    updateRealtimePreview,
    updateGameType,
    updateLastPlayedGameType,
    updateConfetti,
    updateRecallTimeout,
    toggleRecordPopup,
    toggleSettingsPopup,
    toggleAboutPopup,
    toggleResetPopup,
    refreshGameRecords,
    migrateHistoryRecords,
    initStore
  };
});