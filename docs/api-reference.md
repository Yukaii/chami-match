# Chami Match - API Reference

This document provides a detailed reference of the key APIs, classes, and functions used in the Chami Match application.

## Table of Contents

- [Game Modes](#game-modes)
  - [BaseMode](#basemode)
  - [StandardMode](#standardmode)
  - [ContextualMode](#contextualmode)
  - [RelativeMode](#relativemode)
  - [ImageMode](#imagemode)
  - [RecallMode](#recallmode)
- [Game Store](#game-store)
  - [State](#state)
  - [Getters](#getters)
  - [Actions](#actions)
- [Utility Functions](#utility-functions)
  - [Color Utilities](#color-utilities)
  - [Confetti Utilities](#confetti-utilities)

## Game Modes

### BaseMode

Base class that defines the common interface for all game modes.

```typescript
class BaseMode {
  constructor(options: GameModeOptions);

  // Register a callback function from the view component
  registerViewCallback(event: string, callback: Function): void;

  // Initialize mode-specific state
  initState(): object;

  // Start a new round - implement in child classes
  startRound(): void;

  // Check if guess is correct - implement in child classes
  checkGuess(): boolean;

  // Reset user input - implement in child classes
  resetUserInput(): void;

  // Create mode-specific history record - implement in child classes
  createHistoryRecord(wasSuccess: boolean): object;
}
```

### StandardMode

Standard color matching mode where users adjust HSV values to match a target color.

```typescript
class StandardMode extends BaseMode {
  constructor(options: GameModeOptions);

  // Initialize mode-specific state
  initState(): {
    randomColor: { h: number, s: number, v: number },
    userColor: { h: number, s: number, v: number }
  };

  // Generate a random color based on the mode (Color or B/W)
  generateRandomColor(): { h: number, s: number, v: number };

  // Start a new round with a new random color
  startRound(): void;

  // Update the user's color selection
  updateUserColor(h: number, s: number, v: number): void;

  // Check if the user's color is close enough to the target
  checkGuess(): boolean;

  // Create a history record of the attempt
  createHistoryRecord(wasSuccess: boolean, round: number, sessionId: string): {
    type: string,
    guessedColor: { h: number, s: number, v: number },
    actualColor: { h: number, s: number, v: number }
  };
}
```

### ContextualMode

Mode where users select the correct color from multiple options.

```typescript
class ContextualMode extends BaseMode {
  constructor(options: GameModeOptions);

  // Initialize mode-specific state
  initState(): {
    randomColor: { h: number, s: number, v: number },
    userColor: { h: number, s: number, v: number },
    colorOptions: Array<{ h: number, s: number, v: number }>
  };

  // Generate color options including the target color
  generateColorOptions(): Array<{ h: number, s: number, v: number }>;

  // Start a new round
  startRound(): void;

  // Select a color from the options
  selectColor(color: { h: number, s: number, v: number }): void;

  // Check if the selected color matches the target
  checkGuess(): boolean;

  // Create a history record of the attempt
  createHistoryRecord(wasSuccess: boolean, round: number, sessionId: string): {
    type: string,
    guessedColor: { h: number, s: number, v: number },
    actualColor: { h: number, s: number, v: number },
    options: Array<{ h: number, s: number, v: number }>
  };
}
```

### RelativeMode

Mode where users adjust the brightness/contrast relative to a reference color.

```typescript
class RelativeMode extends BaseMode {
  constructor(options: GameModeOptions);

  // Initialize mode-specific state
  initState(): {
    randomColor: { h: number, s: number, v: number },
    surroundingColor: { h: number, s: number, v: number },
    userValueDifference: number,
    relativeColors: {
      target: { h: number, s: number, v: number },
      surrounding: { h: number, s: number, v: number }
    }
  };

  // Generate random colors for the target and surrounding
  generateRandomColor(): {
    target: { h: number, s: number, v: number },
    surrounding: { h: number, s: number, v: number }
  };

  // Start a new round
  startRound(): void;

  // Update the user's value difference selection
  updateUserValueDifference(value: number): void;

  // Check if the user's value difference is close enough to the target
  checkGuess(): boolean;

  // Create a history record of the attempt
  createHistoryRecord(wasSuccess: boolean, round: number, sessionId: string): {
    type: string,
    guessedDifference: number,
    actualDifference: number,
    relativeColors: {
      target: { h: number, s: number, v: number },
      surrounding: { h: number, s: number, v: number }
    }
  };
}
```

### ImageMode

Mode where users match colors from images.

```typescript
class ImageMode extends BaseMode {
  constructor(options: GameModeOptions);

  // Initialize mode-specific state
  initState(): {
    randomColor: { h: number, s: number, v: number },
    userColor: { h: number, s: number, v: number },
    colorOptions: Array<{ h: number, s: number, v: number }>,
    imageUrl: string
  };

  // Generate color options for the current image
  generateColorOptions(): Array<{ h: number, s: number, v: number }>;

  // Start a new round with a new image
  startRound(): void;

  // Select a color from the options
  selectColor(color: { h: number, s: number, v: number }): void;

  // Check if the selected color matches the target
  checkGuess(): boolean;

  // Create a history record of the attempt
  createHistoryRecord(wasSuccess: boolean, round: number, sessionId: string): {
    type: string,
    guessedColor: { h: number, s: number, v: number },
    actualColor: { h: number, s: number, v: number },
    imageUrl: string
  };
}
```

### RecallMode

Mode where users memorize a color and select it after a delay.

```typescript
class RecallMode extends StandardMode {
  constructor(options: GameModeOptions & { recallTimeout?: number });

  // Register a callback function from the view component
  registerViewCallback(event: string, callback: Function): void;

  // Initialize mode-specific state
  initState(): {
    randomColor: { h: number, s: number, v: number },
    userColor: { h: number, s: number, v: number },
    colorOptions: Array<{ h: number, s: number, v: number }>,
    colorVisible: boolean,
    timerActive: boolean,
    timeRemaining: number
  };

  // Generate color options including the target color
  generateColorOptions(): Array<{ h: number, s: number, v: number }>;

  // Start a new round
  startRound(): void;

  // Check if the selected color matches the target
  checkGuess(): boolean;

  // Helper method to hide the color after timeout
  hideColor(): void;
}
```

## Game Store

The main Pinia store that manages the game state.

### State

```typescript
interface GameState {
  // Persistent storage
  sessions: Session[];
  preferences: {
    maxLife: number;
    precision: number;
    mode: string;
    realtimePreview: boolean;
    gameType: string;
    enableConfetti: boolean;
    lastPlayedGameType: string | null;
    recallTimeout: number;
  };
  history: HistoryRecord[];

  // Session state
  currentSession: Session | null;

  // Game state
  currentRound: number;
  score: number;
  currentGameMode: BaseMode | null;

  // UI state
  recordPopupOpen: boolean;
  settingsPopupOpen: boolean;
  aboutPopupOpen: boolean;
  resetPopupOpen: boolean;
  settingsMode: string;

  // Other state
  lives: number;
  attemptCount: number;
}
```

### Getters

```typescript
interface GameGetters {
  // Configuration getters
  maxLife: number;
  precision: number;
  mode: string;
  realtimePreview: boolean;
  gameType: string;
  recallTimeout: number;

  // Current game mode state accessors
  currentModeState: object | null;
  randomColor: { h: number, s: number, v: number } | null;
  userColor: { h: number, s: number, v: number } | null;
  relativeColors: {
    target: { h: number, s: number, v: number },
    surrounding: { h: number, s: number, v: number }
  } | null;
  userValueDifference: number | null;
  surroundingColor: { h: number, s: number, v: number } | null;
  colorOptions: Array<{ h: number, s: number, v: number }>;

  // Game statistics
  winRate: string;
  winningStreak: number;
  lastTriesOfEachRound: HistoryRecord[];
  lastPlayedGameType: string;
}
```

### Actions

```typescript
interface GameActions {
  // Game management
  resetGameData(): void;
  initGameMode(): object;
  startOver(): void;
  startNewRound(): void;
  recordRound(wasSuccess: boolean): void;
  checkGuess(): void;

  // Color updates
  updateUserColor(h: number, s: number, v: number): void;
  updateUserValueDifference(value: number): void;

  // Settings updates
  updateMode(newMode: string): void;
  updatePrecision(newPrecision: number): void;
  updateMaxLife(newMaxLife: number): void;
  updateRealtimePreview(preview: boolean): void;
  updateGameType(newGameType: string): void;
  updateLastPlayedGameType(gameType: string): void;
  updateConfetti(enabled: boolean): void;
  updateRecallTimeout(newTimeout: number): void;

  // UI state toggles
  toggleRecordPopup(): void;
  toggleSettingsPopup(): void;
  toggleAboutPopup(): void;
  toggleResetPopup(): void;

  // Data management
  refreshGameRecords(): HistoryRecord[];
  migrateHistoryRecords(): void;

  // Initialization
  initStore(): void;
}
```

## Utility Functions

### Color Utilities

```typescript
// Convert HSV color object to a hex string for CSS
function colorHSVtoHex(color: { h: number, s: number, v: number }): string;

// Convert RGB values to hex string
function rgbToHex(r: number, g: number, b: number): string;

// Convert a single color component to hex
function componentToHex(c: number): string;

// Calculate the contrast ratio between two colors
function getContrastRatio(
  color1: { h: number, s: number, v: number },
  color2: { h: number, s: number, v: number }
): number;

// Calculate relative luminance of an RGB color according to WCAG
function calculateLuminance(r: number, g: number, b: number): number;

// Convert HSV to RGB
function hsvToRgb(h: number, s: number, v: number): { r: number, g: number, b: number };
```

### Confetti Utilities

```typescript
// Display confetti animation when user gets the correct color on first try
function celebrateFirstTry(): void;
```
