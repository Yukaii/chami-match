import { ref } from "vue";
import { useGameStore } from "../stores/game"; // Assuming Pinia store path

export function useChallengeApi() {
	const store = useGameStore(); // Use store instead of gameStore for consistency
	const isLoading = ref(false);
	const error = ref(null);

	// Generic API call helper
	const callApi = async (endpoint, method = "GET", body = null) => {
		isLoading.value = true;
		error.value = null;
		const url = `${store.challengeServerUrl}${endpoint}`; // Use URL from store

		try {
			const options = {
				method,
				headers: {
					"Content-Type": "application/json",
					// Add other headers like Authorization if needed later
				},
			};
			if (body) {
				options.body = JSON.stringify(body);
			}

			const response = await fetch(url, options);

			if (!response.ok) {
				// Attempt to parse error response, otherwise use status text
				let errorData;
				try {
					errorData = await response.json();
				} catch (parseError) {
					errorData = { message: response.statusText };
				}
				throw new Error(
					errorData.message || `HTTP error! status: ${response.status}`,
				);
			}

			// Handle cases where response might be empty (e.g., 204 No Content)
			if (response.status === 204) {
				return null;
			}

			return await response.json();
		} catch (err) {
			console.error(`API call failed: ${method} ${endpoint}`, err);
			error.value = err.message || "An unknown error occurred";
			throw err; // Re-throw to allow caller to handle
		} finally {
			isLoading.value = false;
		}
	};

	// --- Specific API Functions ---

	const createChallenge = async (payload) => {
		return callApi("/api/challenges", "POST", payload);
	};

	const joinChallenge = async (payload) => {
		return callApi("/api/challenges/join", "POST", payload);
	};

	const submitAttempt = async (challengeId, payload) => {
		return callApi(`/api/challenges/${challengeId}/attempts`, "POST", payload);
	};

	const getLeaderboard = async (challengeId) => {
		return callApi(`/api/challenges/${challengeId}/leaderboard`, "GET");
	};

	// Function to get challenge details by ID (Correctly placed)
	const getChallengeById = async (challengeId) => {
		// Use callApi helper for consistency
		return callApi(`/api/challenges/${challengeId}`, "GET");
	};

	return {
		isLoading,
		error,
		createChallenge,
		joinChallenge,
		submitAttempt,
		getLeaderboard,
		getChallengeById, // Add the new function here
	};
}
