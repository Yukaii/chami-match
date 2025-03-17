// Composable to provide store initialization functionality
export const useStores = () => {
  /**
   * Initialize all stores that require initialization
   */
  const initializeStores = () => {
    const gameStore = useGameStore();
    gameStore.initStore();
  };

  return {
    initializeStores
  };
};