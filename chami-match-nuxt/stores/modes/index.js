import { ContextualMode } from "./ContextualMode";
import { ImageMode } from "./ImageMode";
import { RecallMode } from "./RecallMode";
import { RelativeMode } from "./RelativeMode";
import { StandardMode } from "./StandardMode";

export function createGameMode(type, options = {}) {
  switch (type) {
    case "contextual":
      return new ContextualMode(options);
    case "relative":
      return new RelativeMode(options);
    case "image":
      return new ImageMode(options);
    case "recall":
      return new RecallMode({
        ...options,
        recallTimeout: options.recallTimeout || 5,
      });
    // case "standard":
    default:
      return new StandardMode(options);
  }
}

export { ContextualMode, ImageMode, RecallMode, RelativeMode, StandardMode };