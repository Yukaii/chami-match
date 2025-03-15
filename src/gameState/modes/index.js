import { ContextualMode } from "./ContextualMode";
import { ImageMode } from "./ImageMode";
import { RelativeMode } from "./RelativeMode";
import { StandardMode } from "./StandardMode";

export function createGameMode(type, options = {}) {
	console.log("Creating game mode:", type);
	try {
		let newMode;

		switch (type) {
			case "standard":
				newMode = new StandardMode(options);
				break;
			case "contextual":
				newMode = new ContextualMode(options);
				break;
			case "relative":
				newMode = new RelativeMode(options);
				break;
			case "image":
				newMode = new ImageMode(options);
				// Verify the image mode has required methods
				if (!newMode.selectRandomColorFromImage) {
					console.error("Created ImageMode is missing selectRandomColorFromImage method!");
				}
				break;
			default:
				console.warn(`Unknown game mode: ${type}, defaulting to standard`);
				newMode = new StandardMode(options);
		}

		// Verify the mode was created properly
		if (!newMode) {
			console.error(`Failed to create game mode ${type}`);
			return new StandardMode(options);
		}

		return newMode;
	} catch (error) {
		console.error(`Error creating game mode ${type}:`, error);
		return new StandardMode(options);
	}
}

export { StandardMode, ContextualMode, RelativeMode, ImageMode };
