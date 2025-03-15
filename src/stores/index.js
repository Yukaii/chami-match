import { useGameStore } from './game';

/**
 * Initialize all stores that require initialization
 */
export function initializeStores() {
  const gameStore = useGameStore();
  gameStore.initStore();
}
