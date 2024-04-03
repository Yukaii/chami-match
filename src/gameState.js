import { createGlobalState } from '@vueuse/core'
import { ref, reactive } from 'vue'

export const useGlobalGameState = createGlobalState(() => {
  // State
  const currentRound = ref(1)
  const maxLife = ref(5)
  const lives = ref(maxLife.value)
  const precision = ref(10)
  const mode = ref('Color') // default to "Color", can also be "B/W"
  const randomColor = reactive({
    h: Math.floor(Math.random() * 360),
    s: Math.floor(Math.random() * 100),
    v: Math.floor(Math.random() * 100),
  })
  const userColor = reactive({ h: 0, s: 0, v: 0 }) // default to zero, user has to change
  const score = ref(0)
  const history = ref([])

  // Getters
  // Add any computed property getters here if required

  // Actions
  function startNewRound() {
    // Increment the round, reset the lives and userColor
    currentRound.value++
    lives.value = maxLife.value

    // Generate new randomColor
    randomColor.h = Math.floor(Math.random() * 360)
    randomColor.s = Math.floor(Math.random() * 100)
    randomColor.v = Math.floor(Math.random() * 100)
  }

  function recordRound(wasSuccess) {
    // Record the round history
    history.value.push({
      round: currentRound.value,
      guessedColor: userColor,
      actualColor: randomColor,
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
    mode.value = newMode
  }

  // Action to change precision value
  function updatePrecision(newPrecision) {
    precision.value = newPrecision
  }

  // Action to check if user's guess is correct or not
  function checkGuess() {
    const hIsGood = Math.abs(randomColor.h - userColor.h) <= precision.value
    const sIsGood = Math.abs(randomColor.s - userColor.s) <= precision.value
    const vIsGood = Math.abs(randomColor.v - userColor.v) <= precision.value

    recordRound(hIsGood && sIsGood && vIsGood)
  }

  return {
    currentRound,
    maxLife,
    lives,
    precision,
    mode,
    randomColor,
    userColor,
    score,
    history,
    startNewRound,
    recordRound,
    updateUserColor,
    updateMode,
    updatePrecision,
    checkGuess,
  }
})
