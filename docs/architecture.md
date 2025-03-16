# Chami Match - Architecture and Project Structure Documentation

## Table of Contents
- [Overview](#overview)
- [Application Architecture](#application-architecture)
- [Project Structure](#project-structure)
- [Game Modes](#game-modes)
- [State Management](#state-management)
- [Routing](#routing)
- [Internationalization](#internationalization)
- [Components](#components)
- [Utilities](#utilities)
- [Theme Management](#theme-management)

## Overview

Chami Match is a color matching game built with Vue.js that helps users practice and improve their color perception skills. The application offers multiple game modes that challenge users in different ways to match colors, recognize patterns, and test their color memory.

The game is built as a single-page application (SPA) using Vue 3 with the Composition API, Pinia for state management, Vue Router for navigation, and Vue I18n for internationalization.

## Application Architecture

Chami Match follows a component-based architecture with the following key elements:

```
┌─────────────────────────────────────────────────────────┐
│                      Vue Application                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│  │  Components │   │   Routing   │   │    Store    │    │
│  └─────────────┘   └─────────────┘   └─────────────┘    │
│                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│  │ Game Modes  │   │     I18n    │   │  Utilities  │    │
│  └─────────────┘   └─────────────┘   └─────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Patterns

1. **Component-Based Architecture**: The UI is composed of reusable Vue components.
2. **State Management Pattern**: Pinia store manages application state.
3. **Strategy Pattern**: Different game modes implement a common interface through class inheritance.
4. **Dependency Injection**: Vue's provide/inject for component communication.
5. **Observer Pattern**: Reactive state updates using Vue's reactivity system.

## Project Structure

```
src/
├── assets/             # Static assets like images
├── components/         # Vue components
│   ├── base/           # Base/reusable UI components
│   └── ...             # Feature-specific components
├── internationalization/ # i18n setup and language files
│   └── languages/      # JSON translation files
├── pages/              # Page components
├── router/             # Vue Router configuration
├── stores/             # Pinia stores
│   └── modes/          # Game mode implementations
├── utils/              # Utility functions
├── App.vue             # Root component
├── main.js            # Application entry point
└── style.css          # Global styles
```

## Game Modes

The game implements multiple modes, each offering a different color matching challenge:

1. **Standard Mode**: Match a target color by adjusting HSV values.
2. **Contextual Mode**: Select the correct color from multiple options.
3. **Relative Mode**: Adjust brightness/contrast relative to a reference color.
4. **Image Mode**: Match colors from images.
5. **Recall Mode**: Memorize a color and select it from options after a delay.

### Game Mode Architecture

All game modes inherit from a base `BaseMode` class that defines the common interface:

```
┌───────────────┐
│   BaseMode    │
└───────┬───────┘
        │
        ├─────────────────┬─────────────────┬─────────────────┬─────────────────┐
        │                 │                 │                 │                 │
┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐ ┌───────▼───────┐
│ StandardMode  │ │ContextualMode │ │ RelativeMode  │ │  ImageMode    │ │  RecallMode   │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘
```

Each mode implements the following methods:
- `initState()`: Initialize mode-specific state
- `startRound()`: Start a new round with a new target color
- `checkGuess()`: Check if the user's guess matches the target
- `createHistoryRecord()`: Create a record of the attempt for history tracking

## State Management

The application uses Pinia for state management with the following stores:

### Game Store (`stores/game.js`)

The main store that manages:
- Game sessions
- User preferences
- Game history
- Current game state
- UI state (popups, settings)

Key features:
- Persistent storage using `useStorage` from VueUse
- Game session tracking
- Score and statistics calculation
- Game mode initialization and management

## Routing

Vue Router is used for navigation between different screens:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `WelcomeScreen` | Landing page with game mode selection |
| `/game` | `GameScreen` | Standard color matching game |
| `/context-game` | `ContextGameScreen` | Contextual color selection game |
| `/relative-game` | `RelativeGameScreen` | Relative brightness/contrast game |
| `/image-game` | `ImageGameScreen` | Image-based color matching |
| `/recall-game` | `RecallGameScreen` | Color memory/recall game |

A special `/test-error` route is available in non-production environments for testing error handling.

## Internationalization

The application supports multiple languages using Vue I18n:

- English (en)
- Japanese (ja)
- Traditional Chinese (zh-TW)

Translation files are stored in JSON format in `src/internationalization/languages/`.

The application automatically detects the user's browser language and falls back to Traditional Chinese if the detected language is not supported.

## Components

### Core Components

- `App.vue`: Root component with error boundaries and popups
- `ErrorBoundary.vue`: Catches and handles component errors
- `WelcomeScreen.vue`: Landing page with game mode carousel
- Game screens (one for each mode):
  - `GameScreen.vue`
  - `ContextGameScreen.vue`
  - `RelativeGameScreen.vue`
  - `ImageGameScreen.vue`
  - `RecallGameScreen.vue`

### UI Components

- `GameNavBar.vue`: Navigation bar for game screens
- `HealthBar.vue`: Visual indicator of remaining lives
- `ColorBlock.vue`: Color display component
- `Toolbar.vue`: Game toolbar with actions

### Popup Components

- `SettingsPopup.vue`: Game and UI settings
- `AboutPopup.vue`: Information about the game
- `RecordPopup.vue`: Game history and statistics
- `ResetPopup.vue`: Confirmation for resetting game data

### Base Components

- `BaseButton.vue`: Reusable button component
- `BaseSlider.vue`: Slider input component
- `BaseTooltip.vue`: Tooltip component

## Utilities

### Color Utilities (`utils/colorUtils.js`)

Functions for color manipulation and conversion:
- `colorHSVtoHex()`: Convert HSV color to hex string
- `rgbToHex()`: Convert RGB values to hex string
- `getContrastRatio()`: Calculate contrast ratio between colors
- `hsvToRgb()`: Convert HSV to RGB (imported from utils/index.js)
- `calculateLuminance()`: Calculate relative luminance of an RGB color according to WCAG

### Confetti Utilities (`utils/confetti.js`)

Functions for celebratory effects:
- `celebrateFirstTry()`: Display confetti animation when user gets the correct color on first try

## Theme Management

The application supports both light and dark themes:

1. **Theme Detection**: The app detects the user's system preference for dark/light mode
2. **Theme Toggle**: Users can manually override the system preference in settings
3. **Persistent Preference**: User's theme choice is stored in localStorage
4. **CSS Implementation**: Themes are implemented using Tailwind CSS's dark mode

Theme switching is handled in the App.vue component, which applies the 'dark' class to the document's root element when dark mode is active.

## Error Handling

The application implements a robust error handling strategy:

1. **Error Boundaries**: Vue components are wrapped in `ErrorBoundary` components to catch and handle rendering errors
2. **Graceful Degradation**: When errors occur in a component, only that component fails while the rest of the application continues to function
3. **Development Mode**: Additional error testing routes are available in non-production environments

## Data Persistence

The application uses the following persistence strategies:

1. **Local Storage**: Game preferences, history, and sessions are stored in the browser's localStorage
2. **VueUse Integration**: The `useStorage` composable from VueUse provides reactive access to localStorage
3. **Data Migration**: The store includes methods to migrate data between different versions of the application

## Build and Deployment

The application is built using Vite, a modern frontend build tool that offers:

1. **Fast Development**: Instant server start and hot module replacement
2. **Optimized Build**: Efficient production builds with automatic code splitting
3. **Environment Variables**: Support for different environments via .env files

## Future Considerations

Potential areas for future development:

1. **Additional Game Modes**: Expanding the variety of color challenges
2. **User Accounts**: Adding user authentication for cross-device persistence
3. **Accessibility Improvements**: Further enhancing the application for users with color vision deficiencies
4. **Social Features**: Sharing results and competing with friends
