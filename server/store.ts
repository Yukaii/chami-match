import type { Challenge } from './types';

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
      throw new Error(`Challenge with ID ${challenge.id} not found for update.`);
    }
    challenges.set(challenge.id, challenge);
     console.log(`Challenge updated: ${challenge.id}`);
  },

  // Function to reset the store (for testing)
  resetStore: (): void => {
    challenges.clear();
    accessCodeIndex.clear();
    console.log('In-memory store reset.');
  }

  // TODO: Add methods for adding participants, attempts, etc.
  // TODO: Add cleanup logic for expired challenges
};
