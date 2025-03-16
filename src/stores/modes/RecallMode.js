import { reactive } from "vue";
import { StandardMode } from "./StandardMode";

export class RecallMode extends StandardMode {
	constructor(options = {}) {
		super(options);
		this.type = "recall";
		this.viewCallbacks = {};
		this.recallTimeout = options.recallTimeout || 5; // Default 5 seconds
	}

	// Register a callback function from the view component
	registerViewCallback(event, callback) {
		this.viewCallbacks[event] = callback;
	}

	initState() {
		const baseState = super.initState();
		return {
			...baseState,
			colorOptions: [],
			colorVisible: true,
			timerActive: false,
			timeRemaining: this.recallTimeout
		};
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

		// Reset state for new round
		this.state.colorVisible = true;
		this.state.timerActive = true;
		this.state.timeRemaining = this.recallTimeout;

		// Generate new color options
		this.state.colorOptions = this.generateColorOptions();

		// Call the onNewRound callback if registered
		if (this.viewCallbacks && typeof this.viewCallbacks.onNewRound === "function") {
			this.viewCallbacks.onNewRound();
		}
	}

	// Override checkGuess to require exact match, ignoring precision setting
	checkGuess() {
		// In recall mode, we need exact matches since user selects from predefined options
		const hIsExact = this.state.randomColor.h === this.state.userColor.h;
		const sIsExact = this.state.randomColor.s === this.state.userColor.s;
		const vIsExact = this.state.randomColor.v === this.state.userColor.v;

		return hIsExact && sIsExact && vIsExact;
	}

	// Helper method to hide the color after timeout
	hideColor() {
		this.state.colorVisible = false;
		this.state.timerActive = false;
	}
}
