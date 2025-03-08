import { reactive } from "vue";
import { StandardMode } from "./StandardMode";

export class ContextualMode extends StandardMode {
	constructor(options = {}) {
		super(options);
		this.type = "contextual";
		this.viewCallbacks = {};
	}

	// Register a callback function from the view component
	registerViewCallback(event, callback) {
		this.viewCallbacks[event] = callback;
	}

	initState() {
		const baseState = super.initState();
		return {
			...baseState,
			surroundingColor: reactive(
				this.generateSurroundingColor(baseState.randomColor),
			),
			colorOptions: [],
		};
	}

	generateSurroundingColor(targetColor, contrastLevel = 30) {
		const hVariation = Math.random() > 0.5 ? contrastLevel : -contrastLevel;
		const sVariation = Math.random() * 20 - 10;
		const vVariation = Math.random() * 20 - 10;

		const h = Math.round((targetColor.h + hVariation + 360) % 360);
		const s = Math.round(
			Math.max(0, Math.min(100, targetColor.s + sVariation)),
		);
		const v = Math.round(
			Math.max(0, Math.min(100, targetColor.v + vVariation)),
		);

		return { h, s, v };
	}

	generateColorOptions() {
		const options = [];

		// Add the target color
		options.push({ ...this.state.randomColor });

		// Generate similar but incorrect colors (5 options)
		for (let i = 0; i < 5; i++) {
			const hVariation = Math.random() * 30 - 15;
			const sVariation = Math.random() * 30 - 15;
			const vVariation = Math.random() * 30 - 15;

			const h = Math.round((this.state.randomColor.h + hVariation + 360) % 360);
			const s = Math.round(
				Math.max(0, Math.min(100, this.state.randomColor.s + sVariation)),
			);
			const v = Math.round(
				Math.max(0, Math.min(100, this.state.randomColor.v + vVariation)),
			);

			options.push({ h, s, v });
		}

		// Shuffle the options
		return options.sort(() => Math.random() - 0.5);
	}

	startRound() {
		super.startRound();

		// Update surrounding color
		const newSurrounding = this.generateSurroundingColor(
			this.state.randomColor,
		);
		this.state.surroundingColor.h = newSurrounding.h;
		this.state.surroundingColor.s = newSurrounding.s;
		this.state.surroundingColor.v = newSurrounding.v;

		// Generate new color options
		this.state.colorOptions = this.generateColorOptions();

		// Call the onNewRound callback if registered (remove duplicate call)
		if (
			this.viewCallbacks &&
			typeof this.viewCallbacks.onNewRound === "function"
		) {
			this.viewCallbacks.onNewRound();
		}
	}

	// Override checkGuess to require exact match, ignoring precision setting
	checkGuess() {
		// In contextual mode, we need exact matches since user selects from predefined options
		const hIsExact = this.state.randomColor.h === this.state.userColor.h;
		const sIsExact = this.state.randomColor.s === this.state.userColor.s;
		const vIsExact = this.state.randomColor.v === this.state.userColor.v;

		return hIsExact && sIsExact && vIsExact;
	}
}
