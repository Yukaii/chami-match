import type { Challenge } from "../types";
import type { IChallengeStore } from "./base";

/**
 * In-memory implementation of the IChallengeStore interface.
 * Suitable for development, testing, or environments without persistent storage.
 */
export class MemoryStore implements IChallengeStore {
  // Simple in-memory store using a Map
  // Key: challengeId (string), Value: Challenge object
  private challenges = new Map<string, Challenge>();

  // Key: accessCode (string), Value: challengeId (string)
  private accessCodeIndex = new Map<string, string>();

  addChallenge(challenge: Challenge): void {
    if (this.challenges.has(challenge.id)) {
      throw new Error(`Challenge with ID ${challenge.id} already exists.`);
    }
    if (this.accessCodeIndex.has(challenge.accessCode)) {
      // This should ideally not happen if access codes are unique enough
      console.warn(
        `Access code ${challenge.accessCode} collision! Overwriting.`,
      );
      // Handle collision? For now, overwrite. Consider regeneration logic later.
      const existingChallengeId = this.accessCodeIndex.get(
        challenge.accessCode,
      );
      if (existingChallengeId) {
        const existingChallenge = this.challenges.get(existingChallengeId);
        if (existingChallenge) {
          // Remove old challenge's access code link if it differs
          this.accessCodeIndex.delete(existingChallenge.accessCode);
        }
      }
    }
    this.challenges.set(challenge.id, challenge);
    this.accessCodeIndex.set(challenge.accessCode, challenge.id);
    console.log(
      `[MemoryStore] Challenge added: ${challenge.id} (${challenge.accessCode})`,
    );
  }

  getChallengeById(id: string): Challenge | undefined {
    return this.challenges.get(id);
  }

  getChallengeByAccessCode(accessCode: string): Challenge | undefined {
    const challengeId = this.accessCodeIndex.get(accessCode);
    return challengeId ? this.challenges.get(challengeId) : undefined;
  }

  updateChallenge(challenge: Challenge): void {
    const existingChallenge = this.challenges.get(challenge.id);
    if (!existingChallenge) {
      throw new Error(
        `Challenge with ID ${challenge.id} not found for update.`,
      );
    }

    // If access code changed, update the index
    if (existingChallenge.accessCode !== challenge.accessCode) {
      // Check for collision with the new access code
      if (this.accessCodeIndex.has(challenge.accessCode)) {
        console.warn(
          `Access code ${challenge.accessCode} collision during update! Overwriting.`,
        );
        const collidingChallengeId = this.accessCodeIndex.get(
          challenge.accessCode,
        );
        if (collidingChallengeId && collidingChallengeId !== challenge.id) {
          // Remove the colliding entry if it belongs to a different challenge
          this.accessCodeIndex.delete(challenge.accessCode);
        }
      }
      // Remove old access code index entry
      this.accessCodeIndex.delete(existingChallenge.accessCode);
      // Add new access code index entry
      this.accessCodeIndex.set(challenge.accessCode, challenge.id);
    }

    this.challenges.set(challenge.id, challenge);
    console.log(`[MemoryStore] Challenge updated: ${challenge.id}`);
  }

  resetStore(): void {
    this.challenges.clear();
    this.accessCodeIndex.clear();
    console.log("[MemoryStore] In-memory store reset.");
  }

  cleanupExpiredChallenges(): void {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [id, challenge] of this.challenges.entries()) {
      if (challenge.expiresAt && now > challenge.expiresAt) {
        // Remove from access code index first
        this.accessCodeIndex.delete(challenge.accessCode);
        // Remove from challenges map
        this.challenges.delete(id);
        cleanedCount++;
        console.log(
          `[MemoryStore] Cleaned up expired challenge: ${id} (Access Code: ${challenge.accessCode})`,
        );
      }
    }
    if (cleanedCount > 0) {
      console.log(
        `[MemoryStore] Expired challenge cleanup complete. Removed ${cleanedCount} challenges.`,
      );
    } else {
      console.log("[MemoryStore] No expired challenges found during cleanup.");
    }
  }
}
