/**
 * Base class for all game modes
 */
export class BaseMode {
  constructor(options = {}) {
    this.options = options;
    this.state = null;
    this.type = "base";
    this.viewCallbacks = {};
  }
  
  // Register a callback function from the view component
  registerViewCallback(event, callback) {
    this.viewCallbacks[event] = callback;
  }
  
  // Initialize mode-specific state
  initState() {
    return {};
  }
  
  // Start a new round - implement in child classes
  startRound() {
    throw new Error("startRound method must be implemented by child class");
  }
  
  // Check if guess is correct - implement in child classes
  checkGuess() {
    throw new Error("checkGuess method must be implemented by child class");
  }
  
  // Reset user input - implement in child classes
  resetUserInput() {
    throw new Error("resetUserInput method must be implemented by child class");
  }
  
  // Create mode-specific history record - implement in child classes
  createHistoryRecord(wasSuccess) {
    throw new Error(
      "createHistoryRecord method must be implemented by child class",
    );
  }
}