import type { Challenge } from "../types";

/**
 * Interface defining the contract for challenge storage.
 * Any storage implementation (in-memory, KV, database, etc.) should implement these methods.
 */
export interface IChallengeStore {
  /**
   * Adds a new challenge to the store.
   * Throws an error if a challenge with the same ID already exists.
   * @param challenge - The challenge object to add.
   */
  addChallenge(challenge: Challenge): Promise<void> | void;

  /**
   * Retrieves a challenge by its unique ID.
   * @param id - The ID of the challenge to retrieve.
   * @returns The challenge object, or undefined if not found.
   */
  getChallengeById(
    id: string,
  ): Promise<Challenge | undefined> | Challenge | undefined;

  /**
   * Retrieves a challenge using its access code.
   * @param accessCode - The access code of the challenge.
   * @returns The challenge object, or undefined if not found.
   */
  getChallengeByAccessCode(
    accessCode: string,
  ): Promise<Challenge | undefined> | Challenge | undefined;

  /**
   * Updates an existing challenge in the store.
   * Throws an error if the challenge with the given ID is not found.
   * @param challenge - The challenge object with updated data.
   */
  updateChallenge(challenge: Challenge): Promise<void> | void;

  /**
   * Resets the store, clearing all data.
   * Primarily used for testing purposes.
   */
  resetStore(): Promise<void> | void;

  /**
   * Removes challenges that have passed their expiration time.
   */
  cleanupExpiredChallenges(): Promise<void> | void;
}
