import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { cors } from "hono/cors"; // Import cors
import { HTTPException } from "hono/http-exception";
import { v4 as uuidv4 } from "uuid"; // Import uuid
import { store } from "./store";
import {
  type Attempt, // Import Attempt type
  type Challenge,
  CreateChallengePayloadSchema,
  JoinChallengePayloadSchema,
  type LeaderboardEntry, // Import LeaderboardEntry type
  type Participant,
  SubmitAttemptPayloadSchema,
} from "./types";
import { calculateExpiresAt, generateAccessCode } from "./utils";

const app = new Hono();

// Enable CORS for all routes
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
console.log(`CORS Origin: ${CORS_ORIGIN}`);

app.use(
  "*",
  cors({
    origin: CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type"],
    exposeHeaders: ["Content-Length", "Content-Type"],
  }),
);

// Simple middleware for logging
app.use("*", async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`);
  await next();
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// --- Challenge API Endpoints ---

// POST /api/challenges (create)
app.post(
  "/api/challenges",
  zValidator("json", CreateChallengePayloadSchema, (result, c) => {
    if (!result.success) {
      // Log the validation errors for debugging
      console.error("Validation failed:", result.error.errors);
      // Return a more specific error response
      return c.json(
        {
          message: "Validation Failed",
          errors: result.error.flatten().fieldErrors, // Send flattened errors
        },
        400,
      );
    }
  }),
  async (c) => {
    const payload = c.req.valid("json");
    const now = Date.now();

    // Generate unique IDs and access code
    const challengeId = uuidv4(); // Use uuidv4
    let accessCode = generateAccessCode();
    // Basic check for access code collision (improve if needed)
    let attempts = 0;
    while (store.getChallengeByAccessCode(accessCode) && attempts < 10) {
      console.warn(`Access code collision for ${accessCode}, regenerating...`);
      accessCode = generateAccessCode();
      attempts++;
    }
    if (attempts >= 10) {
      console.error("Failed to generate unique access code after 10 attempts.");
      throw new HTTPException(500, {
        message: "Internal Server Error: Could not generate unique access code",
      });
    }

    const participantId = uuidv4(); // Use uuidv4 // Unique ID for the participant

    // Create initial participant (the creator)
    const creator: Participant = {
      id: participantId,
      challengeId: challengeId,
      displayName: payload.displayName,
      deviceId: payload.deviceId,
      userId: payload.userId,
      joinedAt: now,
    };

    // Create the challenge object
    const newChallenge: Challenge = {
      id: challengeId,
      accessCode: accessCode,
      name: payload.name,
      createdAt: now,
      expiresAt: calculateExpiresAt(payload.expiresIn),
      gameMode: payload.gameMode,
      settings: payload.settings,
      participants: [creator], // Start with the creator
      attempts: [], // No attempts initially
    };

    try {
      store.addChallenge(newChallenge);
      // Return the essential info needed, including the creator's participant ID
      return c.json(
        {
          id: newChallenge.id,
          accessCode: newChallenge.accessCode,
          name: newChallenge.name,
          expiresAt: newChallenge.expiresAt,
          participantId: creator.id, // Add creator's participant ID
        },
        201,
      );
    } catch (error) {
      console.error("Error adding challenge to store:", error);
      throw new HTTPException(500, {
        message: "Internal Server Error: Failed to save challenge",
      });
    }
  },
);

// POST /api/challenges/join (join)
app.post(
  "/api/challenges/join",
  zValidator("json", JoinChallengePayloadSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          message: "Validation Failed",
          errors: result.error.flatten().fieldErrors,
        },
        400,
      );
    }
  }),
  async (c) => {
    const payload = c.req.valid("json");
    const now = Date.now();

    const challenge = store.getChallengeByAccessCode(payload.accessCode);

    if (!challenge) {
      throw new HTTPException(404, { message: "Challenge not found" });
    }

    // Check if challenge has expired
    if (challenge.expiresAt && now > challenge.expiresAt) {
      throw new HTTPException(410, { message: "Challenge has expired" }); // 410 Gone
    }

    // Check if participant already exists (by deviceId)
    let participant = challenge.participants.find(
      (p) => p.deviceId === payload.deviceId,
    );
    let needsUpdate = false; // Declare needsUpdate variable

    if (!participant) {
      // Add new participant
      needsUpdate = true; // Mark for update when adding new participant
      const newParticipantId = uuidv4();
      participant = {
        id: newParticipantId,
        challengeId: challenge.id,
        deviceId: payload.deviceId,
        displayName: payload.displayName,
        userId: payload.userId,
        joinedAt: now,
      };
      challenge.participants.push(participant);

      try {
        store.updateChallenge(challenge); // Save the updated challenge with the new participant
      } catch (error) {
        console.error("Error updating challenge store:", error);
        throw new HTTPException(500, {
          message: "Internal Server Error: Failed to save participant",
        });
      }
    } else {
      // Optional: Update display name if participant rejoins with a different name?
      // For now, we just recognize them.
      // Update display name if participant rejoins with a different name
      if (participant.displayName !== payload.displayName) {
        console.log(
          `Updating displayName for participant ${participant.id} from "${participant.displayName}" to "${payload.displayName}"`,
        );
        participant.displayName = payload.displayName;
        // No need to call store.updateChallenge here yet, it happens below if needed
      }
      console.log(
        `Participant ${participant.id} (${payload.deviceId}) rejoined challenge ${challenge.id}`,
      );
      // Check if display name needs update
      if (participant.displayName !== payload.displayName) {
        needsUpdate = true; // Mark for update
        participant.displayName = payload.displayName;
      }
    }

    // Save changes if needed (new participant added or existing one updated)
    if (needsUpdate) {
      try {
        store.updateChallenge(challenge); // Single update call
      } catch (error) {
        console.error("Error updating challenge store on join:", error);
        // Decide if this error should prevent the response. For now, let's log and continue.
        // throw new HTTPException(500, { message: "Internal Server Error: Failed to save participant update" });
      }
    }

    // Prepare the response: return challenge details BUT sanitize participant IDs
    // Also return the specific participantId for the user who just joined/rejoined
    const sanitizedParticipants = challenge.participants.map(
      ({ id, ...rest }) => rest,
    ); // Remove 'id' from each participant
    const responsePayload = {
      ...challenge, // Spread the original challenge data
      participants: sanitizedParticipants, // Use the sanitized list
      participantId: participant.id, // Add the current user's participant ID separately
    };

    return c.json(responsePayload);
  },
);

// POST /api/challenges/:id/attempts (submit score)
app.post(
  "/api/challenges/:id/attempts",
  zValidator("json", SubmitAttemptPayloadSchema, (result, c) => {
    if (!result.success) {
      // Log the validation errors and the received payload for debugging
      console.error(
        "Attempt Submission Validation failed:",
        JSON.stringify(result.error.errors, null, 2),
      );
      // Log the raw body text to see exactly what was received
      c.req
        .text()
        .then((text) => console.error("Received attempt payload:", text))
        .catch((err) =>
          console.error("Error reading request body for logging:", err),
        );
      return c.json(
        {
          message: "Validation Failed",
          errors: result.error.flatten().fieldErrors,
        },
        400,
      );
    }
  }),
  async (c) => {
    const challengeId = c.req.param("id");
    const payload = c.req.valid("json");
    const now = Date.now();

    const challenge = store.getChallengeById(challengeId);

    if (!challenge) {
      throw new HTTPException(404, { message: "Challenge not found" });
    }

    // Check if challenge has expired
    if (challenge.expiresAt && now > challenge.expiresAt) {
      throw new HTTPException(410, { message: "Challenge has expired" });
    }

    // Find the participant within this challenge
    const participant = challenge.participants.find(
      (p) => p.id === payload.participantId,
    );

    if (!participant) {
      throw new HTTPException(404, {
        message: "Participant not found in this challenge",
      });
    }

    // Verify the device ID matches the participant submitting the score
    if (participant.deviceId !== payload.deviceId) {
      console.warn(
        `Device ID mismatch for participant ${payload.participantId}. Expected ${participant.deviceId}, got ${payload.deviceId}`,
      );
      throw new HTTPException(403, {
        message: "Forbidden: Device ID mismatch",
      });
    }

    // --- Optional: Check for duplicate submissions ---
    // Decide on the policy: allow multiple attempts or only one?
    // For now, let's allow multiple attempts per participant.
    // The leaderboard logic will determine how to rank them (e.g., highest score).
    /*
    const existingAttempt = challenge.attempts.find(a => a.participantId === payload.participantId);
    if (existingAttempt) {
        // Policy decision: Reject or Update?
        // Let's reject for now to enforce one attempt per participant
         throw new HTTPException(409, { message: 'Conflict: Score already submitted for this participant' });
    }
    */

    // Create the new attempt object
    const newAttempt: Attempt = {
      id: uuidv4(), // Unique ID for the attempt
      challengeId: challengeId,
      participantId: payload.participantId,
      winningStreak: payload.winningStreak, // Changed from score
      submittedAt: now,
      sessionId: payload.sessionId,
      metadata: payload.metadata,
    };

    // Add the attempt to the challenge
    challenge.attempts.push(newAttempt);

    try {
      store.updateChallenge(challenge); // Save the updated challenge with the new attempt
      return c.json(newAttempt, 201); // Return the created attempt
    } catch (error) {
      console.error("Error updating challenge store with new attempt:", error);
      throw new HTTPException(500, {
        message: "Internal Server Error: Failed to save attempt",
      });
    }
  },
);

// GET /api/challenges/:id/leaderboard (view scores)
app.get("/api/challenges/:id/leaderboard", (c) => {
  const challengeId = c.req.param("id");
  const challenge = store.getChallengeById(challengeId);

  if (!challenge) {
    throw new HTTPException(404, { message: "Challenge not found" });
  }

  // Process attempts to find the best score per participant
  const bestAttempts = new Map<string, Attempt>(); // participantId -> best Attempt object

  for (const attempt of challenge.attempts) {
    const currentBest = bestAttempts.get(attempt.participantId);
    // Compare winning streaks instead of scores
    if (!currentBest || attempt.winningStreak > currentBest.winningStreak) {
      bestAttempts.set(attempt.participantId, attempt);
    }
    // Optional: Handle streak ties (e.g., prefer earlier submission)
    // else if (attempt.winningStreak === currentBest.winningStreak && attempt.submittedAt < currentBest.submittedAt) {
    //   bestAttempts.set(attempt.participantId, attempt);
    // }
  }

  // Create leaderboard entries (without participantId)
  const leaderboard: LeaderboardEntry[] = challenge.participants.map(
    (participant) => {
      const bestAttempt = bestAttempts.get(participant.id);
      return {
        // participantId: participant.id, // DO NOT EXPOSE internal ID
        displayName: participant.displayName,
        // Use best winning streak if available, otherwise 0.
        winningStreak: bestAttempt ? bestAttempt.winningStreak : 0, // Changed from score
        // Use timestamp of best streak submission, or 0 if no submission.
        submittedAt: bestAttempt ? bestAttempt.submittedAt : 0,
        // Add userId if needed: userId: participant.userId
      };
    },
  );

  // Sort leaderboard by winning streak (descending), then by submission time (ascending for ties)
  leaderboard.sort((a, b) => {
    if (b.winningStreak !== a.winningStreak) {
      return b.winningStreak - a.winningStreak; // Higher streak first
    }
    // If streaks are equal, earlier submission ranks higher (lower timestamp)
    // Handle participants with no submissions (submittedAt = 0) - they rank last among ties
    if (a.submittedAt === 0 && b.submittedAt === 0) return 0; // Both no submissions, order doesn't matter
    if (a.submittedAt === 0) return 1; // a has no submission, ranks lower
    if (b.submittedAt === 0) return -1; // b has no submission, ranks lower
    return a.submittedAt - b.submittedAt; // Earlier submission first
  });

  // Return the sorted leaderboard
  // Include challenge info like name, gameMode, and expiration
  return c.json({
    challengeName: challenge.name,
    gameMode: challenge.gameMode, // Add gameMode here
    expiresAt: challenge.expiresAt,
    leaderboard: leaderboard,
  });
});

// GET /api/challenges/:id (get specific challenge details)
app.get("/api/challenges/:id", (c) => {
  const challengeId = c.req.param("id");
  const challenge = store.getChallengeById(challengeId);

  if (!challenge) {
    throw new HTTPException(404, { message: "Challenge not found" });
  }

  // Return the challenge details, but sanitize participant IDs
  const sanitizedParticipants = challenge.participants.map(
    ({ id, ...rest }) => rest,
  ); // Remove 'id'
  const responsePayload = {
    ...challenge,
    participants: sanitizedParticipants,
  };
  return c.json(responsePayload);
});

// Export the app instance for testing
export const appInstance = app;

const PORT = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8787;

// Export for both development and production
export default {
  port: PORT,
  fetch: app.fetch.bind(app),
};
