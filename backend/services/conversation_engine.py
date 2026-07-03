"""Stateful, safety-aware conversation flow for a therapy intake prototype.

This component organises an appointment and captures non-diagnostic intake notes.
It does *not* diagnose, replace a clinician, or provide emergency care.
"""

from __future__ import annotations

import random
import re
from datetime import datetime, timezone
from typing import Any

from models.session_state import ConversationStep, SessionStore, THERAPY_QUESTIONS

CLINIC_NAMES = [
    "Serenity Wellness Center",
    "MindBridge Therapy Clinic",
    "Harmony Mental Health",
    "ClearSky Counseling Group",
    "New Horizons Behavioral Health",
    "Tranquil Minds Clinic",
    "InnerPeace Therapy Associates",
    "Lighthouse Counseling Center",
]

# Direct phrases only: the goal is to route obvious crisis language to immediate
# human support, not to infer a diagnosis from normal conversational language.
_URGENT_SAFETY_PATTERNS = (
    r"\b(?:want|wanna|going|plan(?:ning)?)\s+to\s+(?:kill|hurt)\s+myself\b",
    r"\b(?:kill|hurt)\s+myself\b",
    r"\b(?:suicidal|suicide)\b",
    r"\b(?:end|take)\s+my\s+life\b",
    r"\b(?:self[-\s]?harm|cut(?:ting)?\s+myself)\b",
)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _validate_phone(text: str) -> str | None:
    digits = re.sub(r"[^0-9]", "", text)
    return digits if 7 <= len(digits) <= 15 else None


def _validate_date(text: str) -> str | None:
    clean = text.strip()
    for fmt in (
        "%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y",
        "%B %d %Y", "%b %d %Y", "%d %B %Y", "%d %b %Y",
    ):
        try:
            return datetime.strptime(clean.replace(",", ""), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def _validate_time(text: str) -> str | None:
    clean = text.strip().upper()
    for fmt in ("%I:%M %p", "%I:%M%p", "%H:%M", "%I %p", "%I%p"):
        try:
            return datetime.strptime(clean, fmt).strftime("%I:%M %p")
        except ValueError:
            continue
    return None


def _has_urgent_safety_language(text: str) -> bool:
    return any(re.search(pattern, text, flags=re.IGNORECASE) for pattern in _URGENT_SAFETY_PATTERNS)


def _urgent_safety_response() -> str:
    return (
        "I'm really sorry you're going through this. **TheraAssist AI is not an emergency service**.\n\n"
        "If you may act on these thoughts or are in immediate danger, please contact your local emergency "
        "number, go to the nearest emergency department, or ask a trusted person to stay with you now. "
        "In the US and Canada, call or text **988** for crisis support.\n\n"
        "You deserve immediate, human support. When you are safe, you may return to continue the intake."
    )


class ConversationEngine:
    """Process a single patient message and return the next intake response."""

    def __init__(self, store: SessionStore) -> None:
        self.store = store

    @staticmethod
    def _log(session: dict[str, Any], role: str, text: str) -> None:
        session["conversation_log"].append({
            "role": role,
            "text": text,
            "timestamp": _utc_now(),
        })

    def start_session(self, session_id: str | None = None) -> tuple[str, dict[str, Any]]:
        """Create a new session and return its first guided prompt."""
        session = self.store.get_or_create(session_id)
        clinic = random.choice(CLINIC_NAMES)
        session["clinic_name"] = clinic

        greeting = (
            f"Hello! This is TheraAssist AI from {clinic}. "
            "I can help organise a therapy appointment and collect a short intake summary. "
            "This prototype does not provide diagnosis or emergency support.\n\n"
            "Let's start with your details. Could you please tell me your **full name**?"
        )
        session["current_step"] = ConversationStep.NAME
        self._log(session, "ai", greeting)
        self.store.update(session["session_id"])
        return greeting, session

    def process_message(self, session_id: str, user_message: str) -> dict[str, Any]:
        """Advance the state machine by one message."""
        session = self.store.get(session_id)
        if session is None:
            greeting, session = self.start_session(session_id)
            return {
                "session_id": session["session_id"],
                "response": greeting,
                "step": session["current_step"],
                "completed": False,
                "safety_alert": False,
            }

        self._log(session, "user", user_message)

        if _has_urgent_safety_language(user_message):
            session["safety_flag"] = True
            session["safety_flagged_at"] = _utc_now()
            response = _urgent_safety_response()
            self._log(session, "ai", response)
            self.store.update(session_id)
            return {
                "session_id": session["session_id"],
                "response": response,
                "step": session["current_step"],
                "completed": session["completed"],
                "safety_alert": True,
            }

        step = session["current_step"]
        handler = {
            ConversationStep.GREETING: self._handle_greeting,
            ConversationStep.NAME: self._handle_name,
            ConversationStep.PHONE: self._handle_phone,
            ConversationStep.DATE: self._handle_date,
            ConversationStep.TIME: self._handle_time,
            ConversationStep.TIMEZONE: self._handle_timezone,
            ConversationStep.ISSUE: self._handle_issue,
            ConversationStep.QUESTIONS: self._handle_question,
            ConversationStep.COMPLETE: self._handle_complete,
        }.get(step, self._handle_complete)

        response = handler(session, user_message)
        self._log(session, "ai", response)
        self.store.update(session_id)

        result: dict[str, Any] = {
            "session_id": session["session_id"],
            "response": response,
            "step": session["current_step"],
            "completed": session["completed"],
            "safety_alert": False,
        }
        if session["current_step"] == ConversationStep.QUESTIONS:
            result["question_index"] = session["question_index"]
            result["total_questions"] = len(THERAPY_QUESTIONS)
        return result

    def _handle_greeting(self, session: dict[str, Any], _: str) -> str:
        greeting, _session = self.start_session(session["session_id"])
        return greeting

    @staticmethod
    def _handle_name(session: dict[str, Any], msg: str) -> str:
        name = msg.strip()
        if len(name) < 2:
            return "I didn't catch that. Could you please provide your full name?"
        session["patient_info"]["name"] = name
        session["current_step"] = ConversationStep.PHONE
        return (
            f"Thank you, **{name}**!\n\n"
            "Could you please provide your **phone number** so the clinic can reach you if needed?"
        )

    @staticmethod
    def _handle_phone(session: dict[str, Any], msg: str) -> str:
        phone = _validate_phone(msg)
        if not phone:
            return "That doesn't look like a valid phone number. Please enter 7–15 digits."
        session["patient_info"]["phone"] = phone
        session["current_step"] = ConversationStep.DATE
        return (
            "Great, noted.\n\nWhat **date** would you prefer for your appointment? "
            "Use a format such as **2026-04-10** or **10/04/2026**."
        )

    @staticmethod
    def _handle_date(session: dict[str, Any], msg: str) -> str:
        appointment_date = _validate_date(msg)
        if not appointment_date:
            return "I couldn't understand that date. Please use YYYY-MM-DD, DD/MM/YYYY, or Month Day Year."
        session["patient_info"]["appointment_date"] = appointment_date
        session["current_step"] = ConversationStep.TIME
        return f"Appointment date noted: **{appointment_date}**\n\nWhat **time** works best? (for example, 10:00 AM or 14:30)"

    @staticmethod
    def _handle_time(session: dict[str, Any], msg: str) -> str:
        appointment_time = _validate_time(msg)
        if not appointment_time:
            return "I couldn't parse that time. Please use a format like 10:00 AM or 14:30."
        session["patient_info"]["appointment_time"] = appointment_time
        session["current_step"] = ConversationStep.TIMEZONE
        return f"Time set: **{appointment_time}**\n\nWhat is your **time zone**? (for example, IST or UTC+5:30)"

    @staticmethod
    def _handle_timezone(session: dict[str, Any], msg: str) -> str:
        timezone_name = msg.strip()
        if len(timezone_name) < 2:
            return "Please provide a valid time zone, such as IST or UTC+5:30."
        session["patient_info"]["timezone"] = timezone_name
        session["current_step"] = ConversationStep.ISSUE
        return (
            "Your appointment details are saved.\n\nBefore the session, could you **briefly describe "
            "what has been bothering you recently**? This helps the therapist prepare."
        )

    @staticmethod
    def _handle_issue(session: dict[str, Any], msg: str) -> str:
        if len(msg.strip()) < 3:
            return "Could you share a bit more? Even one short sentence helps the therapist prepare."
        session["issue_summary"] = msg.strip()
        session["current_step"] = ConversationStep.QUESTIONS
        session["question_index"] = 0
        return (
            "Thank you for sharing. I understand this can be difficult.\n\n"
            "I'll ask a few guided questions to help the therapist understand your situation better. "
            "Take your time.\n\n"
            f"**Question 1 of {len(THERAPY_QUESTIONS)}:**\n{THERAPY_QUESTIONS[0]}"
        )

    @staticmethod
    def _handle_question(session: dict[str, Any], msg: str) -> str:
        if not msg.strip():
            idx = session["question_index"]
            return f"Please share your thoughts on this question:\n\n{THERAPY_QUESTIONS[idx]}"

        session["answers"].append({
            "question": THERAPY_QUESTIONS[session["question_index"]],
            "answer": msg.strip(),
        })
        session["question_index"] += 1

        if session["question_index"] >= len(THERAPY_QUESTIONS):
            session["current_step"] = ConversationStep.COMPLETE
            session["completed"] = True
            name = session["patient_info"].get("name", "there")
            return (
                f"Thank you, **{name}**. You've completed the intake assessment.\n\n"
                "A therapist can review your responses before the session. Here is your appointment summary:\n\n"
                f"**Date:** {session['patient_info']['appointment_date']}\n"
                f"**Time:** {session['patient_info']['appointment_time']}\n"
                f"**Time zone:** {session['patient_info']['timezone']}\n\n"
                "Please contact the clinic directly if you need to reschedule."
            )

        idx = session["question_index"]
        return f"**Question {idx + 1} of {len(THERAPY_QUESTIONS)}:**\n{THERAPY_QUESTIONS[idx]}"

    @staticmethod
    def _handle_complete(_: dict[str, Any], __: str) -> str:
        return (
            "Your intake is already complete. Your therapist can review the report. "
            "To begin another intake, choose **New Session**."
        )
