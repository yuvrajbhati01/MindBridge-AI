# Documented enhancement log — Yuvraj Bharti

This file records the changes added while adapting the supplied starter project into a reviewable academic prototype.

## Engineering enhancements

1. **Durable storage:** Replaced the original in-memory-only session store with a SQLite-backed `SessionStore`. Sessions now survive Flask restarts and can be retrieved by the dashboard/history views.
2. **Safety-aware intake:** Added direct crisis-language pattern detection and an urgent-support response. It does not claim to diagnose or make a clinical risk determination.
3. **API readiness:** Added a `GET /health` endpoint and safer JSON/request validation.
4. **Security improvement:** Removed `dangerouslySetInnerHTML` usage for chat and history messages. Minimal `**bold**` formatting is rendered as React nodes, avoiding raw user HTML injection.
5. **Reliability:** Added smoke tests for health status, state persistence, and urgent-safety response behavior.
6. **Report resilience:** Made PDF output safer for non-Latin user text and added a prototype limitation note to generated report JSON.
7. **Project packaging:** Added root documentation, architecture notes, security constraints, backend `.gitignore`, data directory hygiene, and development test dependencies.

## Your viva / internship explanation

Be ready to explain, demonstrate, and defend each item above:

- Why in-memory data disappears on restart and why SQLite helps a prototype.
- How state-machine transitions work from `NAME` to `COMPLETE`.
- Why raw `dangerouslySetInnerHTML` can cause XSS.
- Why keyword analytics are not a diagnosis or clinical risk assessment.
- Why a crisis phrase must receive an immediate human-support message.
- What a production system would add: authentication, encryption, audit logs, consent, access roles, secure backups, and clinician-reviewed protocols.
