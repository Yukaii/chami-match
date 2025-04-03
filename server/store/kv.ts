import type {
  KVNamespace,
  KVNamespaceListKey,
  KVNamespaceListResult,
  KVNamespacePutOptions,
} from "@cloudflare/workers-types"; // Import KVNamespaceListResult, KVNamespaceListKey and KVNamespacePutOptions
import type { Challenge } from "../types";
import type { IChallengeStore } from "./base";

// Constants for KV key prefixes
const CHALLENGE_PREFIX = "challenge:";
const ACCESS_CODE_PREFIX = "ac:";

/**
 * Cloudflare Workers KV implementation of the IChallengeStore interface.
 * Requires a KVNamespace instance to be provided.
 */
export class KvStore implements IChallengeStore {
  private kv: KVNamespace;

  constructor(kvNamespace: KVNamespace) {
    if (!kvNamespace) {
      throw new Error("KVNamespace instance is required for KvStore.");
    }
    this.kv = kvNamespace;
    console.log("[KvStore] Initialized.");
  }

  async addChallenge(challenge: Challenge): Promise<void> {
    const challengeKey = `${CHALLENGE_PREFIX}${challenge.id}`;
    const accessCodeKey = `${ACCESS_CODE_PREFIX}${challenge.accessCode}`;

    // Check for existing challenge ID (should ideally not happen with UUIDs)
    const existingChallenge = await this.kv.get(challengeKey);
    if (existingChallenge !== null) {
      throw new Error(
        `[KvStore] Challenge with ID ${challenge.id} already exists.`,
      );
    }

    // Check for access code collision
    const existingIdForAccessCode = await this.kv.get(accessCodeKey);
    if (existingIdForAccessCode !== null) {
      console.warn(
        `[KvStore] Access code ${challenge.accessCode} collision! Overwriting index.`,
      );
      // Potentially delete the old challenge linked to this access code if necessary,
      // but for now, just overwrite the index. The old challenge data remains orphaned.
    }

    // Store the main challenge object, using expiration if provided
    const kvOptions: KVNamespacePutOptions = {};
    if (challenge.expiresAt) {
      // KV expects expiration time in seconds since epoch
      kvOptions.expiration = Math.floor(challenge.expiresAt / 1000);
    }
    await this.kv.put(challengeKey, JSON.stringify(challenge), kvOptions);

    // Store the access code -> challenge ID mapping, with the same expiration
    await this.kv.put(accessCodeKey, challenge.id, kvOptions);

    console.log(
      `[KvStore] Challenge added: ${challenge.id} (${challenge.accessCode})`,
    );
  }

  async getChallengeById(id: string): Promise<Challenge | undefined> {
    const challengeKey = `${CHALLENGE_PREFIX}${id}`;
    const challengeJson = await this.kv.get(challengeKey);
    if (challengeJson === null) {
      return undefined;
    }
    try {
      return JSON.parse(challengeJson) as Challenge;
    } catch (e) {
      console.error(
        `[KvStore] Failed to parse challenge JSON for ID ${id}:`,
        e,
      );
      return undefined;
    }
  }

  async getChallengeByAccessCode(
    accessCode: string,
  ): Promise<Challenge | undefined> {
    const accessCodeKey = `${ACCESS_CODE_PREFIX}${accessCode}`;
    const challengeId = await this.kv.get(accessCodeKey);
    if (challengeId === null) {
      return undefined;
    }
    // Now fetch the actual challenge using the ID
    return this.getChallengeById(challengeId);
  }

  async updateChallenge(challenge: Challenge): Promise<void> {
    const challengeKey = `${CHALLENGE_PREFIX}${challenge.id}`;

    // Retrieve the existing challenge to check for access code changes
    const existingChallenge = await this.getChallengeById(challenge.id);
    if (!existingChallenge) {
      throw new Error(
        `[KvStore] Challenge with ID ${challenge.id} not found for update.`,
      );
    }

    // Handle access code changes: delete old index, check collision, add new index
    if (existingChallenge.accessCode !== challenge.accessCode) {
      const oldAccessCodeKey = `${ACCESS_CODE_PREFIX}${existingChallenge.accessCode}`;
      const newAccessCodeKey = `${ACCESS_CODE_PREFIX}${challenge.accessCode}`;

      // Check for collision with the new access code
      const collidingId = await this.kv.get(newAccessCodeKey);
      if (collidingId !== null && collidingId !== challenge.id) {
        console.warn(
          `[KvStore] Access code ${challenge.accessCode} collision during update! Overwriting index.`,
        );
        // Decide if the colliding index should be removed. For now, we'll overwrite.
      }

      // Delete the old access code index entry
      await this.kv.delete(oldAccessCodeKey);

      // Add the new access code index entry (with expiration)
      const kvOptions: KVNamespacePutOptions = {};
      if (challenge.expiresAt) {
        kvOptions.expiration = Math.floor(challenge.expiresAt / 1000);
      }
      await this.kv.put(newAccessCodeKey, challenge.id, kvOptions);
    }

    // Store the updated challenge object, potentially updating expiration
    const kvOptions: KVNamespacePutOptions = {};
    if (challenge.expiresAt) {
      kvOptions.expiration = Math.floor(challenge.expiresAt / 1000);
    } else {
      // If expiration was removed, we might need to persist it without TTL
      // However, KV doesn't directly support removing expiration,
      // so re-putting without expiration option is the way.
    }
    await this.kv.put(challengeKey, JSON.stringify(challenge), kvOptions);

    console.log(`[KvStore] Challenge updated: ${challenge.id}`);
  }

  async resetStore(): Promise<void> {
    console.warn(
      "[KvStore] resetStore() called. Deleting all known challenge and access code keys...",
    );
    // This is potentially slow and dangerous in production. Use with caution.
    // List and delete all challenge keys
    let challengesDeleted = 0;
    let listComplete = false;
    let cursor: string | undefined;
    while (!listComplete) {
      const listResult = await this.kv.list({
        prefix: CHALLENGE_PREFIX,
        cursor,
      }); // listResult type is inferred correctly here
      const keysToDelete = listResult.keys.map(
        (keyInfo: KVNamespaceListKey<unknown>) => keyInfo.name,
      ); // Add type for keyInfo
      if (keysToDelete.length > 0) {
        // KV doesn't have bulk delete, delete one by one
        await Promise.all(
          keysToDelete.map((key: string) => this.kv.delete(key)),
        ); // Add type for key
        challengesDeleted += keysToDelete.length;
      }
      listComplete = listResult.list_complete;
      // Cursor only exists if list_complete is false
      cursor = listResult.list_complete ? undefined : listResult.cursor;
    }

    // List and delete all access code keys
    let accessCodesDeleted = 0;
    listComplete = false;
    cursor = undefined;
    while (!listComplete) {
      // Explicitly type listResult here as well
      const listResult: KVNamespaceListResult<unknown> = await this.kv.list({
        prefix: ACCESS_CODE_PREFIX,
        cursor,
      });
      const keysToDelete = listResult.keys.map(
        (keyInfo: KVNamespaceListKey<unknown>) => keyInfo.name,
      ); // Add type for keyInfo
      if (keysToDelete.length > 0) {
        await Promise.all(
          keysToDelete.map((key: string) => this.kv.delete(key)),
        ); // Add type for key
        accessCodesDeleted += keysToDelete.length;
      }
      listComplete = listResult.list_complete;
      // Cursor only exists if list_complete is false
      cursor = listResult.list_complete ? undefined : listResult.cursor;
    }

    console.log(
      `[KvStore] Store reset complete. Deleted ${challengesDeleted} challenges and ${accessCodesDeleted} access code entries.`,
    );
  }

  async cleanupExpiredChallenges(): Promise<void> {
    // KV handles expiration automatically based on the `expiration` or `expirationTtl`
    // options set during `put`. Therefore, a manual cleanup method like this
    // is generally not needed for KV's automatic expiration feature.
    // We might implement a manual scan if challenges could expire based on
    // internal logic (e.g., inactivity) not tied to KV's TTL.
    console.log(
      "[KvStore] cleanupExpiredChallenges() called. KV handles TTL expiration automatically. No manual cleanup performed by default.",
    );
  }
}
