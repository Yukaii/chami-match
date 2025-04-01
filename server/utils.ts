const CODE_LENGTH = 6;
const CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Generates a random alphanumeric access code.
 * Note: This is a simple implementation. For production, consider
 * ensuring uniqueness against existing codes in the store.
 */
export function generateAccessCode(): string {
	let result = "";
	const charactersLength = CHARACTERS.length;
	for (let i = 0; i < CODE_LENGTH; i++) {
		result += CHARACTERS.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

/**
 * Calculates the expiration timestamp based on a duration string.
 * @param expiresIn - Duration string like '1h', '24h', '3d', '7d'.
 * @returns The expiration timestamp in milliseconds since epoch, or undefined if no expiration.
 */
export function calculateExpiresAt(
	expiresIn?: "1h" | "24h" | "3d" | "7d",
): number | undefined {
	if (!expiresIn) {
		return undefined;
	}

	const now = Date.now();
	let durationMs = 0;

	switch (expiresIn) {
		case "1h":
			durationMs = 60 * 60 * 1000;
			break;
		case "24h":
			durationMs = 24 * 60 * 60 * 1000;
			break;
		case "3d":
			durationMs = 3 * 24 * 60 * 60 * 1000;
			break;
		case "7d":
			durationMs = 7 * 24 * 60 * 60 * 1000;
			break;
		default:
			// Should not happen due to validation, but handle defensively
			return undefined;
	}

	return now + durationMs;
}
