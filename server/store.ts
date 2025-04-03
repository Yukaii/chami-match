import type { Challenge } from "./types";

// Simple in-memory store using a Map
// Key: challengeId (string), Value: Challenge object
const challenges = new Map<string, Challenge>();

// Key: accessCode (string), Value: challengeId (string)
const accessCodeIndex = new Map<string, string>();

export const store = {
	addChallenge: (challenge: Challenge): void => {
		if (challenges.has(challenge.id)) {
			throw new Error(`Challenge with ID ${challenge.id} already exists.`);
		}
		if (accessCodeIndex.has(challenge.accessCode)) {
			// This should ideally not happen if access codes are unique enough
			console.warn(`Access code ${challenge.accessCode} collision!`);
			// Handle collision? For now, overwrite. Consider regeneration logic later.
		}
		challenges.set(challenge.id, challenge);
		accessCodeIndex.set(challenge.accessCode, challenge.id);
		console.log(`Challenge added: ${challenge.id} (${challenge.accessCode})`);
	},

	getChallengeById: (id: string): Challenge | undefined => {
		return challenges.get(id);
	},

	getChallengeByAccessCode: (accessCode: string): Challenge | undefined => {
		const challengeId = accessCodeIndex.get(accessCode);
		return challengeId ? challenges.get(challengeId) : undefined;
	},

	updateChallenge: (challenge: Challenge): void => {
		if (!challenges.has(challenge.id)) {
			throw new Error(
				`Challenge with ID ${challenge.id} not found for update.`,
			);
		}
		challenges.set(challenge.id, challenge);
		console.log(`Challenge updated: ${challenge.id}`);
	},

	// Function to reset the store (for testing)
	resetStore: (): void => {
		challenges.clear();
		accessCodeIndex.clear();
		console.log("In-memory store reset.");
	},

	// Function to remove expired challenges
	cleanupExpiredChallenges: (): void => {
		const now = Date.now();
		let cleanedCount = 0;
		for (const [id, challenge] of challenges.entries()) {
			if (challenge.expiresAt && now > challenge.expiresAt) {
				// Remove from access code index first
				accessCodeIndex.delete(challenge.accessCode);
				// Remove from challenges map
				challenges.delete(id);
				cleanedCount++;
				console.log(
					`Cleaned up expired challenge: ${id} (Access Code: ${challenge.accessCode})`,
				);
			}
		}
		if (cleanedCount > 0) {
			console.log(
				`Expired challenge cleanup complete. Removed ${cleanedCount} challenges.`,
			);
		} else {
			console.log("No expired challenges found during cleanup.");
		}
	},
};
