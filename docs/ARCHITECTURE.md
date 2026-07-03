# Architecture notes

## Component responsibilities

| Component | Responsibility |
|---|---|
| `frontend/src/pages/PatientChatPage.tsx` | Drives the conversational intake UI and displays urgent-support notice when supplied by the API. |
| `frontend/src/components/SafeMessageText.tsx` | Renders line breaks and `**bold**` markup without evaluating raw HTML. |
| `backend/services/conversation_engine.py` | State machine, input validation, session logging, and direct crisis-language routing. |
| `backend/models/session_state.py` | Session schema and thread-safe SQLite persistence. |
| `backend/services/analytics_service.py` | Transparent prototype keyword indicators. |
| `backend/services/report_service.py` | Converts stored session data into structured report JSON. |
| `backend/services/pdf_service.py` | Generates a compact PDF intake report. |

## Data lifecycle

1. Browser posts to `/api/chat`.
2. Vite's development proxy removes `/api` and forwards to Flask.
3. `ConversationEngine` loads the session, validates/records the message, determines the next step, and persists it.
4. Dashboard/history endpoints read durable sessions from SQLite.
5. A completed session can be converted into report JSON or a PDF file.

## Security boundary

The frontend intentionally treats every message as user-controlled data. `SafeMessageText` preserves a limited bold convention but never sends text to `innerHTML`. A production implementation must add authentication, authorisation, encryption, audit trails, rate limiting, consent, and professional clinical review.
