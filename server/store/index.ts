import type { KVNamespace } from "@cloudflare/workers-types";
import type { IChallengeStore } from "./base";
import { KvStore } from "./kv";
import { MemoryStore } from "./memory";

// Define a type for the expected environment bindings
// Adjust this based on your actual wrangler.toml bindings
export interface Environment {
  // Add export keyword
  CHALLENGE_KV?: KVNamespace;
  // Add other bindings if needed
}

let storeInstance: IChallengeStore | null = null;

/**
 * Initializes and returns the appropriate challenge store based on the environment.
 * Uses KvStore if CHALLENGE_KV binding is found, otherwise defaults to MemoryStore.
 * Implements a singleton pattern to ensure only one store instance is created.
 *
 * @param env - The environment bindings provided by the Cloudflare Worker runtime.
 * @returns The initialized challenge store instance.
 */
export function initializeStore(env?: Environment): IChallengeStore {
  if (storeInstance) {
    return storeInstance;
  }

  if (env?.CHALLENGE_KV) {
    console.log("KV Namespace binding found. Initializing KvStore.");
    storeInstance = new KvStore(env.CHALLENGE_KV);
  } else {
    console.log("No KV Namespace binding found. Initializing MemoryStore.");
    storeInstance = new MemoryStore();
  }

  return storeInstance;
}

/**
 * Gets the initialized store instance.
 * Throws an error if the store hasn't been initialized yet.
 * Call initializeStore first.
 */
export function getStore(): IChallengeStore {
  if (!storeInstance) {
    // Fallback initialization if accessed before explicit initialization (e.g., in tests)
    // This might hide configuration issues in production if initializeStore isn't called early.
    console.warn(
      "getStore() called before initializeStore(). Falling back to MemoryStore. Ensure initializeStore is called with environment bindings in your worker entry point.",
    );
    storeInstance = new MemoryStore();
    // Alternatively, throw an error:
    // throw new Error("Store has not been initialized. Call initializeStore(env) first.");
  }
  return storeInstance;
}

// Optional: Start background tasks like cleanup if needed
// This logic might need adjustment depending on the store type and environment.
// For KvStore, cleanup is automatic via TTL.
// For MemoryStore, this might still be relevant.
// Consider calling this after initialization based on the store type.
// setInterval(() => {
//   getStore().cleanupExpiredChallenges();
// }, 60 * 60 * 1000); // Example: Run cleanup every hour
