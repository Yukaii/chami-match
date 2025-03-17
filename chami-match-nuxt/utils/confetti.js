import confetti from "canvas-confetti";

/**
 * Triggers a confetti celebration
 * @param {Object} options - Confetti options
 */
export function celebrate(options = {}) {
  const defaults = {
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  };
  confetti({
    ...defaults,
    ...options,
  });
}

/**
 * Trigger a special celebration for first-try correct answers
 */
export function celebrateFirstTry() {
  // Fire multiple bursts of confetti for a more impressive effect
  // First burst from the center
  celebrate({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.7 },
  });
  
  // Side bursts with short delay
  setTimeout(() => {
    celebrate({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.1, y: 0.5 },
    });
  }, 250);
  
  setTimeout(() => {
    celebrate({
      particleCount: 50,
      spread: 60,
      origin: { x: 0.9, y: 0.5 },
    });
  }, 400);
}