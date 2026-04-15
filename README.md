# Authentication Backend

A Node.js and Express authentication backend with MongoDB persistence, JWT-based auth, refresh-token session management, and email OTP verification.

## Overview

This project provides a foundational authentication system with:

- User registration
- Email verification via OTP
- User login
- Access token generation
- Refresh token rotation
- Session-based logout (single device and all devices)
- Basic profile lookup (`get-me`)

The codebase uses a modular structure (`controllers`, `models`, `routes`, `services`, `utils`) and is configured through environment variables.

## Tech Stack

- Node.js (ES Modules)
- Express
- MongoDB with Mongoose
- JSON Web Tokens (`jsonwebtoken`)
- Nodemailer (Gmail OAuth2)
- Cookie parsing (`cookie-parser`)
- Request logging (`morgan`)

## Project Structure

```text
.
├── configs/
│   └── config.js
├── controllers/
│   └── auth.controller.js
├── models/
│   ├── otp.model.js
│   ├── session.model.js
│   └── user.model.js
├── routes/
│   └── auth.routes.js
├── services/
│   └── email.service.js
├── src/
│   └── app.js
├── utils/
│   └── util.OTP.js
├── server.js
└── package.json
```

## Environment Variables

Create a `.env` file in the project root with the following values:

```env
PORT=3000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_USER=your_gmail_address
```

### Notes

- The app throws an error on startup if any required environment variable is missing.
- `refreshToken` cookies are set with `secure: true`, so they are intended for HTTPS environments.

## Installation and Running

1. Install dependencies:
   - `npm install`
2. Start the server:
   - `node server.js`

By default, the server runs at:

- `http://localhost:3000` (or your configured `PORT`)

## API Base Path

All auth routes are mounted under:

- `/api/auth`

## API Endpoints

### 1) Register

- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Body:**

```json
{
  "username": "your_username",
  "email": "user@example.com",
  "password": "your_password"
}
```

- **Behavior:**
  - Creates a new user with SHA-256 hashed password.
  - Generates and stores OTP hash in `OTP` collection.
  - Sends OTP email using Gmail OAuth2 transporter.

### 2) Verify Email

- **Method:** `GET` (as currently defined in routes)
- **Path:** `/api/auth/verify-email`
- **Expected Payload in Controller:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

- **Behavior:**
  - Compares hashed OTP with stored OTP hash.
  - Increments failed attempts.
  - Deletes OTP records after 3 invalid attempts.
  - Marks user as verified on success.

### 3) Login

- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Body:**

```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

or

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

- **Behavior:**
  - Validates credentials.
  - Requires verified email.
  - Issues:
    - Access token (in response JSON)
    - Refresh token (as HTTP-only cookie)
  - Persists refresh token hash and device/session metadata.

### 4) Get Current User

- **Method:** `GET`
- **Path:** `/api/auth/get-me`
- **Auth Source:** `refreshToken` cookie
- **Behavior:**
  - Validates refresh token hash against active session.
  - Returns `username` and `email`.

### 5) Refresh Access Token

- **Method:** `POST`
- **Path:** `/api/auth/refresh-token`
- **Auth Source:** `refreshToken` cookie
- **Behavior:**
  - Verifies refresh token.
  - Rotates refresh token.
  - Returns new access token.

### 6) Logout (Current Session)

- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Auth Source:** `refreshToken` cookie
- **Behavior:**
  - Revokes the current session.
  - Clears `refreshToken` cookie.

### 7) Logout All Sessions

- **Method:** `POST`
- **Path:** `/api/auth/logout-all`
- **Auth Source:** `refreshToken` cookie
- **Behavior:**
  - Revokes all sessions for the authenticated user.
  - Clears `refreshToken` cookie.

## Data Models

### User

- `username` (unique, required)
- `email` (unique, required)
- `password` (SHA-256 hash)
- `verified` (boolean, default `false`)

### Session

- `user` (ObjectId ref: `User`)
- `refreshTokenHash`
- `ip`
- `userAgent`
- `revoked` (default `false`)
- `createdAt`, `updatedAt`

### OTP

- `email`
- `user` (ObjectId ref: `User`)
- `otpHash`
- `tries` (default `0`)
- `createdAt`, `updatedAt`

## Authentication Flow Summary

1. User registers.
2. System sends OTP to user email.
3. User verifies email with OTP.
4. User logs in and receives:
   - Access token (short-lived)
   - Refresh token cookie (longer-lived)
5. Client uses refresh route to renew access token.
6. Client can logout from one session or all sessions.

## Current Scripts

From `package.json`:

- `npm test` currently prints a placeholder error and exits.

## Important Implementation Notes

- Passwords are hashed with plain SHA-256. For production, a stronger password hashing strategy (for example, bcrypt/argon2 with salting) is recommended.
- Refresh-token cookie is marked `secure: true`; in local non-HTTPS setups, cookie behavior can differ.
- The `verify-email` endpoint is routed as `GET`, but the controller reads `req.body`.
- There are logical inconsistencies in `refreshToken` controller implementation that may require correction before production use.

## License

ISC
