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

export function resetGameData() {
  localStorage.removeItem('sessions')
  localStorage.removeItem('preferences')
  localStorage.removeItem('history')
  window.location.reload()
}

export const useGlobalGameState = createGlobalState(() => {
  const sessions = useStorage('sessions', [])
  const preferences = useStorage('preferences', { maxLife: 5, precision: 10, mode: 'Color', realtimePreview: false })
  const history = useStorage('history', [])

  const currentSession = ref(null)

  // State
  const currentRound = ref(0)
  const maxLife = computed(() => preferences.value.maxLife || 5)
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
    lives.value = maxLife.value

    // Generate new randomColor
    const random = generateRandomColor(mode.value)
    randomColor.h = random.h
    randomColor.s = random.s
    randomColor.v = random.v
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

  // Action to check if user's guess is correct or not
  function checkGuess() {
    const hIsGood = Math.abs(randomColor.h - userColor.h) <= precision.value
    const sIsGood = Math.abs(randomColor.s - userColor.s) <= precision.value
    const vIsGood = Math.abs(randomColor.v - userColor.v) <= precision.value

    recordRound(hIsGood && sIsGood && vIsGood)
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
  }
})
