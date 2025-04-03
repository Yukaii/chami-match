<template>
  <Modal size="medium" :is-open="store.challengePopupOpen" @on-close="onClose">
    <div class="mb-4 text-center text-lg font-bold text-gray-900 dark:text-white">{{ $t('challenge.title') || 'Challenges' }}</div>

    <!-- Challenge content will go here -->
    <div class="space-y-4">
      <!-- Join Challenge Section -->
      <div class="border-t pt-4 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2 text-center text-gray-700 dark:text-gray-300">{{ $t('joinChallenge') }}</h3>
        <div class="flex gap-2">
          <input
            v-model="accessCode"
            type="text"
            maxlength="6"
            :placeholder="$t('accessCode')"
            class="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-orange-400 uppercase text-center tracking-widest font-mono"
            @keyup.enter="handleJoinChallenge"
          />
          <BaseButton
            variant="success"
            is3d
            :disabled="isApiLoading || accessCode.length !== 6"
            @click="handleJoinChallenge"
          >
            {{ isApiLoading ? $t('loading') : $t('join') }}
          </BaseButton>
        </div>
        <p v-if="apiError" class="text-red-500 text-sm mt-1 text-center">{{ apiError }}</p>
      </div>

      <!-- Joined Challenges List -->
      <div v-if="store.joinedChallenges.length > 0" class="border-t pt-4 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2 text-center text-gray-700 dark:text-gray-300">{{ $t('joinedChallengesTitle') || 'Joined Challenges' }}</h3>
        <ul class="space-y-2 max-h-40 overflow-y-auto">
          <li v-for="challenge in store.joinedChallenges" :key="challenge.id" class="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <span class="truncate mr-2">{{ challenge.name }} ({{ challenge.accessCode }})</span>
            <BaseButton variant="outline" size="xs" @click="rejoinChallenge(challenge.id)">
              {{ $t('viewPlay') || 'View/Play' }}
            </BaseButton>
          </li>
        </ul>
      </div>

      <!-- Server Unavailable Message -->
       <div v-if="!store.isServerAvailable" class="border-t pt-4 dark:border-gray-700">
          <div class="text-center text-red-500 dark:text-red-400">
            {{ $t('serverUnavailable') }}
          </div>
        </div>
    </div>

    <!-- Close button or other actions if needed -->
    <div class="mt-6 flex justify-end">
       <BaseButton variant="secondary" @click="onClose">
         {{ $t('close') || 'Close' }}
       </BaseButton>
    </div>
  </Modal>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useChallengeApi } from "../composables/useChallengeApi";
import { useGameStore } from "../stores/game";
import Modal from "./Modal.vue";
import BaseButton from "./base/BaseButton.vue";

const { t: $t } = useI18n();
const store = useGameStore();
const router = useRouter();
const route = useRoute(); // Keep route if needed for URL params within the modal logic
const {
	joinChallenge,
	getChallengeById,
	isLoading: isApiLoading,
	error: apiError,
} = useChallengeApi();

const accessCode = ref("");

// --- Logic moved from WelcomeScreen ---

const handleJoinChallenge = async () => {
	apiError.value = null; // Clear previous errors
	if (!accessCode.value || accessCode.value.length !== 6) {
		apiError.value =
			$t("error.invalidAccessCode") ||
			"Please enter a valid 6-character access code.";
		return;
	}

	const payload = {
		accessCode: accessCode.value.toUpperCase(), // Ensure uppercase
		deviceId: store.deviceId,
		displayName: store.preferences.displayName || "Player", // Use stored name
		// userId: store.userId, // Add if user auth exists
	};

	try {
		console.log("Joining challenge with payload:", payload);
		const challenge = await joinChallenge(payload);
		console.log("Joined challenge:", challenge);

		// Find the participant record for the current device
		const myParticipant = challenge.participants.find(
			(p) => p.deviceId === store.deviceId,
		);

		if (!myParticipant) {
			console.error(
				"Could not find own participant record after joining challenge.",
			);
			apiError.value =
				$t("error.joinVerificationFailed") ||
				"Error: Could not verify participation after joining.";
			return;
		}

		// Store challenge context in Pinia
		store.currentChallengeId = challenge.id;
		store.currentParticipantId = myParticipant.id;

		// Add to list of joined challenges (avoid duplicates)
		if (!store.joinedChallenges.some((c) => c.id === challenge.id)) {
			store.joinedChallenges.push({
				id: challenge.id,
				name: challenge.name,
				accessCode: challenge.accessCode,
			});
		}

		// Set the game type based on the challenge settings
		store.updateGameType(challenge.settings.gameType);

		// Find the route for the challenge's game type using store.gameModes
		const gameModeRoute =
			store.gameModes.find((mode) => mode.type === challenge.settings.gameType)
				?.route || "/game"; // Default to standard game

		// Start a new game session for the challenge
		store.startOver(); // This resets score/round and sets challenge IDs to null, need to re-set them

		// Re-set challenge context after startOver clears it
		store.currentChallengeId = challenge.id;
		store.currentParticipantId = myParticipant.id;

		// Close the popup and navigate
		onClose();
		router.push(gameModeRoute);
	} catch (err) {
		// apiError should be set by the composable, but log the error just in case
		console.error("Failed to join challenge:", err, apiError.value);
		// Ensure apiError has a fallback message if the composable didn't set one
		if (!apiError.value) {
			apiError.value = $t("error.joinFailed") || "Error joining challenge";
		}
	}
};

const rejoinChallenge = async (challengeId) => {
	apiError.value = null; // Clear previous errors
	try {
		console.log("Rejoining challenge:", challengeId);
		const challenge = await getChallengeById(challengeId); // Fetch challenge details
		console.log("Fetched challenge details:", challenge);

		// Find the participant record for the current device
		const myParticipant = challenge.participants.find(
			(p) => p.deviceId === store.deviceId,
		);

		if (!myParticipant) {
			console.error(
				"Could not find own participant record in challenge:",
				challengeId,
			);
			apiError.value =
				$t("error.rejoinParticipantNotFound") ||
				"Error: You don't seem to be a participant in this challenge anymore.";
			store.joinedChallenges = store.joinedChallenges.filter(
				(c) => c.id !== challengeId,
			);
			return;
		}

		// Store challenge context in Pinia
		store.currentChallengeId = challenge.id;
		store.currentParticipantId = myParticipant.id;

		// Set the game type based on the challenge settings
		store.updateGameType(challenge.settings.gameType);

		// Find the route for the challenge's game type using store.gameModes
		const gameModeRoute =
			store.gameModes.find((mode) => mode.type === challenge.settings.gameType)
				?.route || "/game"; // Default to standard game

		// Start a new game session for the challenge
		store.startOver(); // This resets score/round and sets challenge IDs to null, need to re-set them

		// Re-set challenge context after startOver clears it
		store.currentChallengeId = challenge.id;
		store.currentParticipantId = myParticipant.id;

		// Close the popup and navigate
		onClose();
		router.push(gameModeRoute);
	} catch (err) {
		// apiError should be set by the composable, but log the error just in case
		console.error("Failed to rejoin challenge:", err, apiError.value);
		// Ensure apiError has a fallback message if the composable didn't set one
		if (!apiError.value) {
			apiError.value = $t("error.rejoinFailed") || "Error rejoining challenge";
		}
	}
};

// --- End of moved logic ---

const onClose = () => {
	store.toggleChallengePopup(); // Use the new toggle function
};

// If the URL param logic needs to stay with the popup opening mechanism,
// it might need adjustment or be handled in WelcomeScreen before opening.
// For now, keeping the onMounted check here, but it might be redundant
// if the popup isn't open when the WelcomeScreen mounts.
onMounted(() => {
	// Check for challenge code in URL query params when the component mounts
	// This might be better handled in WelcomeScreen before opening the popup
	const codeFromQuery = route.query.challengeCode;
	if (
		codeFromQuery &&
		typeof codeFromQuery === "string" &&
		codeFromQuery.length === 6
	) {
		// Potentially pre-fill the access code if the popup is opened due to the param
		// accessCode.value = codeFromQuery.toUpperCase();
		// Or trigger the join confirmation logic if that's moved here too.
		// For now, just logging it.
		console.log(
			"Challenge code from URL detected in ChallengePopup:",
			codeFromQuery,
		);
	}
});
</script>
