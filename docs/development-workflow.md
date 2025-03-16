# Chami Match - Development Workflow

This document outlines the development workflow for the Chami Match application, including setup, running the application, making changes, and best practices.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Development Environment](#development-environment)
- [Build Process](#build-process)
- [Testing](#testing)
- [Internationalization](#internationalization)
- [Adding New Game Modes](#adding-new-game-modes)
- [Best Practices](#best-practices)

## Prerequisites

To work on the Chami Match project, you'll need:

- Node.js (v16+)
- npm or bun package manager
- A modern code editor (VS Code recommended)
- Basic knowledge of Vue.js, Pinia, and Vue Router

## Project Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd chami-match
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Create a `.env` file for local development:
   ```
   VITE_BASE_URL=http://localhost:5173
   ```

## Development Environment

### Running the Development Server

Start the development server with hot-reload:

```bash
npm run dev
# or
bun run dev
```

This will start the Vite development server at `http://localhost:5173`.

### Directory Structure

```
chami-match/
├── docs/                # Documentation files
├── public/              # Static assets that will be copied to the build output
├── scripts/             # Build and utility scripts
├── src/                 # Source code
│   ├── assets/          # Assets that will be processed by the build system
│   ├── components/      # Vue components
│   │   └── base/        # Base UI components
│   ├── internationalization/ # i18n setup and translations
│   ├── pages/           # Page components
│   ├── router/          # Vue Router configuration
│   ├── stores/          # Pinia stores
│   │   └── modes/       # Game mode implementations
│   └── utils/           # Utility functions
├── .env                 # Environment variables for development
├── .env.production      # Environment variables for production
├── index.html           # HTML entry point
├── package.json         # Project metadata and dependencies
└── vite.config.js       # Vite configuration
```

## Build Process

### Development Build

```bash
npm run dev
# or
bun run dev
```

### Production Build

```bash
npm run build
# or
bun run build
```

The production build will be output to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
# or
bun run preview
```

## Testing

### Running Tests

```bash
npm run test
# or
bun run test
```

### Adding New Tests

Tests should be added in a `__tests__` directory adjacent to the code being tested, or in a separate `tests/` directory at the project root.

## Internationalization

### Adding a New Language

1. Create a new JSON file in `src/internationalization/languages/` with the appropriate language code (e.g., `fr.json` for French).

2. Copy the content from an existing language file (e.g., `en.json`) and translate the values.

3. Add the new language to the available languages in `src/internationalization/index.js`:

```javascript
import fr from "./languages/fr.json";

const availableCodes = ["en", "zh-TW", "ja", "fr"];

// ...

const i18n = createI18n({
  // ...
  messages: {
    "zh-TW": zhTW,
    en,
    ja,
    fr,
  },
});
```

### Updating Translations

When adding new text to the application, make sure to:

1. Use the `$t('key')` syntax in templates
2. Add the new key to all language files
3. Use descriptive keys that indicate the purpose of the text

## Adding New Game Modes

To add a new game mode:

1. Create a new mode class in `src/stores/modes/` that extends `BaseMode`:

```javascript
import { reactive } from "vue";
import { BaseMode } from "./BaseMode";

export class NewMode extends BaseMode {
  constructor(options = {}) {
    super(options);
    this.type = "new-mode";
  }

  initState() {
    return {
      // Mode-specific state
    };
  }

  startRound() {
    // Implementation
  }

  checkGuess() {
    // Implementation
    return true; // or false
  }

  createHistoryRecord(wasSuccess, round, sessionId) {
    return {
      // Mode-specific record data
    };
  }
}
```

2. Add the new mode to the mode factory in `src/stores/modes/index.js`:

```javascript
import { NewMode } from "./NewMode";

export function createGameMode(type, options = {}) {
  switch (type) {
    // Existing cases...
    case "new-mode":
      return new NewMode(options);
    default:
      return new StandardMode(options);
  }
}

export { /* Existing exports... */, NewMode };
```

3. Create a new game screen component in `src/components/`:

```vue
<script setup>
// Implementation
</script>

<template>
  <!-- Template -->
</template>
```

4. Add a new route in `src/router.js`:

```javascript
import NewGameScreen from "./components/NewGameScreen.vue";

const routes = [
  // Existing routes...
  {
    path: "/new-game",
    component: NewGameScreen,
  },
];
```

5. Add the new game mode to the game modes list in `src/components/WelcomeScreen.vue`.

## Best Practices

### Code Style

- Follow the existing code style and formatting rules
- Use ESLint and Prettier to ensure consistent code style
- Use meaningful variable and function names
- Add comments for complex logic

### Component Structure

- Use the Composition API with `<script setup>` for new components
- Keep components focused on a single responsibility
- Extract reusable logic into composables
- Use props and events for component communication

### State Management

- Use Pinia stores for global state
- Use local component state for UI-specific state
- Use computed properties for derived state
- Use actions for side effects and mutations

### Performance

- Use reactive references appropriately
- Avoid unnecessary re-renders
- Use `v-once` for static content
- Use `v-memo` for optimizing list rendering
- Lazy load components when appropriate

### Accessibility

- Use semantic HTML elements
- Provide appropriate ARIA attributes
- Ensure sufficient color contrast
- Support keyboard navigation
- Test with screen readers
