export interface ChallengeSettings {
	precision: number;
	maxLife: number;
	gameType: string;
}

export interface Challenge {
	id: string; // Unique identifier
	accessCode: string; // Short code for easy sharing
	name: string; // Challenge name
	createdAt: number; // Unix timestamp (ms)
	expiresAt?: number; // Optional expiration timestamp (ms)
	gameMode: string; // Game mode used
	settings: ChallengeSettings; // Game settings for this challenge
	// isLocal is not needed on the server side
	participants: Participant[];
	attempts: Attempt[];
}

export interface Participant {
	id: string; // Unique identifier
	challengeId: string; // Reference to challenge
	displayName: string; // Player name (anonymous ok)
	deviceId: string; // Unique device identifier
	userId?: string; // Optional user ID if logged in
	joinedAt: number; // Unix timestamp (ms)
}

export interface AttemptMetadata {
	rounds: number;
	mode: string;
	gameType: string;
	precision: number;
	// Add any other game-specific data needed
}

export interface Attempt {
	id: string; // Unique identifier
	challengeId: string; // Reference to challenge
	participantId: string; // Reference to participant (using deviceId or internal participant ID)
	winningStreak: number; // Player's winning streak
	submittedAt: number; // Unix timestamp (ms)
	sessionId?: string; // Optional reference to local game session
	metadata: AttemptMetadata; // Additional game data
}

// --- API Request Payloads ---

export interface CreateChallengePayload {
	name: string;
	expiresIn?: "1h" | "24h" | "3d" | "7d"; // Or maybe just expiresAt timestamp? Spec says "1 hour, 24 hours, 3 days, 7 days, or never"
	gameMode: string;
	settings: ChallengeSettings;
	// deviceId needed to create the first participant (the creator)
	deviceId: string;
	displayName: string;
	userId?: string;
}

export interface JoinChallengePayload {
	accessCode: string;
	deviceId: string;
	displayName: string;
	userId?: string;
}

export interface SubmitAttemptPayload {
	participantId: string; // Or maybe deviceId? Let's use participantId for now.
	winningStreak: number; // Changed from score
	sessionId?: string;
	metadata: AttemptMetadata;
	deviceId: string; // To verify participant
}

// --- Zod Schemas for Validation ---
import { z } from "zod";

const ChallengeSettingsSchema = z.object({
	precision: z.number().min(0),
	maxLife: z.number().int().min(1),
	gameType: z.string().min(1),
});

export const CreateChallengePayloadSchema = z.object({
	name: z.string().min(1).max(100), // Added max length
	expiresIn: z.enum(["1h", "24h", "3d", "7d"]).optional(),
	gameMode: z.string().min(1),
	settings: ChallengeSettingsSchema,
	deviceId: z.string().min(1), // Assuming device ID is non-empty
	displayName: z.string().min(1).max(50), // Added max length
	userId: z.string().optional(),
});

// --- API Response Structures ---

// Publicly visible leaderboard entry - does NOT include internal participantId
export interface LeaderboardEntry {
	displayName: string;
	winningStreak: number; // Changed from score
	submittedAt: number; // Timestamp of the best streak submission
	// Add other relevant participant info if needed (e.g., userId)
}

export interface LeaderboardResponse {
	challengeName: string;
	gameMode: string; // Add gameMode
	expiresAt?: number;
	leaderboard: LeaderboardEntry[];
}

const AttemptMetadataSchema = z.object({
	rounds: z.number().int().min(1),
	mode: z.string().min(1),
	gameType: z.string().min(1),
	precision: z.number().min(0),
	// Add validation for other metadata fields if needed
});

export const SubmitAttemptPayloadSchema = z.object({
	participantId: z.string().uuid(), // Expecting UUID for participant ID
	winningStreak: z.number().int().min(0), // Changed from score, assuming streak cannot be negative
	sessionId: z.string().optional(),
	metadata: AttemptMetadataSchema,
	deviceId: z.string().min(1), // Used for verification
});

export const JoinChallengePayloadSchema = z.object({
	accessCode: z.string().length(6), // Assuming 6-char access code
	deviceId: z.string().min(1),
	displayName: z.string().min(1).max(50),
	userId: z.string().optional(),
});
