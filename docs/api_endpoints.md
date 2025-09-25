# REST API Endpoints

Base URL: http://<host>:5000

Auth: Bearer JWT in `Authorization: Bearer <token>` for protected endpoints.

## Auth
- POST /auth/register
  - Body: { name, email, password, admin_code? }
  - 201: { name, email, is_admin, created, token }
- POST /auth/login
  - Body: { email, password }
  - 200: { name, email, is_admin, created, token }
- GET /auth/me (protected)
  - 200: { name, email, is_admin, created }

## Chats (protected)
- GET /chats/
  - 200: { chats: [ { id, user_email, title, messages, created?, updated } ] }
- POST /chats/save
  - Body: { id: string, title: string, messages: array }
  - 200: { saved: true, chat }
  - 409: Welcome Chat already exists (special title constraint)
- DELETE /chats/{id}
  - 200: { deleted: boolean }
- DELETE /chats/delete_all
  - 200: { deleted_count: number }

## Admin (protected + admin)
- GET /chats/admin/all
  - 200: { chats: [...] }
- GET /chats/admin/stats
  - 200: { per_user: [{ _id: email, count }], total }

## RAG / LLM
- POST /llama-chat
  - Headers: optional `Authorization: <base64-json>` (legacy debug)
  - Body: { prompt: string }
  - 200: { result: string, retrieved_count: number }

## Speech
- POST /tts
  - Body: { text: string }
  - 200: audio/mpeg stream (mp3)
- POST /stt
  - Body: { text: string } (echoes for now)
  - 200: { result: string }

## Error Codes
- 400 Bad Request: missing parameters
- 401 Unauthorized: no/invalid/expired token
- 403 Forbidden: admin-only access
- 409 Conflict: duplicate special chat
- 500 Internal Server Error: unhandled exceptions
