import { useToggle, useStorage } from '@vueuse/core'
import { nanoid } from 'nanoid'

function createSession({ maxLife, precision, mode }) {
  return {
    id: nanoid(),
    startedAt: Math.floor(Date.now() / 1000), // UNIX timestamp
    maxLife,
    precision,
    mode,
  }
}

function generateRandomColor(mode) {
  switch (mode) {
    case 'B/W': {
      return {
        h: 0,
        s: 0,
        // from 5 to 100
        v: Math.floor(Math.random() * 95) + 5,
      }
    }
    case 'Color':
    default: {
      return {
        h: Math.floor(Math.random() * 360),
        s: Math.floor(Math.random() * 100),
        // from 5 to 100
        v: Math.floor(Math.random() * 95) + 5,
      }
    }
  }
}

// Generate a pair of colors with a specific value difference for relative mode
function generateRelativeValueColors(mode) {
  // First generate a base color
  const baseColor = generateRandomColor(mode);

  // Determine a random value difference between 10-90
  const valueDifference = Math.floor(Math.random() * 80) + 10;

  // Create the second color with the value difference
  const secondColor = { ...baseColor };

  // Ensure the second color's value stays within 0-100 range
  if (Math.random() > 0.5) {
    secondColor.v = Math.min(100, baseColor.v + valueDifference);
  } else {
    secondColor.v = Math.max(0, baseColor.v - valueDifference);
  }

  return {
    color1: baseColor,
    color2: secondColor,
    valueDifference: Math.abs(secondColor.v - baseColor.v)
  };
}

// Generate a single surrounding color for contextual mode
function generateSurroundingColor(targetColor, contrastLevel = 30) {
  // Create a color that contrasts with the target by a specific amount
  const hVariation = Math.random() > 0.5 ? contrastLevel : -contrastLevel
  const sVariation = Math.random() * 20 - 10
  const vVariation = Math.random() * 20 - 10

  const h = (targetColor.h + hVariation + 360) % 360
  const s = Math.max(0, Math.min(100, targetColor.s + sVariation))
  const v = Math.max(0, Math.min(100, targetColor.v + vVariation))

  return { h, s, v }
}

export function resetGameData() {
  localStorage.removeItem('sessions')
  localStorage.removeItem('preferences')
  localStorage.removeItem('history')
  window.location.reload()
}

export const useGlobalGameState = createGlobalState(() => {
  const sessions = useStorage('sessions', [])
  const preferences = useStorage('preferences', {
    maxLife: 5,
    precision: 10,
    mode: 'Color',
    realtimePreview: false,
    gameType: 'standard' // 'standard' or 'contextual'
  })
  const history = useStorage('history', [])

  const currentSession = ref(null)

  // State
  const currentRound = ref(0)
  const maxLife = computed(() => {
    // Override maxLife for contextual mode to always be 2
    if (preferences.value.gameType === 'contextual') {
      return 2
    }
    return preferences.value.maxLife || 5
  })
  const lives = ref(maxLife.value)
  const precision = computed(() => preferences.value.precision || 10)
  const mode = computed(() => preferences.value.mode || 'Color') // default to "Color", can also be "B/W"
  const realtimePreview = computed(() => preferences.value.realtimePreview || false)
  const randomColor = reactive(generateRandomColor(mode.value))
  const userColor = reactive({ h: 0, s: 0, v: 0 }) // default to zero, user has to change
  const score = ref(0)
  const [recordPopupOpen, toggleRecordPopup] = useToggle(false)
  const [settingsPopupOpen, toggleSettingsPopup] = useToggle(false)
  const [aboutPopupOpen, toggleAboutPopup] = useToggle(false)
  const [resetPopupOpen, toggleResetPopup] = useToggle(false)
  const settingsMode = ref('global') // 'global' or 'game'
  const gameType = computed(() => preferences.value.gameType || 'standard')
  const relativeColors = reactive({
    color1: { h: 0, s: 0, v: 0 },
    color2: { h: 0, s: 0, v: 0 },
    valueDifference: 0
  });
  const userValueDifference = ref(0);

  // Getters
  // Add any computed property getters here if required

  // Actions
  function startOver() {
    // add a new session
    const session = createSession(preferences.value)
    currentSession.value = session
    sessions.value.push(session)
    // reset the round
    currentRound.value = 0
    startNewRound()
  }

  function startNewRound() {
    // Increment the round, reset the lives and userColor
    currentRound.value++
    lives.value = maxLife.value // Will be 2 for contextual mode

    if (gameType.value === 'relative') {
      // Generate relative value difference colors
      const newColors = generateRelativeValueColors(mode.value);
      relativeColors.color1 = newColors.color1;
      relativeColors.color2 = newColors.color2;
      relativeColors.valueDifference = newColors.valueDifference;
      userValueDifference.value = 0;
    } else {
      // Generate new randomColor for standard/contextual modes
      const random = generateRandomColor(mode.value)
      randomColor.h = random.h
      randomColor.s = random.s
      randomColor.v = random.v

      // Reset user color
      userColor.h = 0
      userColor.s = 0
      userColor.v = 0
    }
  }

  function recordRound(wasSuccess) {
    // Record the round history
    history.value.push({
      sessionId: currentSession.value.id,
      round: currentRound.value,
      guessedColor: Object.assign({}, userColor),
      actualColor: Object.assign({}, randomColor),
      wasSuccess: wasSuccess,
    })

    // Update the score
    if (wasSuccess) {
      score.value++
    } else {
      lives.value-- // reduce life if the guess was incorrect
    }

    // Check if we need to start a new round
    if (wasSuccess || lives.value === 0) {
      startNewRound() // user guessed correctly or all lives were used, so start a new round
    }
  }

  // Action to update user's chosen color
  function updateUserColor(h, s, v) {
    userColor.h = h
    userColor.s = s
    userColor.v = v
  }

  // Action to change game mode
  function updateMode(newMode) {
    preferences.value.mode = newMode
  }

  // Action to change precision value
  function updatePrecision(newPrecision) {
    preferences.value.precision = newPrecision
  }

  function updateMaxLife(newMaxLife) {
    preferences.value.maxLife = newMaxLife
  }

  function updateRealtimePreview (preview) {
    preferences.value.realtimePreview = preview
  }

  // Function to update game type
  function updateGameType(newGameType) {
    preferences.value.gameType = newGameType
  }

  // Action to check if user's guess is correct or not
  function checkGuess() {
    const hIsGood = Math.abs(randomColor.h - userColor.h) <= precision.value
    const sIsGood = Math.abs(randomColor.s - userColor.s) <= precision.value
    const vIsGood = Math.abs(randomColor.v - userColor.v) <= precision.value

    recordRound(hIsGood && sIsGood && vIsGood)
  }

  // Check relative value difference guess
  function checkRelativeGuess() {
    // Allow a precision tolerance based on the precision setting
    const tolerance = precision.value / 2;
    const guessedDifference = userValueDifference.value;
    const actualDifference = relativeColors.valueDifference;

    const isCorrect = Math.abs(guessedDifference - actualDifference) <= tolerance;

    // Add to history
    history.value.push({
      sessionId: currentSession.value.id,
      round: currentRound.value,
      guessedDifference,
      actualDifference,
      wasSuccess: isCorrect,
    });

    // Update score and lives
    if (isCorrect) {
      score.value++;
    } else {
      lives.value--;
    }

    // Check if we need to start a new round
    if (isCorrect || lives.value === 0) {
      startNewRound();
    }
  }

  const winRate = computed(() => {
    if (currentRound.value === 1) {
      return '0%' // or return '--%' or 'No Games Yet' or any similar text indicating there's no history
    }

    let successfulRounds = history.value
      .filter((item) => item.sessionId === currentSession.value.id)
      .filter((item, i, arr) => {
        // is this the last try of the round or last item in history?
        return item.wasSuccess && (i === arr.length - 1 || arr[i + 1].round !== item.round)
      }).length

    const winPercentage = (successfulRounds / (currentRound.value - 1)) * 100
    return `${parseInt(winPercentage, 10)}%`
  })

  const winningStreak = computed(() => {
    let streak = 0
    let roundToCheck = currentRound.value - 1 // Start checking from the last completed round

    while (roundToCheck > 0) {
      // Find the last try of the round
      const lastTryOfRound = history.value
        .slice()
        .reverse()
        .find((item) => item.round === roundToCheck)

      if (lastTryOfRound && lastTryOfRound.wasSuccess) {
        streak++
        roundToCheck--
      } else {
        break // Exit loop if the last try was not successful or round not found in history
      }
    }

    return streak
  })

  const MAX_RECORDS = 50

  const lastTriesOfEachRound = computed(() => {
    let lastRecords = history.value.slice(-MAX_RECORDS) // Fetch last MAX_RECORDS records
    const tries = []
    let lastRoundId = -1

    for (let i = lastRecords.length - 1; i >= 0; i--) {
      let record = lastRecords[i]
      if (record.round !== lastRoundId) {
        tries.push(record)
        lastRoundId = record.round
      }

      if (tries.length === MAX_RECORDS) {
        break
      }
    }

    return tries.map((tryRecord) => {
      const session = sessions.value.find((s) => s.id === tryRecord.sessionId)
      return {
        ...tryRecord,
        session: Object.assign({}, session),
      }
    })
  })

  // Generate surrounding colors for contextual mode
  function generateSurroundingColors(color, count = 8) {
    const colors = []
    for (let i = 0; i < count; i++) {
      // Create color variations that are similar but different
      const hVariation = Math.random() * 20 - 10 // -10 to +10 variation
      const sVariation = Math.random() * 20 - 10 // -10 to +10 variation
      const vVariation = Math.random() * 20 - 10 // -10 to +10 variation

      const h = (color.h + hVariation + 360) % 360
      const s = Math.max(0, Math.min(100, color.s + sVariation))
      const v = Math.max(0, Math.min(100, color.v + vVariation))

      colors.push({ h, s, v })
    }
    return colors
  }

  // For contextual mode - now returns array with just one color (the surrounding color)
  const surroundingColors = computed(() => {
    if (gameType.value === 'contextual') {
      return [generateSurroundingColor(randomColor)]
    }
    return []
  })

  // Initialize without automatically starting the game
  if (!currentSession.value) {
    // Create session but don't start the game automatically
    const session = createSession(preferences.value)
    currentSession.value = session
    sessions.value.push(session)
  }

  return {
    currentSession,
    currentRound,
    maxLife,
    lives,
    precision,
    mode,
    realtimePreview,
    randomColor,
    userColor,
    score,
    history,
    preferences,
    startNewRound,
    recordRound,
    updateUserColor,
    updateMode,
    updatePrecision,
    updateMaxLife,
    updateRealtimePreview,
    updateGameType,
    checkGuess,
    winRate,
    winningStreak,
    recordPopupOpen,
    toggleRecordPopup,
    settingsPopupOpen,
    toggleSettingsPopup,
    aboutPopupOpen,
    toggleAboutPopup,
    resetPopupOpen,
    toggleResetPopup,
    lastTriesOfEachRound,
    startOver,
    settingsMode,
    gameType,
    surroundingColors,
    relativeColors,
    userValueDifference,
    checkRelativeGuess,
  }
})
