import { useToggle, useStorage } from '@vueuse/core';
import { reactive, ref, computed } from 'vue';
import { nanoid } from 'nanoid';
import { createGameMode } from './modes';

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

export function resetGameData() {
  localStorage.removeItem('sessions');
  localStorage.removeItem('preferences');
  localStorage.removeItem('history');
  window.location.reload();
}

export const useGlobalGameState = createGlobalState(() => {
  // Persistent storage
  const sessions = useStorage('sessions', []);
  const preferences = useStorage('preferences', {
    maxLife: 5,
    precision: 10,
    mode: 'Color',
    realtimePreview: false,
    gameType: 'standard'
  });
  const history = useStorage('history', []);

  // Session state
  const currentSession = ref(null);

  // Game state
  const currentRound = ref(0);
  const score = ref(0);
  const currentGameMode = ref(null);

  // UI state
  const [recordPopupOpen, toggleRecordPopup] = useToggle(false);
  const [settingsPopupOpen, toggleSettingsPopup] = useToggle(false);
  const [aboutPopupOpen, toggleAboutPopup] = useToggle(false);
  const [resetPopupOpen, toggleResetPopup] = useToggle(false);
  const settingsMode = ref('global');

  // Computed properties
  const maxLife = computed(() => {
    // Override maxLife for contextual mode to always be 2
    if (preferences.value.gameType === 'contextual') {
      return 2;
    }
    return preferences.value.maxLife || 5;
  });
  const lives = ref(maxLife.value);
  const precision = computed(() => preferences.value.precision || 10);
  const mode = computed(() => preferences.value.mode || 'Color');
  const realtimePreview = computed(() => preferences.value.realtimePreview || false);
  const gameType = computed(() => preferences.value.gameType || 'standard');

  // Initialize game mode
  function initGameMode() {
    // Create game mode with current preferences
    const newMode = createGameMode(gameType.value, {
      colorMode: mode.value,
      precision: precision.value,
      realtimePreview: realtimePreview.value
    });

    // Initialize mode-specific state
    const modeState = newMode.initState();
    newMode.state = modeState;

    // Update current game mode
    currentGameMode.value = newMode;

    return modeState;
  }

  // Start a new game
  function startOver() {
    // Create a new session
    const session = createSession({
      maxLife: maxLife.value,
      precision: precision.value,
      mode: mode.value,
      gameType: gameType.value
    });
    currentSession.value = session;
    sessions.value.push(session);

    // Reset the round and score
    currentRound.value = 0;
    score.value = 0;

    // Initialize the game mode
    initGameMode();

    // Start a new round
    startNewRound();
  }

  // Start a new round
  function startNewRound() {
    // Increment the round and reset lives
    currentRound.value++;
    lives.value = maxLife.value;

    // Let the current game mode handle round initialization
    if (currentGameMode.value) {
      currentGameMode.value.startRound();
    }
  }

  // Record a round in history
  function recordRound(wasSuccess) {
    if (!currentGameMode.value) return;

    // Create history record using mode-specific logic
    const record = currentGameMode.value.createHistoryRecord(
      wasSuccess,
      currentRound.value,
      currentSession.value.id
    );

    // Add to history
    history.value.push(record);

    // Update score and lives
    if (wasSuccess) {
      score.value++;
    } else {
      lives.value--; // Reduce life if incorrect
    }

    // Check if we need a new round
    if (wasSuccess || lives.value === 0) {
      startNewRound();
    }
  }

  // Check if user's guess is correct based on game mode
  function checkGuess() {
    if (!currentGameMode.value) return;

    const isCorrect = currentGameMode.value.checkGuess();
    recordRound(isCorrect);
  }

  // Game mode specific action handlers - these delegate to the current game mode
  function updateUserColor(h, s, v) {
    if (currentGameMode.value && currentGameMode.value.updateUserColor) {
      currentGameMode.value.updateUserColor(h, s, v);
    }
  }

  function updateUserValueDifference(value) {
    if (currentGameMode.value && currentGameMode.value.updateUserValueDifference) {
      currentGameMode.value.updateUserValueDifference(value);
    }
  }

  // Settings update functions
  function updateMode(newMode) {
    preferences.value.mode = newMode;
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
  }

  // Game statistics
  const winRate = computed(() => {
    if (currentRound.value === 1) {
      return '0%';
    }

    let successfulRounds = history.value
      .filter((item) => item.sessionId === currentSession.value?.id)
      .filter((item, i, arr) => {
        // Is this the last try of the round or last item in history?
        return item.wasSuccess && (i === arr.length - 1 || arr[i + 1].round !== item.round);
      }).length;

    const winPercentage = (successfulRounds / (currentRound.value - 1)) * 100;
    return `${parseInt(winPercentage, 10)}%`;
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

      if (lastTryOfRound && lastTryOfRound.wasSuccess) {
        streak++;
        roundToCheck--;
      } else {
        break;
      }
    }

    return streak;
  });

  const MAX_RECORDS = 50;

  const lastTriesOfEachRound = computed(() => {
    let lastRecords = history.value.slice(-MAX_RECORDS);
    const tries = [];
    let lastRoundId = -1;

    for (let i = lastRecords.length - 1; i >= 0; i--) {
      let record = lastRecords[i];
      if (record && record.round !== lastRoundId) {
        tries.push(record);
        lastRoundId = record.round;
      }

      if (tries.length === MAX_RECORDS) {
        break;
      }
    }

    return tries.map((tryRecord) => {
      const session = sessions.value.find((s) => s.id === tryRecord.sessionId);
      return {
        ...tryRecord,
        session: session ? Object.assign({}, session) : undefined,
      };
    }).filter(r => r.session); // Filter out records with no session
  });

  // Initialize without starting a game
  if (!currentSession.value) {
    const session = createSession({
      maxLife: maxLife.value,
      precision: precision.value,
      mode: mode.value,
      gameType: gameType.value
    });
    currentSession.value = session;
    sessions.value.push(session);
    initGameMode();
  }

  // Export all needed state and methods
  return {
    // Session data
    currentSession,
    sessions,

    // Game state
    currentRound,
    lives,
    maxLife,
    precision,
    mode,
    realtimePreview,
    score,
    gameType,

    // Game history
    history,

    // UI state
    recordPopupOpen,
    toggleRecordPopup,
    settingsPopupOpen,
    toggleSettingsPopup,
    aboutPopupOpen,
    toggleAboutPopup,
    resetPopupOpen,
    toggleResetPopup,
    settingsMode,

    // Game actions
    startOver,
    startNewRound,
    checkGuess,
    updateUserColor,
    updateUserValueDifference,

    // Settings actions
    updateMode,
    updatePrecision,
    updateMaxLife,
    updateRealtimePreview,
    updateGameType,

    // Statistics
    winRate,
    winningStreak,
    lastTriesOfEachRound,

    // Current game mode and state
    get currentModeState() {
      return currentGameMode.value?.state;
    },

    // Convenience properties mapped from current game mode state
    get randomColor() {
      return currentGameMode.value?.state?.randomColor;
    },
    get userColor() {
      return currentGameMode.value?.state?.userColor;
    },
    get relativeColors() {
      return currentGameMode.value?.state?.relativeColors;
    },
    get userValueDifference() {
      return currentGameMode.value?.state?.userValueDifference;
    },
    get surroundingColor() {
      return currentGameMode.value?.state?.surroundingColor;
    },
    get colorOptions() {
      return currentGameMode.value?.state?.colorOptions;
    },
  };
});
