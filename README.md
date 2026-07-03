# TheraAssist AI

> **Academic full-stack prototype for structured therapy-intake conversations and clinician-oriented summary reports.**

**Project adaptation and documented enhancements:** Yuvraj Bharti  
**Stack:** React + TypeScript + Vite + Tailwind CSS • Python + Flask • SQLite • FPDF2

TheraAssist AI guides a user through appointment details and a short, non-diagnostic intake questionnaire. It then provides a clinician-style dashboard, transparent keyword-based prototype indicators, session history, and a downloadable PDF intake summary.

## Important scope and safety notice

This is an **academic prototype**, not a medical device or therapy service. It does not diagnose conditions, assess clinical risk, replace a licensed mental-health professional, or provide emergency support. Direct crisis language triggers a clear urgent-support message, but a real deployment would require clinically reviewed protocols, local crisis routing, access control, encryption, consent flows, and professional oversight.

## What is included

- Guided appointment scheduling and 10-question intake workflow
- Persistent session storage in SQLite (survives backend restarts)
- Crisis-language safety flag with immediate escalation messaging
- Therapist dashboard with transparent heuristic indicators
- Searchable session history and downloadable PDF reports
- XSS-safe chat-message rendering (no raw user HTML injection)
- `/health` endpoint for local/deployment checks
- Smoke tests for API health, persistence, and safety flow

## Run locally

### 1) Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements-dev.txt
python app.py
```

The API starts at `http://localhost:5000`. Verify it at `http://localhost:5000/health`.

### 2) Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL, normally `http://localhost:5173`.

### 3) Tests

```bash
cd backend
pytest -q
```

## Architecture

```text
React UI → Vite proxy (/api) → Flask REST API
                               ├── ConversationEngine (state machine + safety routing)
                               ├── SessionStore (SQLite persistence)
                               ├── AnalyticsService (transparent heuristic indicators)
                               ├── ReportService (structured summary)
                               └── PDFService (downloadable report)
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`COLLEGE_SUBMISSION.md`](COLLEGE_SUBMISSION.md) for project explanation, data flow, limitations, demo steps, and evaluation notes.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Service and persistence probe |
| `POST` | `/chat` | Start or advance an intake session |
| `GET` | `/sessions` | List session summaries |
| `GET` | `/session/<session_id>` | Read a full session and analytics |
| `POST` | `/generate-report` | Generate structured report JSON |
| `GET` | `/download-report/<session_id>` | Download a PDF summary |

## Submission transparency / attribution

This repository was prepared as an **adapted and enhanced academic project**, not as a claim that every line originated with Yuvraj Bharti. The supplied starter code did not include a verifiable source URL or license. Before public release or college submission, replace the placeholder in [`NOTICE.md`](NOTICE.md) with the actual upstream author/repository URL and follow its license. The changes implemented for this submission are listed in [`CONTRIBUTIONS.md`](CONTRIBUTIONS.md).

## Repository hygiene

- Do not commit `backend/data/*.db`, `.venv/`, `node_modules/`, or personal test data.
- Use only synthetic data in screenshots, demos, and reports.
- No patient data should be deployed without consent, authenticated access, encryption, retention limits, and clinical review.
