# Chami Match Challenge Server

This directory contains the Hono server implementation for the Chami Match challenge feature (Issue #62). It provides API endpoints for creating, joining, submitting scores to, and viewing leaderboards for time-limited challenges.

## Architecture Overview

- **Framework:** [Hono](https://hono.dev/) - A fast, lightweight, and simple web framework for the Edge.
- **Runtime:** [Bun](https://bun.sh/) - Used for running the server and tests.
- **Validation:** [@hono/zod-validator](https://github.com/honojs/middleware/tree/main/packages/zod-validator) & [Zod](https://zod.dev/) - For validating incoming request payloads.
- **Data Storage:** Simple in-memory `Map` (`server/store.ts`) - **Note:** This is temporary for development. Data will be lost on server restart. A persistent database solution (e.g., SQLite, PostgreSQL, Redis) should be considered for production.
- **Testing:** [Bun Test](https://bun.sh/docs/test/writing) - Bun's built-in test runner.

## File Structure

- `index.ts`: Main Hono application setup and route definitions.
- `types.ts`: TypeScript interfaces for data models, API payloads, and Zod validation schemas.
- `store.ts`: Simple in-memory data store implementation.
- `utils.ts`: Utility functions (e.g., access code generation).
- `index.spec.ts`: Test suite using Bun Test.
- `package.json`: Project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.

## API Endpoints

All endpoints are prefixed with `/api`.

- **`POST /challenges`**: Creates a new challenge.
  - **Request Body:** `CreateChallengePayload` (see `types.ts`)
  - **Response (201 Created):** `{ id: string, accessCode: string, name: string, expiresAt?: number }`
  - **Response (400 Bad Request):** Validation error details.
- **`POST /challenges/join`**: Allows a participant to join an existing challenge using an access code.
  - **Request Body:** `JoinChallengePayload` (see `types.ts`)
  - **Response (200 OK):** Full `Challenge` object including participants and attempts.
  - **Response (400 Bad Request):** Validation error details.
  - **Response (404 Not Found):** If the access code is invalid.
  - **Response (410 Gone):** If the challenge has expired.
- **`POST /challenges/:id/attempts`**: Submits a score attempt for a specific challenge.
  - **URL Parameter:** `:id` - The ID of the challenge.
  - **Request Body:** `SubmitAttemptPayload` (see `types.ts`)
  - **Response (201 Created):** The created `Attempt` object.
  - **Response (400 Bad Request):** Validation error details.
  - **Response (403 Forbidden):** If the `deviceId` in the payload doesn't match the participant's registered `deviceId`.
  - **Response (404 Not Found):** If the challenge ID or participant ID is invalid.
  - **Response (410 Gone):** If the challenge has expired.
- **`GET /challenges/:id/leaderboard`**: Retrieves the leaderboard for a specific challenge, sorted by highest score first.
  - **URL Parameter:** `:id` - The ID of the challenge.
  - **Response (200 OK):** `LeaderboardResponse` (see `types.ts`) containing challenge info and the sorted leaderboard entries.
  - **Response (404 Not Found):** If the challenge ID is invalid.

## Setup & Running

1.  **Install Dependencies:**
    ```bash
    cd server
    bun install
    ```
2.  **Run Development Server (with hot-reloading):**
    ```bash
    bun run dev
    ```
    *(Note: The `dev` script needs to be added to `package.json` if not already present)*
3.  **Run Tests:**
    ```bash
    bun test
    ```

## TODOs / Future Enhancements

- Implement persistent storage (e.g., database).
- Add logic for handling expired challenges (cleanup, preventing joins/submissions).
- Implement more robust access code generation to guarantee uniqueness.
- Consider authentication/authorization for user-specific actions if needed.
- Add tests for expiration logic.
