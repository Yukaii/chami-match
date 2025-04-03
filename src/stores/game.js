import { useStorage } from "@vueuse/core";
import { nanoid } from "nanoid";
import { defineStore } from "pinia";
import { v4 as uuidv4 } from "uuid"; // Import uuid
import { computed, watch } from "vue";
import { useChallengeApi } from "../composables/useChallengeApi"; // Import challenge API
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

export const useGameStore = defineStore("game", {
	state: () => ({
		// Persistent storage (using useStorage from VueUse)
		sessions: useStorage("sessions", []),
		preferences: useStorage("preferences", {
			maxLife: 5,
			precision: 10,
			mode: "Color",
			colorSpace: "hsv", // Default color space
			realtimePreview: false,
			gameType: "standard",
			enableConfetti: true,
			lastPlayedGameType: null, // Track the last played game type
			recallTimeout: 5, // Default recall timeout
			displayName: "Player", // Default display name
		}),
		history: useStorage("history", []),

		challengeServerUrl: useStorage(
			"challengeServerUrl",
			"http://localhost:8787",
		), // Default URL, make it persistent
		deviceId: useStorage("deviceId", uuidv4()), // Generate and store device ID persistently

		// Session state
		currentSession: null,
		currentChallengeId: null, // ID of the active challenge, if any
		currentParticipantId: null, // ID of the current user within the active challenge
		joinedChallenges: useStorage("joinedChallenges", []), // Store { id, name, accessCode }

		// Game state
		currentRound: 0,
		score: 0,
		currentGameMode: null,

		// UI state
		recordPopupOpen: false,
		settingsPopupOpen: false,
		aboutPopupOpen: false,
		resetPopupOpen: false,
		createChallengePopupOpen: false,
		leaderboardPopupOpen: false, // State for leaderboard popup
		settingsMode: "global",

		// Other state
		lives: 5,
		attemptCount: 0,
	}),

	getters: {
		maxLife(state) {
			// Override maxLife for contextual and image mode to always be 2
			if (
				state.preferences.gameType === "contextual" ||
				state.preferences.gameType === "image" ||
				state.preferences.gameType === "recall"
			) {
				return 2;
			}
			return state.preferences.maxLife || 5;
		},
		precision(state) {
			return state.preferences.precision || 10;
		},
		mode(state) {
			return state.preferences.mode || "Color";
		},
		colorSpace(state) {
			return state.preferences.colorSpace || "hsv";
		},
		realtimePreview(state) {
			return state.preferences.realtimePreview || false;
		},
		gameType(state) {
			return state.preferences.gameType || "standard";
		},
		recallTimeout(state) {
			return state.preferences.recallTimeout || 5;
		},

		// Current game mode state accessors
		currentModeState(state) {
			return state.currentGameMode?.state;
		},
		randomColor(state) {
			return state.currentGameMode?.state?.randomColor;
		},
		userColor(state) {
			return state.currentGameMode?.state?.userColor;
		},
		relativeColors(state) {
			return state.currentGameMode?.state?.relativeColors;
		},
		userValueDifference(state) {
			return state.currentGameMode?.state?.userValueDifference;
		},
		surroundingColor(state) {
			return state.currentGameMode?.state?.surroundingColor;
		},
		colorOptions(state) {
			return state.currentGameMode?.state?.colorOptions || [];
		},

		// Game statistics
		winRate(state) {
			if (state.currentRound === 1) {
				return "0%";
			}

			const successfulRounds = state.history
				.filter((item) => item.sessionId === state.currentSession?.id)
				.filter((item, i, arr) => {
					// Is this the last try of the round or last item in history?
					return (
						item.wasSuccess &&
						(i === arr.length - 1 || arr[i + 1].round !== item.round)
					);
				}).length;

			const winPercentage = (successfulRounds / (state.currentRound - 1)) * 100;
			return `${Number.parseInt(winPercentage, 10)}%`;
		},

		winningStreak(state) {
			let streak = 0;
			let roundToCheck = state.currentRound - 1;

			while (roundToCheck > 0) {
				// Find the last try of the round
				const lastTryOfRound = state.history
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
		},

		lastTriesOfEachRound(state) {
			try {
				// Check if history is valid
				if (!Array.isArray(state.history)) {
					console.warn("History is not an array:", state.history);
					return [];
				}

				// Group records by session
				const recordsBySession = {};

				// Process all records from history
				state.history.forEach((record) => {
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
					const session = state.sessions.find((s) => s.id === sessionId);

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
								isCurrentSession: sessionId === state.currentSession?.id,
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
		},

		lastPlayedGameType(state) {
			return (
				state.preferences.lastPlayedGameType ||
				state.preferences.gameType ||
				"standard"
			);
		},
	},

	actions: {
		resetGameData() {
			localStorage.removeItem("sessions");
			localStorage.removeItem("preferences");
			localStorage.removeItem("history");
			window.location.reload();
		},

		initGameMode() {
			// Create game mode with current preferences
			const newMode = createGameMode(this.gameType, {
				colorMode: this.mode,
				colorSpace: this.colorSpace,
				precision: this.precision,
				realtimePreview: this.realtimePreview,
			});

			// Initialize mode-specific state
			const modeState = newMode.initState();
			newMode.state = modeState;

			// Update current game mode
			this.currentGameMode = newMode;

			return modeState;
		},

		startOver() {
			// Create a new session
			const session = createSession({
				maxLife: this.maxLife,
				precision: this.precision,
				mode: this.mode,
				gameType: this.gameType,
			});

			this.currentSession = session;
			this.sessions.push(session);

			// Reset challenge state when starting a new non-challenge game
			this.currentChallengeId = null;
			this.currentParticipantId = null;

			// Reset the round and score
			this.currentRound = 0;
			this.score = 0;
			this.lives = this.maxLife;

			// Initialize the game mode
			this.initGameMode();

			// Start a new round
			this.startNewRound();
		},

		startNewRound() {
			// Increment the round and reset lives
			this.currentRound++;
			this.lives = this.maxLife;
			this.attemptCount = 0;

			// Let the current game mode handle round initialization
			if (this.currentGameMode) {
				this.currentGameMode.startRound();

				// For contextual mode, ensure colorOptions are generated
				if (
					this.gameType === "contextual" &&
					(!this.currentGameMode.state.colorOptions ||
						this.currentGameMode.state.colorOptions.length === 0)
				) {
					this.currentGameMode.state.colorOptions =
						this.currentGameMode.generateColorOptions();
				}
			}
		},

		recordRound(wasSuccess) {
			if (!this.currentGameMode) return;

			try {
				// Increment attempt counter
				this.attemptCount++;

				// Get mode-specific record data
				const record = this.currentGameMode.createHistoryRecord(
					wasSuccess,
					this.currentRound,
					this.currentSession.id,
				);

				// Add common fields to ensure consistency
				const completeRecord = {
					id: nanoid(),
					timestamp: Date.now(),
					sessionId: this.currentSession.id,
					round: this.currentRound,
					gameType: this.gameType,
					wasSuccess,
					attempt: this.attemptCount,
					...record,
				};

				// Add to history
				this.history.push(completeRecord);

				// Update score and lives
				if (wasSuccess) {
					this.score++;

					// Only celebrate if this was the first attempt AND it was successful AND confetti is enabled
					if (this.attemptCount === 1 && this.preferences.enableConfetti) {
						celebrateFirstTry();
					}
				} else {
					this.lives--;
				}

				// Check if we need a new round
				if (wasSuccess || this.lives === 0) {
					this.startNewRound();
				}

				// If in a challenge, submit the attempt to the server
				// Ensure completeRecord is defined before submitting
				if (
					this.currentChallengeId &&
					this.currentParticipantId &&
					completeRecord
				) {
					this.submitChallengeAttempt(completeRecord);
				}
			} catch (error) {
				console.error("Error recording game round:", error);
			}
		},

		async submitChallengeAttempt(record) {
			// Now called explicitly after try block
			const { submitAttempt } = useChallengeApi(); // Get API function
			const payload = {
				participantId: this.currentParticipantId,
				score: this.score, // Submit the current total score
				sessionId: record.sessionId, // Include session ID
				deviceId: this.deviceId, // Include device ID for verification
				metadata: {
					// Construct metadata based on game state/record
					rounds: record.round, // Current round number
					mode: this.mode,
					gameType: this.gameType,
					precision: this.precision,
					// Add other relevant metadata from the record or game mode if needed
					// e.g., record.guessedColor, record.actualColor for standard mode
				},
			};

			try {
				console.log(
					`Submitting attempt for challenge ${this.currentChallengeId}`,
					payload,
				);
				const result = await submitAttempt(this.currentChallengeId, payload);
				console.log("Attempt submission result:", result);
				// Optionally update local state based on result, though leaderboard handles display
			} catch (error) {
				console.error("Failed to submit challenge attempt:", error);
				// Handle error - maybe notify user?
			}
		},

		checkGuess() {
			if (!this.currentGameMode) return;

			const isCorrect = this.currentGameMode.checkGuess();
			this.recordRound(isCorrect);
		},

		updateUserColor(h, s, v) {
			if (this.currentGameMode?.updateUserColor) {
				this.currentGameMode.updateUserColor(h, s, v);
			}
		},

		updateUserValueDifference(value) {
			if (this.currentGameMode?.updateUserValueDifference) {
				this.currentGameMode.updateUserValueDifference(value);
			}
		},

		// Settings updates
		updateMode(newMode) {
			this.preferences.mode = newMode;
		},

		updateColorSpace(newColorSpace) {
			this.preferences.colorSpace = newColorSpace;

			// If we have an active game mode, update its color space
			this.currentGameMode?.setColorSpace?.(newColorSpace);
		},

		updatePrecision(newPrecision) {
			this.preferences.precision = newPrecision;
		},

		updateMaxLife(newMaxLife) {
			this.preferences.maxLife = newMaxLife;
		},

		updateRealtimePreview(preview) {
			this.preferences.realtimePreview = preview;
		},

		updateGameType(newGameType) {
			this.preferences.gameType = newGameType;
			// Also update lastPlayedGameType
			this.preferences.lastPlayedGameType = newGameType;
			// Immediately update lives when game type changes
			this.lives =
				newGameType === "contextual" ||
				newGameType === "image" ||
				newGameType === "recall"
					? 2
					: this.preferences.maxLife || 5;
		},

		updateLastPlayedGameType(gameType) {
			// Specifically update only the last played game type
			this.preferences.lastPlayedGameType = gameType;
		},

		updateConfetti(enabled) {
			this.preferences.enableConfetti = enabled;
		},

		// Add new action for updating recall timeout
		updateRecallTimeout(newTimeout) {
			this.preferences.recallTimeout = newTimeout;
		},

		updateDisplayName(newName) {
			if (newName && newName.trim().length > 0) {
				this.preferences.displayName = newName.trim().slice(0, 50); // Limit length
			}
		},

		// Toggle UI states
		toggleRecordPopup() {
			this.recordPopupOpen = !this.recordPopupOpen;
		},

		toggleSettingsPopup() {
			this.settingsPopupOpen = !this.settingsPopupOpen;
		},

		toggleAboutPopup() {
			this.aboutPopupOpen = !this.aboutPopupOpen;
		},

		toggleResetPopup() {
			this.resetPopupOpen = !this.resetPopupOpen;
		},

		toggleCreateChallengePopup() {
			this.createChallengePopupOpen = !this.createChallengePopupOpen;
		},

		toggleLeaderboardPopup() {
			this.leaderboardPopupOpen = !this.leaderboardPopupOpen;
		},

		refreshGameRecords() {
			console.log("Force refreshing game records");
			// This is a hack to force the store to recognize history has changed
			this.history = [...this.history];
			return this.lastTriesOfEachRound;
		},

		migrateHistoryRecords() {
			try {
				if (Array.isArray(this.history)) {
					this.history = this.history.map((record) => {
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
		},

		// Initialize the store
		initStore() {
			if (!this.currentSession) {
				const session = createSession({
					maxLife: this.maxLife,
					precision: this.precision,
					mode: this.mode,
					gameType: this.gameType,
				});
				this.currentSession = session;
				this.sessions.push(session);
				this.initGameMode();
			}

			// Run migration when initializing
			this.migrateHistoryRecords();

			// Set up watches for state changes
			watch(
				() => this.preferences.gameType,
				(newGameType) => {
					this.lives =
						newGameType === "contextual" ||
						newGameType === "image" ||
						newGameType === "recall"
							? 2
							: this.preferences.maxLife || 5;
				},
			);
		},
	},
});
