import { BaseMode } from './BaseMode';
import { reactive } from 'vue';

export class RelativeMode extends BaseMode {
  constructor(options = {}) {
    super(options);
    this.type = 'relative';
  }

  initState() {
    const colors = this.generateRelativeValueColors();
    return {
      relativeColors: reactive({
        color1: colors.color1,
        color2: colors.color2,
        valueDifference: colors.valueDifference,
      }),
      userValueDifference: 0, // Changed from ref(0) to simple number
    };
  }

  generateRandomColor() {
    const mode = this.options.colorMode || 'Color';
    switch (mode) {
      case 'B/W': {
        return {
          h: 0,
          s: 0,
          v: Math.floor(Math.random() * 95) + 5,
        };
      }
      case 'Color':
      default: {
        return {
          h: Math.floor(Math.random() * 360),
          s: Math.floor(Math.random() * 100),
          v: Math.floor(Math.random() * 95) + 5,
        };
      }
    }
  }

  generateRelativeValueColors() {
    // First generate a base color
    const baseColor = this.generateRandomColor();

    // Determine a random value difference between 10-90
    const valueDifference = Math.floor(Math.random() * 80) + 10;

    // Create the second color with the value difference
    const secondColor = { ...baseColor };

    // Ensure the second color's value stays within 0-100 range
    if (Math.random() > 0.5) {
      secondColor.v = Math.min(100, baseColor.v + valueDifference);
    } else {
      secondColor.v = Math.max(0, baseColor.v - valueDifference);
    }

    return {
      color1: baseColor,
      color2: secondColor,
      valueDifference: Math.abs(secondColor.v - baseColor.v),
    };
  }

  startRound() {
    const newColors = this.generateRelativeValueColors();
    this.state.relativeColors.color1 = newColors.color1;
    this.state.relativeColors.color2 = newColors.color2;
    this.state.relativeColors.valueDifference = newColors.valueDifference;
    this.resetUserInput();
  }

  resetUserInput() {
    this.state.userValueDifference = 0; // Fixed: no .value needed
  }

  updateUserValueDifference(value) {
    this.state.userValueDifference = value; // Fixed: no .value needed
  }

  checkGuess() {
    const precision = this.options.precision || 10;
    const tolerance = precision / 2;
    const guessedDifference = this.state.userValueDifference; // Fixed: no .value needed
    const actualDifference = this.state.relativeColors.valueDifference;

    return Math.abs(guessedDifference - actualDifference) <= tolerance;
  }

  createHistoryRecord(wasSuccess, round, sessionId) {
    return {
      type: 'difference',
      guessedDifference: this.state.userValueDifference,
      actualDifference: this.state.relativeColors.valueDifference,
    };
  }
}
