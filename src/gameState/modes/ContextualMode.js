import { StandardMode } from './StandardMode';
import { reactive } from 'vue';

export class ContextualMode extends StandardMode {
  constructor(options = {}) {
    super(options);
    this.type = 'contextual';
  }

  initState() {
    const baseState = super.initState();
    return {
      ...baseState,
      surroundingColor: reactive(this.generateSurroundingColor(baseState.randomColor)),
      colorOptions: [],
    };
  }

  generateSurroundingColor(targetColor, contrastLevel = 30) {
    const hVariation = Math.random() > 0.5 ? contrastLevel : -contrastLevel;
    const sVariation = Math.random() * 20 - 10;
    const vVariation = Math.random() * 20 - 10;

    const h = Math.round((targetColor.h + hVariation + 360) % 360);
    const s = Math.round(Math.max(0, Math.min(100, targetColor.s + sVariation)));
    const v = Math.round(Math.max(0, Math.min(100, targetColor.v + vVariation)));

    return { h, s, v };
  }

  generateColorOptions() {
    const options = [];

    // Add the target color
    options.push({...this.state.randomColor});

    // Generate similar but incorrect colors (5 options)
    for (let i = 0; i < 5; i++) {
      const hVariation = Math.random() * 30 - 15;
      const sVariation = Math.random() * 30 - 15;
      const vVariation = Math.random() * 30 - 15;

      const h = Math.round((this.state.randomColor.h + hVariation + 360) % 360);
      const s = Math.round(Math.max(0, Math.min(100, this.state.randomColor.s + sVariation)));
      const v = Math.round(Math.max(0, Math.min(100, this.state.randomColor.v + vVariation)));

      options.push({ h, s, v });
    }

    // Shuffle the options
    return options.sort(() => Math.random() - 0.5);
  }

  startRound() {
    super.startRound();

    // Update surrounding color
    const newSurrounding = this.generateSurroundingColor(this.state.randomColor);
    this.state.surroundingColor.h = newSurrounding.h;
    this.state.surroundingColor.s = newSurrounding.s;
    this.state.surroundingColor.v = newSurrounding.v;

    // Generate new color options
    this.state.colorOptions = this.generateColorOptions();
  }
}
