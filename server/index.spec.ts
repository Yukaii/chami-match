import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { v4 as uuidv4 } from "uuid"; // Import uuid for generating test IDs
import { appInstance as app } from "./index"; // Import named export for testing
import { getStore } from "./store"; // Import getStore instead of store
import type {
  Attempt,
  Challenge,
  CreateChallengePayload,
  JoinChallengePayload,
  LeaderboardEntry, // Add LeaderboardEntry
  LeaderboardResponse, // Add LeaderboardResponse
  Participant,
  SubmitAttemptPayload, // Add SubmitAttemptPayload
} from "./types";

// Define expected response types for clarity in tests
interface CreateSuccessResponse {
  id: string;
  accessCode: string;
  name: string;
  expiresAt?: number;
}

interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>; // Based on Zod's flattened errors
}

// Helper to create a valid payload
const createValidPayload = (overrides = {}): CreateChallengePayload => ({
  name: "Test Challenge",
  gameMode: "Standard",
  settings: { precision: 5, maxLife: 3, gameType: "Color" },
  deviceId: "test-device-1",
  displayName: "Tester",
  ...overrides,
});

// Helper function needs to be accessible by the leaderboard tests' beforeEach
const createValidAttemptPayload = (
  participant: Participant,
  winningStreak: number, // Changed from score
  overrides = {},
): SubmitAttemptPayload => ({
  participantId: participant.id,
  winningStreak: winningStreak, // Changed from score
  metadata: { rounds: 10, mode: "Standard", gameType: "Color", precision: 5 },
  deviceId: participant.deviceId, // Crucial for verification
  ...overrides,
});

describe("Challenge API", () => {
  // Reset store before each test if needed (depends on test isolation strategy)
  // For now, let's assume tests might interact, so we clear.
  // A better approach might be mocking the store or using a fresh instance per test.
  beforeEach(async () => {
    // Make beforeEach async if resetStore becomes async
    // Reset the store before each test using the exported function
    await getStore().resetStore(); // Use getStore() and await if needed
  });

  describe("POST /api/challenges", () => {
    it("should create a new challenge successfully with valid data", async () => {
      const payload = createValidPayload();
      const req = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await app.request(req);
      expect(res.status).toBe(201);

      const body = (await res.json()) as CreateSuccessResponse; // Assert type
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("accessCode");
      expect(body.name).toBe(payload.name);
      expect(body.accessCode).toMatch(/^[A-Z0-9]{6}$/); // Check format

      // Verify in store (optional, depends on testing strategy)
      const storedChallenge = await getStore().getChallengeById(body.id); // Use getStore()
      expect(storedChallenge).toBeDefined();
      if (storedChallenge) {
        // Type guard for challenge
        expect(storedChallenge.name).toBe(payload.name);
        expect(storedChallenge.participants.length).toBe(1);
        const participant = storedChallenge.participants[0];
        expect(participant).toBeDefined(); // Ensure participant exists at index 0
        if (participant) {
          // Type guard for participant
          expect(participant.displayName).toBe(payload.displayName);
          expect(participant.deviceId).toBe(payload.deviceId);
        }
      }
    });

    it("should return 400 if name is missing", async () => {
      const payload = createValidPayload({ name: undefined }); // Invalid payload
      const req = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as ErrorResponse; // Assert type
      expect(body.message).toBe("Validation Failed");
      expect(body.errors).toBeDefined(); // Check if errors object exists
      if (body.errors) {
        // Type guard
        expect(body.errors).toHaveProperty("name");
      }
    });

    it("should return 400 if settings are invalid", async () => {
      const payload = createValidPayload({
        settings: { precision: -1, maxLife: 3, gameType: "Color" },
      }); // Invalid precision
      const req = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as ErrorResponse; // Assert type
      expect(body.message).toBe("Validation Failed");
      expect(body.errors).toBeDefined(); // Check if errors object exists
      // Note: Zod flattens nested errors, so the key might be 'settings.precision' or similar
      // Let's check if *any* settings-related error exists for robustness
      if (body.errors) {
        // Type guard
        // Check if any key starts with 'settings' (could be 'settings' or 'settings.field')
        const hasSettingsError = Object.keys(body.errors).some((key) =>
          key.startsWith("settings"),
        );
        expect(hasSettingsError).toBe(true);
        // expect(body.errors).toHaveProperty('settings.precision'); // More specific check if needed
      }
    });

    it("should return 400 if deviceId is missing", async () => {
      const payload = createValidPayload({ deviceId: undefined }); // Invalid payload
      const req = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as ErrorResponse; // Assert type
      expect(body.message).toBe("Validation Failed");
      expect(body.errors).toBeDefined(); // Check if errors object exists
      if (body.errors) {
        // Type guard
        expect(body.errors).toHaveProperty("deviceId");
      }
    });

    // Add more validation tests (e.g., displayName, gameMode, etc.)
  });

  // Add describe blocks for other endpoints (join, attempts, leaderboard) later

  describe("POST /api/challenges/join", () => {
    let createdChallenge: CreateSuccessResponse; // To store created challenge info

    // Helper to create a challenge before join tests
    beforeEach(async () => {
      // Already async, good
      await getStore().resetStore(); // Use getStore() and await if needed
      const createPayload = createValidPayload();
      const createReq = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });
      const createRes = await app.request(createReq);
      createdChallenge = (await createRes.json()) as CreateSuccessResponse;
      expect(createRes.status).toBe(201); // Ensure creation was successful
    });

    it("should allow a new participant to join successfully", async () => {
      const joinPayload: JoinChallengePayload = {
        accessCode: createdChallenge.accessCode,
        deviceId: "new-device-2",
        displayName: "Joiner",
      };
      const req = new Request("http://localhost/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload),
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Challenge; // Expect full challenge object
      expect(body.id).toBe(createdChallenge.id);
      expect(body.participants.length).toBe(2); // Creator + Joiner
      const joiner = body.participants.find(
        (p: Participant) => p.deviceId === "new-device-2", // Add Participant type
      );
      expect(joiner).toBeDefined();
      if (joiner) {
        // Add type guard
        expect(joiner.displayName).toBe("Joiner");
      }
    });

    it("should allow an existing participant (creator) to rejoin", async () => {
      const creatorPayload = createValidPayload(); // Get creator's details
      const joinPayload: JoinChallengePayload = {
        accessCode: createdChallenge.accessCode,
        deviceId: creatorPayload.deviceId, // Use creator's device ID
        displayName: "Creator Rejoining", // Different name
      };
      const req = new Request("http://localhost/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload),
      });

      const res = await app.request(req);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Challenge;
      expect(body.id).toBe(createdChallenge.id);
      expect(body.participants.length).toBe(1); // Should not add a duplicate
      const participant = body.participants[0];
      expect(participant).toBeDefined(); // Ensure participant exists
      if (participant) {
        // Add type guard
        // Expect the name to be updated on rejoin as per current server logic
        expect(participant.displayName).toBe(joinPayload.displayName);
        expect(participant.deviceId).toBe(creatorPayload.deviceId);
      }
    });

    it("should return 404 if access code is invalid", async () => {
      const joinPayload: JoinChallengePayload = {
        accessCode: "XXXXXX", // Invalid 6-char code
        deviceId: "new-device-3",
        displayName: "Wannabe Joiner",
      };
      const req = new Request("http://localhost/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload),
      });

      const res = await app.request(req);
      expect(res.status).toBe(404);
      const textBody = await res.text(); // Read as text first
      // Now try to parse, or assert based on text if it's not JSON
      try {
        // Attempt to parse, expecting failure for plain text
        const body = JSON.parse(textBody) as ErrorResponse;
        expect(body.message).toBe("Challenge not found");
      } catch (e) {
        // If parsing fails, maybe assert the text directly?
        // For now, let the test fail if it's not JSON, but log helps debug.
        expect(textBody).toContain("Challenge not found"); // Basic text check as fallback
      }
    });

    it("should return 400 if deviceId is missing", async () => {
      const joinPayload = {
        // Intentionally missing deviceId
        accessCode: createdChallenge.accessCode,
        displayName: "Forgetful Joiner",
      };
      const req = new Request("http://localhost/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload),
      });

      const res = await app.request(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as ErrorResponse;
      expect(body.message).toBe("Validation Failed");
      expect(body.errors).toBeDefined();
      if (body.errors) {
        expect(body.errors).toHaveProperty("deviceId");
      }
    });

    // TODO: Add test for expired challenge (requires mocking Date.now or setting expiration)
  });

  describe("POST /api/challenges/:id/attempts", () => {
    let createdChallenge: CreateSuccessResponse;
    let creatorParticipant: Participant;
    let joinerParticipant: Participant;

    // Setup: Create a challenge and have two participants join
    beforeEach(async () => {
      // Already async, good
      await getStore().resetStore(); // Use getStore() and await if needed
      // 1. Create challenge
      const createPayload = createValidPayload();
      const createReq = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });
      const createRes = await app.request(createReq);
      createdChallenge = (await createRes.json()) as CreateSuccessResponse;
      expect(createRes.status).toBe(201);

      // Need to get the full challenge state to find participant IDs
      const initialChallengeState = await getStore().getChallengeById(
        createdChallenge.id,
      ); // Use getStore()
      expect(initialChallengeState).toBeDefined();
      if (
        !initialChallengeState ||
        initialChallengeState.participants.length === 0
      ) {
        throw new Error(
          "Test setup failed: Creator participant not found after challenge creation.",
        );
      }
      expect(initialChallengeState.participants.length).toBe(1);
      const creatorP = initialChallengeState.participants[0]; // Use temp var
      expect(creatorP).toBeDefined(); // Explicitly check participant exists
      if (!creatorP)
        throw new Error("Setup failed: Creator participant is undefined");
      creatorParticipant = creatorP; // Assign after check

      // 2. Join second participant
      const joinPayload: JoinChallengePayload = {
        accessCode: createdChallenge.accessCode,
        deviceId: "joiner-device-id",
        displayName: "Joiner",
      };
      const joinReq = new Request("http://localhost/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload),
      });
      const joinRes = await app.request(joinReq);
      expect(joinRes.status).toBe(200);
      const updatedChallengeState = (await joinRes.json()) as Challenge;
      const foundJoiner = updatedChallengeState.participants.find(
        (p) => p.deviceId === "joiner-device-id",
      );
      expect(foundJoiner).toBeDefined();
      if (!foundJoiner) {
        throw new Error(
          "Test setup failed: Joiner participant not found after joining.",
        );
      }
      // Fetch the updated state directly from the store to get the joiner's ID
      const finalChallengeState = await getStore().getChallengeById(
        createdChallenge.id,
      ); // Use getStore()
      expect(finalChallengeState).toBeDefined();
      if (!finalChallengeState)
        throw new Error(
          "Setup failed: Challenge not found in store after join",
        );
      const foundJoinerInStore = finalChallengeState.participants.find(
        (p) => p.deviceId === "joiner-device-id",
      );
      expect(foundJoinerInStore).toBeDefined();
      if (!foundJoinerInStore)
        throw new Error("Setup failed: Joiner not found in store after join");
      joinerParticipant = foundJoinerInStore; // Store joiner with ID
    });

    it("should allow creator to submit a valid attempt", async () => {
      const attemptPayload = createValidAttemptPayload(creatorParticipant, 100);
      const req = new Request(
        `http://localhost/api/challenges/${createdChallenge.id}/attempts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attemptPayload),
        },
      );

      const res = await app.request(req);
      expect(res.status).toBe(201);

      const body = (await res.json()) as Attempt;
      expect(body).toHaveProperty("id");
      expect(body.challengeId).toBe(createdChallenge.id);
      expect(body.participantId).toBe(creatorParticipant.id);
      expect(body.winningStreak).toBe(100); // Changed from score
      expect(body.metadata.rounds).toBe(10);

      // Verify in store
      const storedChallenge = await getStore().getChallengeById(
        createdChallenge.id,
      ); // Use getStore()
      expect(storedChallenge).toBeDefined();
      if (storedChallenge && storedChallenge.attempts.length > 0) {
        expect(storedChallenge.attempts.length).toBe(1);
        const attempt = storedChallenge.attempts[0]; // Get the first attempt
        expect(attempt).toBeDefined(); // Ensure attempt exists
        if (attempt) {
          // Type guard for attempt
          expect(attempt.id).toBe(body.id);
          expect(attempt.winningStreak).toBe(100); // Changed from score
        }
      } else {
        // Fail test explicitly if attempt wasn't stored correctly
        throw new Error(
          "Attempt verification failed: Attempt not found in store or store is empty.",
        );
      }
    });

    it("should allow joiner to submit a valid attempt", async () => {
      const attemptPayload = createValidAttemptPayload(joinerParticipant, 150);
      const req = new Request(
        `http://localhost/api/challenges/${createdChallenge.id}/attempts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attemptPayload),
        },
      );

      const res = await app.request(req);
      expect(res.status).toBe(201);
      const body = (await res.json()) as Attempt;
      expect(body.participantId).toBe(joinerParticipant.id);
      expect(body.winningStreak).toBe(150); // Changed from score

      // Verify in store
      const storedChallenge = await getStore().getChallengeById(
        createdChallenge.id,
      ); // Use getStore()
      expect(storedChallenge).toBeDefined();
      if (storedChallenge && storedChallenge.attempts.length > 0) {
        expect(storedChallenge.attempts.length).toBe(1); // Only this attempt
        const attempt = storedChallenge.attempts[0]; // Get the first attempt
        expect(attempt).toBeDefined(); // Ensure attempt exists
        if (attempt) {
          // Type guard for attempt
          expect(attempt.winningStreak).toBe(150); // Changed from score
        }
      } else {
        // Fail test explicitly if attempt wasn't stored correctly
        throw new Error(
          "Attempt verification failed: Attempt not found in store or store is empty.",
        );
      }
    });

    it("should return 400 for invalid score", async () => {
      const attemptPayload = createValidAttemptPayload(creatorParticipant, -50); // Invalid score
      const req = new Request(
        `http://localhost/api/challenges/${createdChallenge.id}/attempts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attemptPayload),
        },
      );

      const res = await app.request(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as ErrorResponse;
      expect(body.message).toBe("Validation Failed");
      expect(body.errors).toBeDefined();
      if (body.errors) {
        expect(body.errors).toHaveProperty("winningStreak"); // Changed from score
      }
    });

    it("should return 400 for missing metadata", async () => {
      const attemptPayload = {
        // Missing metadata
        participantId: creatorParticipant.id,
        score: 99,
        deviceId: creatorParticipant.deviceId,
      };
      const req = new Request(
        `http://localhost/api/challenges/${createdChallenge.id}/attempts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attemptPayload),
        },
      );

      const res = await app.request(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as ErrorResponse;
      expect(body.message).toBe("Validation Failed");
      expect(body.errors).toBeDefined();
      if (body.errors) {
        expect(body.errors).toHaveProperty("metadata");
      }
    });

    it("should return 404 for non-existent challenge ID", async () => {
      const attemptPayload = createValidAttemptPayload(creatorParticipant, 100);
      const req = new Request(
        "http://localhost/api/challenges/invalid-challenge-id/attempts",
        {
          // Bad ID - Use simple string
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attemptPayload),
        },
      );

      const res = await app.request(req);
      expect(res.status).toBe(404);
      const textBody = await res.text(); // Read as text
      expect(textBody).toContain("Challenge not found"); // Assert text content
    });

    it("should return 404 for non-existent participant ID in challenge", async () => {
      const nonExistentParticipantId = uuidv4(); // Generate a valid but non-existent UUID
      const attemptPayload = createValidAttemptPayload(
        creatorParticipant,
        100,
        {
          participantId: nonExistentParticipantId, // Use the valid UUID
        },
      );
      const req = new Request(
        `http://localhost/api/challenges/${createdChallenge.id}/attempts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attemptPayload),
        },
      );

      const res = await app.request(req);
      expect(res.status).toBe(404);
      const textBody = await res.text(); // Read as text
      expect(textBody).toContain("Participant not found in this challenge"); // Assert text content
    });

    it("should return 403 for mismatched device ID", async () => {
      const attemptPayload = createValidAttemptPayload(
        creatorParticipant,
        100,
        {
          deviceId: "wrong-device-id", // Mismatched device ID
        },
      );
      const req = new Request(
        `http://localhost/api/challenges/${createdChallenge.id}/attempts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attemptPayload),
        },
      );

      const res = await app.request(req);
      expect(res.status).toBe(403);
      const textBody = await res.text(); // Read as text
      expect(textBody).toContain("Forbidden: Device ID mismatch"); // Assert text content
    });

    // TODO: Add test for submitting score to expired challenge
  });

  describe("GET /api/challenges/:id/leaderboard", () => {
    let createdChallenge: CreateSuccessResponse;
    let creator: Participant;
    let joiner1: Participant;
    let joiner2: Participant; // Add a third participant

    // Helper to submit an attempt
    const submitAttempt = async (
      participant: Participant,
      winningStreak: number,
    ) => {
      // Changed from score
      // Use the globally defined helper
      const attemptPayload = createValidAttemptPayload(
        participant,
        winningStreak,
      ); // Changed from score
      const req = new Request(
        `http://localhost/api/challenges/${createdChallenge.id}/attempts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attemptPayload),
        },
      );
      const res = await app.request(req);
      expect(res.status).toBe(201); // Ensure submission is successful
      // Add a small delay to ensure distinct submission times if needed for sorting tests
      await new Promise((resolve) => setTimeout(resolve, 5));
    };

    // Setup: Create challenge, join participants, submit attempts
    beforeEach(async () => {
      // Already async, good
      // Mark as async
      await getStore().resetStore(); // Use getStore() and await if needed
      // 1. Create challenge
      const createPayload = createValidPayload({ name: "Leaderboard Test" });
      const createReq = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });
      const createRes = await app.request(createReq);
      createdChallenge = (await createRes.json()) as CreateSuccessResponse;
      expect(createRes.status).toBe(201);

      const initialChallengeState = await getStore().getChallengeById(
        createdChallenge.id,
      ); // Use getStore()
      if (
        !initialChallengeState ||
        initialChallengeState.participants.length === 0
      )
        throw new Error("Setup failed: Creator not found");
      const creatorP = initialChallengeState.participants[0]; // Use temp var
      expect(creatorP).toBeDefined(); // Explicitly check participant exists
      if (!creatorP)
        throw new Error("Setup failed: Creator participant is undefined");
      creator = creatorP; // Assign after check

      // 2. Join participant 1
      const joinPayload1: JoinChallengePayload = {
        accessCode: createdChallenge.accessCode,
        deviceId: "joiner1-dev",
        displayName: "Joiner One",
      };
      const joinReq1 = new Request("http://localhost/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload1),
      });
      const joinRes1 = await app.request(joinReq1);
      expect(joinRes1.status).toBe(200);
      // Don't rely on the sanitized response for joiner1's details yet

      // 3. Join participant 2
      const joinPayload2: JoinChallengePayload = {
        accessCode: createdChallenge.accessCode,
        deviceId: "joiner2-dev",
        displayName: "Joiner Two",
      };
      const joinReq2 = new Request("http://localhost/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinPayload2),
      });
      const joinRes2 = await app.request(joinReq2);
      expect(joinRes2.status).toBe(200);
      // Don't rely on the sanitized response for joiner2's details yet

      // 4. Fetch the final state from the store AFTER both joins are complete
      const finalState = await getStore().getChallengeById(createdChallenge.id); // Use getStore()
      if (!finalState)
        throw new Error("Setup failed: Challenge disappeared from store");
      const finalCreator = finalState.participants.find(
        (p: Participant) => p.deviceId === creator.deviceId, // Add Participant type
      );
      const finalJoiner1 = finalState.participants.find(
        (p: Participant) => p.deviceId === "joiner1-dev", // Add Participant type // Use the known deviceId
      );
      const finalJoiner2 = finalState.participants.find(
        (p: Participant) => p.deviceId === "joiner2-dev", // Add Participant type // Use the known deviceId
      );
      if (!finalCreator || !finalJoiner1 || !finalJoiner2)
        throw new Error(
          "Setup failed: Could not find all participants in store",
        );

      creator = finalCreator; // Update with ID
      joiner1 = finalJoiner1; // Update with ID
      joiner2 = finalJoiner2; // Update with ID

      // 4. Submit some scores (now using participants with IDs)
      await submitAttempt(joiner1, 150); // Joiner 1 scores 150
      await submitAttempt(creator, 100); // Creator scores 100
      await submitAttempt(joiner1, 120); // Joiner 1 scores 120 (lower, should be ignored)
      await submitAttempt(joiner2, 200); // Joiner 2 scores 200 (highest)
      await submitAttempt(creator, 180); // Creator scores 180 (new best)
    });

    it("should return the leaderboard sorted by score (desc)", async () => {
      const req = new Request(
        `http://localhost/api/challenges/${createdChallenge.id}/leaderboard`,
        {
          method: "GET",
        },
      );
      const res = await app.request(req);
      expect(res.status).toBe(200);

      const body = (await res.json()) as LeaderboardResponse;
      expect(body.challengeName).toBe("Leaderboard Test");
      expect(body.leaderboard).toBeInstanceOf(Array);
      expect(body.leaderboard.length).toBe(3); // Creator, Joiner1, Joiner2

      // Check sorting: Joiner2 (200), Creator (180), Joiner1 (150)
      const entry0 = body.leaderboard[0];
      const entry1 = body.leaderboard[1];
      const entry2 = body.leaderboard[2];
      expect(entry0).toBeDefined();
      expect(entry1).toBeDefined();
      expect(entry2).toBeDefined();

      if (entry0) {
        // expect(entry0.participantId).toBe(joiner2.id); // Removed participantId check
        expect(entry0.winningStreak).toBe(200); // Changed from score
        expect(entry0.displayName).toBe("Joiner Two");
      }
      if (entry1) {
        // expect(entry1.participantId).toBe(creator.id); // Removed participantId check
        expect(entry1.winningStreak).toBe(180); // Changed from score
        expect(entry1.displayName).toBe("Tester"); // Creator's original name
      }
      if (entry2) {
        // expect(entry2.participantId).toBe(joiner1.id); // Removed participantId check
        expect(entry2.winningStreak).toBe(150); // Changed from score
        expect(entry2.displayName).toBe("Joiner One");
      }
    });

    it("should return an empty leaderboard if no attempts submitted", async () => {
      // Create a new challenge with no attempts
      await getStore().resetStore(); // Use getStore() and await if needed
      const createPayload = createValidPayload({ name: "Empty Test" });
      const createReq = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });
      const createRes = await app.request(createReq);
      const emptyChallenge = (await createRes.json()) as CreateSuccessResponse;
      expect(createRes.status).toBe(201);

      const req = new Request(
        `http://localhost/api/challenges/${emptyChallenge.id}/leaderboard`,
        {
          method: "GET",
        },
      );
      const res = await app.request(req);
      expect(res.status).toBe(200);

      const body = (await res.json()) as LeaderboardResponse;
      expect(body.challengeName).toBe("Empty Test");
      expect(body.leaderboard).toBeInstanceOf(Array);
      expect(body.leaderboard.length).toBe(1); // Only the creator exists
      const entry0 = body.leaderboard[0];
      expect(entry0).toBeDefined();
      if (entry0) {
        expect(entry0.winningStreak).toBe(0); // Streak defaults to 0 if no attempts
        expect(entry0.submittedAt).toBe(0); // Timestamp defaults to 0
      }
    });

    it("should return 404 for non-existent challenge ID", async () => {
      const req = new Request(
        "http://localhost/api/challenges/invalid-id/leaderboard",
        {
          method: "GET",
        },
      );
      const res = await app.request(req);
      expect(res.status).toBe(404);
      const textBody = await res.text();
      expect(textBody).toContain("Challenge not found");
    });
  });

  describe("GET /api/challenges/:id", () => {
    let createdChallenge: CreateSuccessResponse;
    let creator: Participant;

    beforeEach(async () => {
      // Already async, good
      await getStore().resetStore(); // Use getStore() and await if needed
      // Create a challenge
      const createPayload = createValidPayload({ name: "Get Details Test" });
      const createReq = new Request("http://localhost/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });
      const createRes = await app.request(createReq);
      createdChallenge = (await createRes.json()) as CreateSuccessResponse;
      expect(createRes.status).toBe(201);

      const initialChallengeState = await getStore().getChallengeById(
        createdChallenge.id,
      ); // Use getStore()
      if (
        !initialChallengeState ||
        initialChallengeState.participants.length === 0
      )
        throw new Error("Setup failed: Creator not found");
      const creatorP = initialChallengeState.participants[0];
      if (!creatorP)
        throw new Error("Setup failed: Creator participant is undefined");
      creator = creatorP;
    });

    it("should return the full challenge details for a valid ID", async () => {
      const req = new Request(
        `http://localhost/api/challenges/${createdChallenge.id}`,
        {
          method: "GET",
        },
      );
      const res = await app.request(req);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Challenge;
      expect(body.id).toBe(createdChallenge.id);
      expect(body.name).toBe("Get Details Test");
      expect(body.accessCode).toBe(createdChallenge.accessCode);
      expect(body.participants).toBeInstanceOf(Array);
      expect(body.participants.length).toBe(1);
      const participant = body.participants[0];
      expect(participant).toBeDefined();
      if (participant) {
        expect(participant.displayName).toBe("Tester");
        expect(participant).not.toHaveProperty("id"); // Verify ID is removed
      }
      expect(body.attempts).toBeInstanceOf(Array); // Attempts should still be there (though maybe empty)
      expect(body.attempts.length).toBe(0);
      expect(body.settings.gameType).toBe("Color");
    });

    it("should return 404 for a non-existent challenge ID", async () => {
      const nonExistentId = uuidv4(); // Generate a valid but non-existent UUID
      const req = new Request(
        `http://localhost/api/challenges/${nonExistentId}`,
        {
          method: "GET",
        },
      );
      const res = await app.request(req);
      expect(res.status).toBe(404);
      const textBody = await res.text();
      expect(textBody).toContain("Challenge not found");
    });
  });
});
