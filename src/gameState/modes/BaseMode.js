/**
 * Base class for all game modes
 */
export class BaseMode {
  constructor(options = {}) {
    this.type = 'base';
    this.options = options;
  }

  // Initialize mode-specific state
  initState() {
    return {};
  }

  // Start a new round - implement in child classes
  startRound() {
    throw new Error('startRound method must be implemented by child class');
  }

  // Check if guess is correct - implement in child classes
  checkGuess() {
    throw new Error('checkGuess method must be implemented by child class');
  }

  // Reset user input - implement in child classes
  resetUserInput() {
    throw new Error('resetUserInput method must be implemented by child class');
  }

  // Create mode-specific history record - implement in child classes
  createHistoryRecord(wasSuccess) {
    throw new Error('createHistoryRecord method must be implemented by child class');
  }
}
