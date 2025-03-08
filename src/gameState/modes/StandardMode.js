import { BaseMode } from './BaseMode';
import { reactive } from 'vue';

export class StandardMode extends BaseMode {
  constructor(options = {}) {
    super(options);
    this.type = 'standard';
  }

  initState() {
    return {
      randomColor: reactive(this.generateRandomColor()),
      userColor: reactive({ h: 0, s: 0, v: 0 }),
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

  startRound() {
    const random = this.generateRandomColor();
    this.state.randomColor.h = random.h;
    this.state.randomColor.s = random.s;
    this.state.randomColor.v = random.v;
    this.resetUserInput();
  }

  resetUserInput() {
    this.state.userColor.h = 0;
    this.state.userColor.s = 0;
    this.state.userColor.v = 0;
  }

  updateUserColor(h, s, v) {
    this.state.userColor.h = h;
    this.state.userColor.s = s;
    this.state.userColor.v = v;
  }

  checkGuess() {
    const precision = this.options.precision || 10;
    const hIsGood = Math.abs(this.state.randomColor.h - this.state.userColor.h) <= precision;
    const sIsGood = Math.abs(this.state.randomColor.s - this.state.userColor.s) <= precision;
    const vIsGood = Math.abs(this.state.randomColor.v - this.state.userColor.v) <= precision;

    return hIsGood && sIsGood && vIsGood;
  }

  createHistoryRecord(wasSuccess, round, sessionId) {
    return {
      type: 'color',
      guessedColor: Object.assign({}, this.state.userColor),
      actualColor: Object.assign({}, this.state.randomColor),
    };
  }
}
