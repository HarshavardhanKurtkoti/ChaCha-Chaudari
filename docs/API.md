# SmartGanga Mascot (ChaCha-Chaudari) — REST API Specification

All API endpoints return JSON payloads (except `/tts` which returns `audio/wav`, `audio/mpeg`, or `audio/ogg`).

---

## Base URLs
- **Main Backend:** `http://127.0.0.1:5000` (or prefix `/api`)
- **TTS Microservice:** `http://127.0.0.1:6001`

---

## 1. System & Health

### `GET /health` / `GET /api/health`
Returns system operational metrics and service connectivity.

**Response (200 OK):**
```json
{
  "service": "SmartGanga Backend",
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2026-11-01T15:35:00.000000+00:00",
  "mongodb_connected": true
}
```

---

## 2. Authentication

### `POST /auth/register`
Creates a new user profile and returns an initial JWT authentication token.

**Request Body:**
```json
{
  "name": "Arjun Sharma",
  "email": "arjun@example.com",
  "password": "SecurePassword123!",
  "age": 14,
  "admin_code": "optional-admin-secret"
}
```

**Response (201 Created):**
```json
{
  "email": "arjun@example.com",
  "name": "Arjun Sharma",
  "age": 14,
  "is_admin": false,
  "created": "2026-11-01T15:35:00.000000+00:00",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

### `POST /auth/login`
Authenticates with email and password.

**Request Body:**
```json
{
  "email": "arjun@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "email": "arjun@example.com",
  "name": "Arjun Sharma",
  "age": 14,
  "is_admin": false,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

### `POST /auth/google-login`
Authenticates or registers a user via Google OAuth ID token.

**Request Body:**
```json
{
  "googleToken": "<google-id-token-jwt>"
}
```

### `GET /auth/me`
Retrieves authenticated user profile.
- **Headers:** `Authorization: Bearer <jwt-token>`

---

## 3. Conversational AI & RAG

### `POST /llama-chat` / `POST /api/llama-chat`
Synchronous age-adaptive grounded conversational inference.

**Request Body:**
```json
{
  "prompt": "How can I help protect the river dolphins?",
  "ageGroup": "kid",
  "name": "Arjun",
  "lang": "en"
}
```

**Response (200 OK):**
```json
{
  "result": "Hello Arjun! The Ganges river dolphin is our national aquatic animal...",
  "response": "Hello Arjun! The Ganges river dolphin is our national aquatic animal...",
  "retrieved_count": 3,
  "sources": [
    "Excerpt from NMCG Biodiversity Conservation Plan..."
  ],
  "age_group": "kid",
  "is_hindi": false
}
```

### `POST /llama-chat-stream` / `POST /api/llama-chat-stream`
NDJSON streaming endpoint for typewriter token delivery.
- **Content-Type:** `application/x-ndjson`

**Sample Output Stream:**
```ndjson
{"delta": "Namaste ", "token": "Namaste "}
{"delta": "my friend! ", "token": "my friend! "}
{"done": true, "retrieved_count": 3, "age_group": "teen"}
```

---

## 4. Speech & Audio Synthesis

### `GET /voices` / `GET /api/voices`
Lists all available local and remote synthesis voices.

**Response (200 OK):**
```json
{
  "count": 3,
  "voices": [
    {"id": "hi_IN-rohan-medium", "shortName": "hi_IN-rohan-medium", "locale": "hi-IN"},
    {"id": "en_US-kusal-medium", "shortName": "en_US-kusal-medium", "locale": "en-IN"}
  ]
}
```

### `POST /tts` / `POST /api/tts`
Synthesizes speech audio from provided text.

**Request Body:**
```json
{
  "text": "गंगा नदी को स्वच्छ रखना हम सबका कर्तव्य है।",
  "lang": "hi-IN",
  "voice": "hi_IN-rohan-medium",
  "rate": 1.0
}
```

**Response (200 OK):** Binary audio stream (`audio/wav`).
- **Response Headers:** `X-TTS-Engine: piper`

---

## 5. Gamification & Location

### `GET /game/progress`
Retrieves player points, badges, daily streak, and achievements.

### `POST /game/score`
Records game mission completion with server-authoritative score caps.

**Request Body:**
```json
{
  "mission": "quiz",
  "score": 30,
  "playerName": "ArjunHero"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "addedPoints": 30,
  "totalPoints": 150,
  "badges": ["seedling", "streamkeeper", "river-guardian"],
  "achievements": ["first-quiz"]
}
```

### `POST /game/daily-reward`
Claims once-per-calendar-day login bonus with streak increment.

**Response (200 OK on first claim):**
```json
{
  "success": true,
  "rewardPoints": 16,
  "streak": 2,
  "totalPoints": 166,
  "date": "2026-11-01"
}
```

**Response (409 Conflict if claimed already today):**
```json
{
  "success": false,
  "alreadyClaimed": true,
  "error": "Daily reward already claimed today. Please return tomorrow!"
}
```

### `GET /game/leaderboard`
Returns top 10 players ranked by total points.

### `POST /updateLocation`
Records player coordinates with privacy truncation (rounded to 4 decimals).

**Request Body:**
```json
{
  "latitude": 25.3176,
  "longitude": 83.0062,
  "playerName": "ArjunHero"
}
```

