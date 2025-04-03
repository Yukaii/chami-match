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
            variant="primary"
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
      <div v-if="activeChallenges.length > 0" class="border-t pt-4 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2 text-center text-gray-700 dark:text-gray-300">{{ $t('joinedChallengesTitle') || 'Joined Challenges' }}</h3>
        <ul class="space-y-2 max-h-40 overflow-y-auto">
          <li v-for="challenge in activeChallenges" :key="challenge.id" class="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
            <div class="flex-1 min-w-0 mr-2"> <!-- Wrapper for text content -->
              <p class="truncate font-medium">{{ challenge.name }} ({{ challenge.accessCode }})</p>
              <p v-if="challenge.gameMode" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ $t(`gameModes.${challenge.gameMode}.name`, challenge.gameMode) }} <!-- Display game mode -->
              </p>
            </div>
            <BaseButton variant="outline" size="xs" @click="rejoinChallenge(challenge.id)" class="flex-shrink-0"> <!-- Prevent button shrinking -->
              {{ $t('play') || 'Play' }}
            </BaseButton>
          </li>
        </ul>
      </div>

      <!-- Expired/Unavailable Challenges List -->
      <div v-if="expiredChallenges.length > 0" class="border-t pt-4 dark:border-gray-700">
        <h3 class="text-lg font-semibold mb-2 text-center text-gray-500 dark:text-gray-400">{{ $t('expiredChallengesTitle') || 'Expired Challenges' }}</h3>
        <ul class="space-y-2 max-h-20 overflow-y-auto">
          <li v-for="challenge in expiredChallenges" :key="challenge.id" class="flex justify-between items-center p-2 bg-gray-200 dark:bg-gray-800 rounded opacity-60">
            <span class="truncate mr-2 text-gray-500 dark:text-gray-400">{{ challenge.name }} ({{ challenge.accessCode }})</span>
             <BaseButton variant="danger_outline" size="xs" @click="removeChallenge(challenge.id)">
               {{ $t('remove') || 'Remove' }}
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

    <!-- Confirmation Dialog Section -->
    <div v-if="challengeToRemoveId" class="mt-4 p-4 border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 rounded">
      <p class="text-sm text-red-700 dark:text-red-300 mb-3">
        {{ $t('confirmRemoveChallengeNotFoundMessage', { name: challengeToRemoveName }) || `You were not found in "${challengeToRemoveName}". Remove it from your list?` }}
      </p>
      <div class="flex justify-end gap-2">
        <BaseButton variant="danger" size="sm" @click="confirmRemoveChallenge">
          {{ $t('confirm') || 'Confirm' }}
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="cancelRemoveChallenge">
          {{ $t('cancel') || 'Cancel' }}
        </BaseButton>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"; // Added computed
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

// Computed property to get the current time as a Date object
const now = computed(() => new Date());

// Computed property for active challenges
const activeChallenges = computed(() => {
  return store.joinedChallenges.filter((challenge) => {
    if (!challenge.expiresAt) return true; // Assume active if no expiry date
    try {
      // Attempt to parse expiresAt, assuming it might be ISO string or timestamp number
      const expiryTimestamp =
        typeof challenge.expiresAt === "string"
          ? Date.parse(challenge.expiresAt)
          : Number(challenge.expiresAt) * 1000; // Assume seconds timestamp if number

      if (Number.isNaN(expiryTimestamp)) {
        console.error(
          "Invalid date format for expiresAt:",
          challenge.expiresAt,
        );
        return true; // Treat as active if parsing fails
      }
      return expiryTimestamp > now.value.getTime();
    } catch (e) {
      console.error(
        "Error processing challenge expiry date:",
        challenge.expiresAt,
        e,
      );
      return true; // Treat as active on error
    }
  });
});

// Computed property for expired or unavailable challenges
const expiredChallenges = computed(() => {
  return store.joinedChallenges.filter((challenge) => {
    if (!challenge.expiresAt) return false; // Not expired if no expiry date
    try {
      // Attempt to parse expiresAt, assuming it might be ISO string or timestamp number
      const expiryTimestamp =
        typeof challenge.expiresAt === "string"
          ? Date.parse(challenge.expiresAt)
          : Number(challenge.expiresAt) * 1000; // Assume seconds timestamp if number

      if (Number.isNaN(expiryTimestamp)) {
        console.error(
          "Invalid date format for expiresAt:",
          challenge.expiresAt,
        );
        return false; // Treat as not expired if parsing fails
      }
      return expiryTimestamp <= now.value.getTime();
    } catch (e) {
      console.error(
        "Error processing challenge expiry date:",
        challenge.expiresAt,
        e,
      );
      return false; // Treat as not expired on error
    }
  });
});

const {
  joinChallenge,
  getChallengeById,
  isLoading: isApiLoading,
  error: apiError,
} = useChallengeApi();

const accessCode = ref("");
const challengeToRemoveId = ref(null); // State for confirmation

// Computed property to get the name of the challenge to remove
const challengeToRemoveName = computed(() => {
  if (!challengeToRemoveId.value) return "";
  const challenge = store.joinedChallenges.find(
    (c) => c.id === challengeToRemoveId.value,
  );
  return challenge ? challenge.name : "this challenge";
});

// Function to remove challenge from store
const removeChallenge = (challengeId) => {
  store.joinedChallenges = store.joinedChallenges.filter(
    (c) => c.id !== challengeId,
  );
};

// Function to handle confirmation of removal
const confirmRemoveChallenge = () => {
  if (challengeToRemoveId.value) {
    removeChallenge(challengeToRemoveId.value);
    apiError.value = null; // Clear error after removal
    challengeToRemoveId.value = null; // Reset confirmation state
  }
};

// Function to cancel removal
const cancelRemoveChallenge = () => {
  challengeToRemoveId.value = null; // Reset confirmation state
  apiError.value = null; // Also clear the error message on cancel
};

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

    // Add to list of joined challenges (avoid duplicates), including expiration and gameMode
    if (!store.joinedChallenges.some((c) => c.id === challenge.id)) {
      store.joinedChallenges.push({
        id: challenge.id,
        name: challenge.name,
        accessCode: challenge.accessCode,
        expiresAt: challenge.expiresAt, // Store the expiration time
        gameMode: challenge.gameMode, // Store the game mode
      });
    } else {
      // If challenge already exists, ensure gameMode is updated (in case it was missing before)
      const existingChallengeIndex = store.joinedChallenges.findIndex(
        (c) => c.id === challenge.id,
      );
      if (
        existingChallengeIndex !== -1 &&
        !store.joinedChallenges[existingChallengeIndex].gameMode
      ) {
        store.joinedChallenges[existingChallengeIndex].gameMode =
          challenge.gameMode;
      }
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
      // Set the specific error message
      apiError.value =
        $t("error.rejoinParticipantNotFound") ||
        "Error: You don't seem to be a participant in this challenge anymore.";

      // Ask user for confirmation before removing
      const challengeToRemove = store.joinedChallenges.find(
        (c) => c.id === challengeId,
      );
      const challengeName = challengeToRemove
        ? challengeToRemove.name
        : "this challenge";
      const confirmMessage =
        $t("confirmRemoveChallengeNotFound", { name: challengeName }) ||
        `You were not found in "${challengeName}". Remove it from your list?`;

      if (window.confirm(confirmMessage)) {
        store.joinedChallenges = store.joinedChallenges.filter(
          (c) => c.id !== challengeId,
        );
      }
      return; // Prevent further execution after handling the error
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
    // Log the raw error first
    // Log the raw error first
    console.error("Failed to rejoin challenge:", err);

    // Check the caught error's message directly for 'Not Found' (case-insensitive) using optional chaining
    const isNotFoundError =
      err?.message &&
      typeof err.message === "string" &&
      err.message.toLowerCase().includes("not found");

    if (isNotFoundError) {
      // Set the user-facing error message
      apiError.value =
        $t("error.rejoinParticipantNotFound") ||
        "Error: You don't seem to be a participant in this challenge anymore.";
      // Set the ID of the challenge needing removal confirmation
      challengeToRemoveId.value = challengeId;
    } else {
      // Handle other potential errors from the API call
      // Use the error message from the caught error (with optional chaining), or a generic fallback
      apiError.value =
        err?.message || $t("error.rejoinFailed") || "Error rejoining challenge";
      console.error("Rejoin API Error (Other):", apiError.value);
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
