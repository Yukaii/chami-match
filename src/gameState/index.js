import { useStorage, useToggle } from "@vueuse/core";
import { nanoid } from "nanoid";
import { computed, reactive, ref, watch } from "vue"; // Add watch import
import { celebrateFirstTry } from "../utils/confetti";
import { createGameMode, ImageMode } from "./modes"; // Explicitly import ImageMode class here

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
	localStorage.removeItem("sessions");
	localStorage.removeItem("preferences");
	localStorage.removeItem("history");
	window.location.reload();
}

export const useGlobalGameState = createGlobalState(() => {
	// Persistent storage
	const sessions = useStorage("sessions", []);
	const preferences = useStorage("preferences", {
		maxLife: 5,
		precision: 10,
		mode: "Color",
		realtimePreview: false,
		gameType: "standard",
		enableConfetti: true, // Add new preference for confetti
	});
	const history = useStorage("history", []);

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
	const settingsMode = ref("global");

	// Computed properties
	const maxLife = computed(() => {
		// Override maxLife for contextual mode to always be 2
		if (preferences.value.gameType === "contextual") {
			return 2;
		}
		return preferences.value.maxLife || 5;
	});
	const lives = ref(maxLife.value);
	const precision = computed(() => preferences.value.precision || 10);
	const mode = computed(() => preferences.value.mode || "Color");
	const realtimePreview = computed(
		() => preferences.value.realtimePreview || false,
	);
	const gameType = computed(() => preferences.value.gameType || "standard");

	// Watch for game type changes and update lives accordingly
	watch(
		() => preferences.value.gameType,
		(newGameType) => {
			lives.value =
				newGameType === "contextual" ? 2 : preferences.value.maxLife || 5;
		},
	);

	// Track first attempt for each round
	const attemptCount = ref(0);

	// Initialize game mode with better error handling
	function initGameMode() {
		try {
			console.log("Initializing game mode for type:", gameType.value);

			// Create game mode with current preferences
			const newMode = createGameMode(gameType.value, {
				colorMode: mode.value,
				precision: precision.value,
				realtimePreview: realtimePreview.value,
			});

			if (!newMode) {
				console.error("Failed to create game mode for type:", gameType.value);
				return null;
			}

			// Special handling for image mode to ensure it's properly initialized
			if (gameType.value === "image" && !(newMode instanceof ImageMode)) {
				console.error("Created mode is not a proper ImageMode instance! Forcing direct creation.");
				const imageMode = new ImageMode({
					colorMode: mode.value,
					precision: precision.value,
					realtimePreview: realtimePreview.value,
				});

				// Initialize mode-specific state
				const modeState = imageMode.initState();
				imageMode.state = modeState;

				// Update current game mode
				currentGameMode.value = imageMode;
				console.log("Directly created ImageMode:",
					typeof imageMode.selectRandomColorFromImage === "function" ? "has" : "missing",
					"selectRandomColorFromImage method");

				return modeState;
			}

			// Normal initialization for other modes
			const modeState = newMode.initState();
			newMode.state = modeState;

			// Update current game mode
			currentGameMode.value = newMode;
			console.log("Game mode initialized:", newMode.type,
				"has required methods:",
				gameType.value === "image" ?
					typeof newMode.selectRandomColorFromImage === "function" : true);

			return modeState;
		} catch (error) {
			console.error("Error initializing game mode:", error);
			return null;
		}
	}

	// Start a new game with better error handling
	function startOver() {
		try {
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
			lives.value = maxLife.value; // Explicitly reset lives based on maxLife

			// Initialize the game mode
			const modeState = initGameMode();

			if (!modeState || !currentGameMode.value) {
				console.error("Failed to initialize game mode in startOver");
				return;
			}

			// Start a new round
			startNewRound();
		} catch (error) {
			console.error("Error in startOver:", error);
		}
	}

	// Start a new round
	function startNewRound() {
		// Increment the round and reset lives
		currentRound.value++;
		lives.value = maxLife.value;
		attemptCount.value = 0; // Reset attempt counter for the new round

		// Let the current game mode handle round initialization
		if (currentGameMode.value) {
			currentGameMode.value.startRound();
		}
	}

	// Record a round in history with better error handling and consistent format
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
				id: nanoid(), // Unique ID for each record
				timestamp: Date.now(),
				sessionId: currentSession.value.id,
				round: currentRound.value,
				gameType: gameType.value,
				wasSuccess,
				attempt: attemptCount.value, // Track which attempt this was
				...record, // Include mode-specific fields
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

	// Check if user's guess is correct based on game mode
	function checkGuess() {
		if (!currentGameMode.value) return;

		const isCorrect = currentGameMode.value.checkGuess();
		recordRound(isCorrect);
	}

	// Game mode specific action handlers - these delegate to the current game mode
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

	// Update game type and initialize immediately
	function updateGameType(newGameType) {
		console.log("Updating game type to:", newGameType, "from:", preferences.value.gameType);

		// Update the preference value
		preferences.value.gameType = newGameType;

		// Immediately update lives when game type changes
		lives.value = newGameType === "contextual" ? 2 : preferences.value.maxLife || 5;

		// For image mode, initialize right away to avoid race conditions
		if (newGameType === 'image') {
			console.log("Creating ImageMode directly on type change");
			const imageMode = new ImageMode({
				colorMode: mode.value,
				precision: precision.value,
				realtimePreview: realtimePreview.value,
			});

			// Initialize mode-specific state
			const modeState = imageMode.initState();
			imageMode.state = modeState;
			currentGameMode.value = imageMode;
		}
	}

	function updateConfetti(enabled) {
		preferences.value.enableConfetti = enabled;
	}

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

	const MAX_RECORDS = 50;

	// Add data migration function to handle old record formats
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

	// Run migration when initializing
	migrateHistoryRecords();

	// Improved record retrieval with better error handling - modified to show all sessions
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
				const sessionRecords = Array.from(recordsBySession[sessionId].values());

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

			return allRecords.slice(0, MAX_RECORDS);
		} catch (error) {
			console.error("Error getting round history:", error);
			return [];
		}
	});

	// Add a method to force record computation - useful for debugging
	function refreshGameRecords() {
		console.log("Force refreshing game records");
		// This is a hack to force the computed property to re-evaluate
		const temp = [...history.value];
		history.value = temp;
		return lastTriesOfEachRound.value;
	}

// Before initializing a session, force new session for image mode
if (gameType.value === "image") {
	// Clear any persisted session for image mode
	currentSession.value = null;
}

// Initialize without starting a game
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

	function updateModeState(newState) {
		if (!currentGameMode.value?.state) {
			console.warn('No current mode state to update');
			return;
		}

		// Update individual properties instead of replacing the whole object
		Object.assign(currentGameMode.value.state, newState);
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
		preferences, // Expose preferences for direct access

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
		updateConfetti, // Add new setting method

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
		refreshGameRecords, // Add this new method
		attemptCount, // Add current attempts count
		currentGameMode, // Expose currentGameMode directly for components

		// Add direct ImageMode access
		getImageMode() {
			if (currentGameMode.value?.type === 'image') {
				return currentGameMode.value;
			}

			// Create one if needed
			console.log("Creating new ImageMode on demand");
			const imageMode = new ImageMode({
				colorMode: mode.value,
				precision: precision.value,
				realtimePreview: realtimePreview.value
			});

			// Initialize it
			const modeState = imageMode.initState();
			imageMode.state = modeState;

			// Return the new instance
			return imageMode;
		},
		updateModeState,
	};
});
