# TheraAssist AI — Internship / College Project Brief

**Prepared by:** Yuvraj Bharti  
**Project category:** Full-stack web application / AI-assisted workflow prototype

## 1. Problem statement

Therapy clinics often receive unstructured pre-session information over calls or forms. This can create repetitive administrative work and make it difficult for a clinician to view appointment details and key concerns before a first interaction. TheraAssist AI explores a structured digital intake workflow that gathers appointment preferences, captures a short questionnaire, and produces a readable session summary.

## 2. Proposed solution

The project provides a web interface with two perspectives:

- **Patient Intake:** guided conversation to collect identity/contact fields, preferred appointment details, a short concern summary, and ten guided responses.
- **Therapist Dashboard:** searchable history, transparent heuristic indicators, structured report preview, and PDF download.

## 3. Technical design

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts.
- **Backend:** Flask REST API with a state-machine-based conversation engine.
- **Database:** SQLite, storing session data as JSON payloads for a compact prototype.
- **Reports:** FPDF2 generated PDF summary.

## 4. Workflow

```text
Start session → name → phone → appointment date → time → timezone
→ primary concern → guided questions → completed session
→ dashboard analytics / report preview / PDF export
```

## 5. Core algorithms / logic

1. **State machine:** `ConversationStep` controls valid prompt transitions and prevents the user interface from losing its place in an intake flow.
2. **Validation:** formatted checks normalise phone numbers, dates, and times before they are stored.
3. **Keyword indicators:** selected non-diagnostic keywords are counted to create prototype dashboard signals such as sleep-health, mood-stability, and stress scores.
4. **Safety routing:** a small set of direct crisis phrases bypasses normal questionnaire continuation and provides immediate instructions to seek human emergency support.
5. **Durable persistence:** each state update serialises the session to SQLite so the session history remains available after a server restart.

## 6. Demonstration script

1. Start the Flask backend and confirm `/health` returns `status: ok`.
2. Start the Vite frontend.
3. Complete one synthetic intake using a fictional name and number.
4. Open **Therapist Dashboard** to show scores and structured report preview.
5. Open **Session History** and search by the fictional name.
6. Download the report PDF.
7. Start another test session and enter a direct crisis phrase to show the urgent-support message. Do not use personal information in the demo.

## 7. Limitations

- Keyword matching is simplistic and may miss context or create false positives.
- The prototype has no authentication, user roles, encryption, consent management, audit logging, or real appointment calendar integration.
- SQLite is useful for local demonstration but is not sufficient for multi-user healthcare deployment.
- This is not a diagnostic or emergency-care system.

## 8. Future scope

- Clinician-reviewed natural-language summarisation with guardrails
- Authentication and role-based access control
- Encrypted database fields and consent/retention workflows
- Calendar integration and appointment confirmation notifications
- Evaluation with clinicians and privacy/security review
- Containerised deployment with monitoring and audit logs

## 9. Evaluation criteria

The prototype can be evaluated on successful intake completion, data persistence after restart, report generation, UI usability, safe handling of direct crisis language, and absence of raw HTML injection in rendered messages.
