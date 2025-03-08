import { StandardMode } from './StandardMode';
import { ContextualMode } from './ContextualMode';
import { RelativeMode } from './RelativeMode';

export function createGameMode(type, options = {}) {
  switch (type) {
    case 'standard':
      return new StandardMode(options);
    case 'contextual':
      return new ContextualMode(options);
    case 'relative':
      return new RelativeMode(options);
    default:
      console.warn(`Unknown game mode: ${type}, defaulting to standard`);
      return new StandardMode(options);
  }
}

export { StandardMode, ContextualMode, RelativeMode };
