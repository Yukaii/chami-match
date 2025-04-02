<script setup>
import { ref } from "vue";
import { useGameStore } from "../stores/game";
import { useChallengeApi } from "../composables/useChallengeApi";
import Modal from "./Modal.vue";
import BaseButton from "./base/BaseButton.vue";

const store = useGameStore();
const { createChallenge, isLoading, error } = useChallengeApi();
const emit = defineEmits(["close", "challengeCreated"]);

const challengeName = ref("");
const expiration = ref("1h"); // Default expiration
const createdChallengeInfo = ref(null); // To store { id, accessCode, name, expiresAt }

const expirationOptions = [
	{ value: "1h", label: "1 Hour" },
	{ value: "24h", label: "24 Hours" },
	{ value: "3d", label: "3 Days" },
	{ value: "7d", label: "7 Days" },
	{ value: null, label: "Never" }, // Represent 'Never' as null or undefined
];

const resetForm = () => {
	challengeName.value = "";
	expiration.value = "1h";
	error.value = null;
	createdChallengeInfo.value = null;
};

const closePopup = () => {
	resetForm();
	emit("close");
};

const submitCreateChallenge = async () => {
	if (!challengeName.value) {
		error.value = $t("challenge.nameRequired");
		return;
	}

	const payload = {
		name: challengeName.value,
		expiresIn: expiration.value || undefined, // Send undefined if 'Never' selected
		gameMode: store.mode,
		settings: {
			precision: store.precision,
			maxLife: store.maxLife,
			gameType: store.gameType,
		},
		deviceId: store.deviceId,
		displayName: store.preferences.displayName || "Player", // Use stored name
	};

	try {
		const result = await createChallenge(payload);
		createdChallengeInfo.value = result; // Store result to show sharing info

		// Also store the challenge context in Pinia for the creator
		store.currentChallengeId = result.id;
		store.currentParticipantId = result.participantId; // Get participant ID from response
	} catch (err) {
		console.error("Failed to create challenge:", error.value);
	}
};

// Function to copy text to clipboard
const copyToClipboard = async (text) => {
	try {
		await navigator.clipboard.writeText(text);
		alert("Copied to clipboard!");
	} catch (err) {
		console.error("Failed to copy text: ", err);
		alert("Failed to copy to clipboard.");
	}
};

const getChallengeUrl = () => {
	if (!createdChallengeInfo.value) return "";
	return `Access Code: ${createdChallengeInfo.value.accessCode}`;
};
</script>

<template>
  <Modal :is-open="true" @close="closePopup">
    <template #header>
      <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-white">
        {{ createdChallengeInfo ? $t('challenge.createdTitle') : $t('challenge.createTitle') }}
      </h3>
    </template>

    <div class="mt-2">
      <template v-if="!createdChallengeInfo">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {{ $t('challenge.setupInfo') }}
        </p>
        <form @submit.prevent="submitCreateChallenge">
          <div class="mb-4">
            <label for="challengeName" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('challenge.name') }}</label>
            <input
              type="text"
              id="challengeName"
              v-model="challengeName"
              required
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-orange-500 dark:focus:border-orange-500"
            />
          </div>

          <div class="mb-4">
            <label for="expiration" class="block text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('challenge.expiresIn') }}</label>
            <select
              id="expiration"
              v-model="expiration"
              class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-orange-500 dark:focus:border-orange-500"
            >
              <option v-for="option in expirationOptions" :key="option.value ?? 'null'" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <p v-if="error" class="text-sm text-red-500 mb-3">{{ error }}</p>

          <div class="mt-4 flex justify-end space-x-2">
            <BaseButton type="button" variant="secondary" @click="closePopup">{{ $t('cancel') }}</BaseButton>
            <BaseButton type="submit" variant="primary" :disabled="isLoading">
              {{ isLoading ? $t('loading') : $t('create') }}
            </BaseButton>
          </div>
        </form>
      </template>
      <template v-else>
         <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {{ $t('challenge.shareCode') }}
         </p>
         <div class="p-3 bg-gray-100 dark:bg-gray-700 rounded font-mono text-center text-xl tracking-widest my-3">
            {{ createdChallengeInfo.accessCode }}
         </div>
         <p v-if="createdChallengeInfo.expiresAt" class="text-xs text-gray-500 dark:text-gray-400 text-center mb-3">
            Expires: {{ new Date(createdChallengeInfo.expiresAt).toLocaleString() }}
         </p>
         <div class="flex justify-center space-x-2">
             <BaseButton variant="secondary" @click="copyToClipboard(createdChallengeInfo.accessCode)">{{ $t('challenge.copyCode') }}</BaseButton>
             <BaseButton variant="primary" @click="closePopup">{{ $t('challenge.done') }}</BaseButton>
         </div>
      </template>
    </div>
  </Modal>
</template>
