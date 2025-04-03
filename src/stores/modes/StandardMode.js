import { reactive } from "vue";
import {
  hsvToOklab,
  hsvToRgb,
  oklabToHsv,
  rgbToHsv,
} from "../../utils/colorSpaceUtils";
import { BaseMode } from "./BaseMode";

export class StandardMode extends BaseMode {
  constructor(options = {}) {
    super(options);
    this.type = "standard";
    this.colorSpace = options.colorSpace || "hsv"; // Default to HSV if not specified
  }

  initState() {
    return {
      randomColor: reactive(this.generateRandomColor()),
      userColor: reactive(this.getDefaultUserColor()),
      colorSpace: this.colorSpace, // Store the current color space in the state
    };
  }

  getDefaultUserColor() {
    if (this.colorSpace === "rgb") {
      return { r: 0, g: 0, b: 0 };
    }
    if (this.colorSpace === "oklab") {
      return { L: 0, a: 0, b: 0 };
    }
    return { h: 0, s: 0, v: 0 }; // Default to HSV
  }

  generateRandomColor() {
    const mode = this.options.colorMode || "Color";
    let hsvColor;

    // Generate a random HSV color first
    switch (mode) {
      case "B/W": {
        hsvColor = {
          h: 0,
          s: 0,
          v: Math.floor(Math.random() * 95) + 5,
        };
        break;
      }
      // case "Color":
      default: {
        hsvColor = {
          h: Math.floor(Math.random() * 360),
          s: Math.floor(Math.random() * 100),
          v: Math.floor(Math.random() * 95) + 5,
        };
        break;
      }
    }

    // Convert to the appropriate color space if needed
    if (this.colorSpace === "rgb") {
      // Convert HSV to RGB
      const { r, g, b } = this.hsvToRgb(hsvColor.h, hsvColor.s, hsvColor.v);
      return { r, g, b }; // Return only RGB values
    }
    if (this.colorSpace === "oklab") {
      // Convert HSV to OKLAB
      const { L, a, b } = hsvToOklab(hsvColor.h, hsvColor.s, hsvColor.v);
      return { L, a, b }; // Return only OKLAB values
    }
    return hsvColor; // Default to HSV
  }

  // Helper method to convert HSV to RGB (used internally)
  hsvToRgb(h, s, v) {
    // Import from utils/index.js - using the imported function from colorSpaceUtils
    return hsvToRgb(h, s, v);
  }

  startRound() {
    const random = this.generateRandomColor();

    // Update the state based on the color space
    if (this.colorSpace === "rgb") {
      this.state.randomColor.r = random.r;
      this.state.randomColor.g = random.g;
      this.state.randomColor.b = random.b;
    } else if (this.colorSpace === "oklab") {
      this.state.randomColor.L = random.L;
      this.state.randomColor.a = random.a;
      this.state.randomColor.b = random.b;
    } else {
      // Default to HSV
      this.state.randomColor.h = random.h;
      this.state.randomColor.s = random.s;
      this.state.randomColor.v = random.v;
    }
  }

  updateUserColor(val1, val2, val3) {
    if (this.colorSpace === "rgb") {
      this.state.userColor.r = val1;
      this.state.userColor.g = val2;
      this.state.userColor.b = val3;
    } else if (this.colorSpace === "oklab") {
      this.state.userColor.L = val1;
      this.state.userColor.a = val2;
      this.state.userColor.b = val3;
    } else {
      // Default to HSV
      this.state.userColor.h = val1;
      this.state.userColor.s = val2;
      this.state.userColor.v = val3;
    }
  }

  // Set the color space
  setColorSpace(colorSpace) {
    // Store the current color values in HSV for conversion
    let currentHsv;

    // Convert current color to HSV for transition
    if (this.colorSpace === "rgb") {
      currentHsv = rgbToHsv(
        this.state.randomColor.r,
        this.state.randomColor.g,
        this.state.randomColor.b,
      );
    } else if (this.colorSpace === "oklab") {
      currentHsv = oklabToHsv(
        this.state.randomColor.L,
        this.state.randomColor.a,
        this.state.randomColor.b,
      );
    } else {
      // Already HSV
      currentHsv = {
        h: this.state.randomColor.h,
        s: this.state.randomColor.s,
        v: this.state.randomColor.v,
      };
    }

    // Update the color space
    this.colorSpace = colorSpace;
    this.state.colorSpace = colorSpace;

    // Reset user color for the new color space
    const defaultColor = this.getDefaultUserColor();
    Object.keys(defaultColor).forEach((key) => {
      this.state.userColor[key] = defaultColor[key];
    });

    // Convert the current color to the new color space
    let newColor;
    if (colorSpace === "rgb") {
      newColor = hsvToRgb(currentHsv.h, currentHsv.s, currentHsv.v);
    } else if (colorSpace === "oklab") {
      newColor = hsvToOklab(currentHsv.h, currentHsv.s, currentHsv.v);
    } else {
      newColor = currentHsv;
    }

    // Clear existing properties from randomColor
    Object.keys(this.state.randomColor).forEach((key) => {
      delete this.state.randomColor[key];
    });

    // Set new properties based on color space
    Object.keys(newColor).forEach((key) => {
      this.state.randomColor[key] = newColor[key];
    });
  }

  checkGuess() {
    const precision = this.options.precision || 10;

    // Check based on the current color space
    if (this.colorSpace === "rgb") {
      // Compare RGB values directly
      const targetRgb = this.state.randomColor;
      const userRgb = this.state.userColor;

      // Calculate percentage differences for RGB (0-255 scale)
      const rDiff = Math.abs(targetRgb.r - userRgb.r) / 2.55; // Convert to percentage
      const gDiff = Math.abs(targetRgb.g - userRgb.g) / 2.55;
      const bDiff = Math.abs(targetRgb.b - userRgb.b) / 2.55;

      return rDiff <= precision && gDiff <= precision && bDiff <= precision;
    }

    if (this.colorSpace === "oklab") {
      // Compare OKLAB values directly
      const targetLab = this.state.randomColor;
      const userLab = this.state.userColor;

      // For OKLAB, L is 0-100, a and b are -100 to +100
      const LDiff = Math.abs(targetLab.L - userLab.L); // Already percentage
      const aDiff = Math.abs(targetLab.a - userLab.a) / 2; // Convert to percentage (200 range)
      const bDiff = Math.abs(targetLab.b - userLab.b) / 2;

      return LDiff <= precision && aDiff <= precision && bDiff <= precision;
    }

    // Default HSV comparison
    const hIsGood =
      Math.abs(this.state.randomColor.h - this.state.userColor.h) <= precision;
    const sIsGood =
      Math.abs(this.state.randomColor.s - this.state.userColor.s) <= precision;
    const vIsGood =
      Math.abs(this.state.randomColor.v - this.state.userColor.v) <= precision;

    return hIsGood && sIsGood && vIsGood;
  }

  createHistoryRecord(wasSuccess, round, sessionId) {
    // Create filtered copies of the colors based on the active color space
    let actualColor = {};
    let guessedColor = {};

    // Select only the properties relevant to the current color space
    if (this.colorSpace === "hsv") {
      // For HSV, include only h, s, v properties
      actualColor = {
        h: this.state.randomColor.h,
        s: this.state.randomColor.s,
        v: this.state.randomColor.v,
      };
      guessedColor = {
        h: this.state.userColor.h,
        s: this.state.userColor.s,
        v: this.state.userColor.v,
      };
    } else if (this.colorSpace === "rgb") {
      // For RGB, include only r, g, b properties
      actualColor = {
        r: this.state.randomColor.r,
        g: this.state.randomColor.g,
        b: this.state.randomColor.b,
      };
      guessedColor = {
        r: this.state.userColor.r,
        g: this.state.userColor.g,
        b: this.state.userColor.b,
      };
    } else if (this.colorSpace === "oklab") {
      // For OKLAB, include only L, a, b properties
      actualColor = {
        L: this.state.randomColor.L,
        a: this.state.randomColor.a,
        b: this.state.randomColor.b,
      };
      guessedColor = {
        L: this.state.userColor.L,
        a: this.state.userColor.a,
        b: this.state.userColor.b,
      };
    }

    // Include color space information in the record
    return {
      type: "color",
      guessedColor,
      actualColor,
      colorSpace: this.colorSpace, // Store the color space used
    };
  }
}
