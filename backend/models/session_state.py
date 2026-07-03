"""Session models and durable SQLite-backed storage for TheraAssist AI.

The storage layer deliberately keeps the rest of the application independent from
the database implementation. Each conversation is represented as JSON in a small
SQLite table, which is appropriate for a college prototype and easy to migrate to
PostgreSQL or a managed datastore in a production deployment.
"""

from __future__ import annotations

import json
import os
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any


class ConversationStep(str, Enum):
    """Each value represents a stage in the intake conversation."""

    GREETING = "greeting"
    NAME = "name"
    PHONE = "phone"
    DATE = "date"
    TIME = "time"
    TIMEZONE = "timezone"
    ISSUE = "issue"
    QUESTIONS = "questions"
    COMPLETE = "complete"


THERAPY_QUESTIONS: list[str] = [
    "How long have you been feeling this way?",
    "Was there any specific trigger or recent event?",
    "Have you spoken to a therapist or psychologist before?",
    "Have you ever been diagnosed with anxiety, depression, or any other condition?",
    "Are you currently taking any medication?",
    "How have your moods been recently (sad, anxious, angry, numb, overwhelmed)?",
    "How has your sleep been lately?",
    "Have you noticed changes in appetite or energy?",
    "Do you often feel emotionally numb or overstimulated?",
    "How do you generally feel about yourself these days?",
]


def _utc_now() -> str:
    """Return a timezone-aware ISO timestamp in UTC."""
    return datetime.now(timezone.utc).isoformat()


def _new_session(session_id: str | None = None) -> dict[str, Any]:
    """Return a fresh, serialisable intake-session dictionary."""
    return {
        "session_id": session_id or str(uuid.uuid4()),
        "current_step": ConversationStep.GREETING,
        "patient_info": {
            "name": None,
            "phone": None,
            "appointment_date": None,
            "appointment_time": None,
            "timezone": None,
        },
        "issue_summary": None,
        "question_index": 0,
        "answers": [],
        "completed": False,
        "safety_flag": False,
        "safety_flagged_at": None,
        "conversation_log": [],  # [{role, text, timestamp}]
        "created_at": _utc_now(),
        "updated_at": _utc_now(),
    }


class SessionStore:
    """A small, thread-safe SQLite store for prototype conversation sessions.

    The store retains a memory cache for request-time updates while persisting every
    create/update operation to SQLite. This fixes the original prototype's loss of
    all session history whenever Flask restarted.
    """

    def __init__(self, db_path: str | Path | None = None) -> None:
        default_path = Path(__file__).resolve().parents[1] / "data" / "theraassist.db"
        configured_path = os.getenv("THERAASSIST_DB_PATH")
        self.db_path = Path(db_path or configured_path or default_path).expanduser().resolve()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._store: dict[str, dict[str, Any]] = {}
        self._lock = threading.RLock()
        self._initialise_database()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        return connection

    def _initialise_database(self) -> None:
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    session_id TEXT PRIMARY KEY,
                    payload TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
                "CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC)"
            )

    @staticmethod
    def _serialise(session: dict[str, Any]) -> str:
        document = dict(session)
        step = document.get("current_step", ConversationStep.GREETING)
        document["current_step"] = step.value if isinstance(step, ConversationStep) else str(step)
        return json.dumps(document, ensure_ascii=False)

    @staticmethod
    def _hydrate(payload: str) -> dict[str, Any]:
        session = json.loads(payload)
        try:
            session["current_step"] = ConversationStep(session.get("current_step", "greeting"))
        except ValueError:
            session["current_step"] = ConversationStep.GREETING
        session.setdefault("safety_flag", False)
        session.setdefault("safety_flagged_at", None)
        session.setdefault("conversation_log", [])
        session.setdefault("answers", [])
        return session

    def _persist(self, session: dict[str, Any]) -> None:
        with self._lock, self._connect() as connection:
            connection.execute(
                """
                INSERT INTO sessions (session_id, payload, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(session_id) DO UPDATE SET
                    payload = excluded.payload,
                    updated_at = excluded.updated_at
                """,
                (
                    session["session_id"],
                    self._serialise(session),
                    session["created_at"],
                    session["updated_at"],
                ),
            )

    # ---- CRUD ----------------------------------------------------------
    def create(self, session_id: str | None = None) -> dict[str, Any]:
        with self._lock:
            session = _new_session(session_id)
            self._store[session["session_id"]] = session
            self._persist(session)
            return session

    def get(self, session_id: str) -> dict[str, Any] | None:
        with self._lock:
            cached = self._store.get(session_id)
            if cached is not None:
                return cached
            with self._connect() as connection:
                row = connection.execute(
                    "SELECT payload FROM sessions WHERE session_id = ?", (session_id,)
                ).fetchone()
            if row is None:
                return None
            session = self._hydrate(row["payload"])
            self._store[session_id] = session
            return session

    def get_or_create(self, session_id: str | None = None) -> dict[str, Any]:
        if session_id:
            existing = self.get(session_id)
            if existing is not None:
                return existing
        return self.create(session_id)

    def update(self, session_id: str, **fields: Any) -> dict[str, Any]:
        with self._lock:
            session = self.get(session_id)
            if session is None:
                raise KeyError(f"Unknown session: {session_id}")
            session.update(fields)
            session["updated_at"] = _utc_now()
            self._persist(session)
            return session

    def list_all(self) -> list[dict[str, Any]]:
        with self._lock, self._connect() as connection:
            rows = connection.execute(
                "SELECT payload FROM sessions ORDER BY created_at DESC"
            ).fetchall()
        sessions = [self._hydrate(row["payload"]) for row in rows]
        with self._lock:
            self._store.update({session["session_id"]: session for session in sessions})
        return sessions

    def search_by_phone(self, phone: str) -> list[dict[str, Any]]:
        return [
            session for session in self.list_all()
            if session["patient_info"].get("phone") == phone
        ]
