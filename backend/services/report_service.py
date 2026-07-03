"""
report_service.py — Generate structured therapist-ready reports.
"""

from __future__ import annotations
from typing import Any

from models.session_state import SessionStore
from services.analytics_service import AnalyticsService


class ReportService:
    """Build a structured report dict from a completed session."""

    def __init__(self, store: SessionStore, analytics: AnalyticsService) -> None:
        self.store = store
        self.analytics = analytics

    def generate(self, session_id: str) -> dict[str, Any] | None:
        session = self.store.get(session_id)
        if not session:
            return None

        analytics = self.analytics.compute(session_id) or {}
        info = session["patient_info"]
        answers = session.get("answers", [])
        full_text = f"{session.get('issue_summary', '')} " + " ".join(
            a["answer"] for a in answers
        )
        lower = full_text.lower()

        # ---- Section builders ----
        patient_info = {
            "name": info.get("name", "N/A"),
            "phone": info.get("phone", "N/A"),
        }

        appointment = {
            "date": info.get("appointment_date", "N/A"),
            "time": info.get("appointment_time", "N/A"),
            "timezone": info.get("timezone", "N/A"),
        }

        primary_concern = session.get("issue_summary", "Not provided")

        # Emotional pattern indicators
        patterns = []
        if "anxious" in lower or "anxiety" in lower:
            patterns.append("Anxiety indicators present")
        if "sad" in lower or "depressed" in lower or "depression" in lower:
            patterns.append("Depressive indicators present")
        if "angry" in lower or "anger" in lower:
            patterns.append("Anger/irritability noted")
        if "numb" in lower or "empty" in lower:
            patterns.append("Emotional numbness reported")
        if "overwhelmed" in lower:
            patterns.append("Feeling overwhelmed")
        if not patterns:
            patterns.append("No strong emotional pattern detected from intake")

        # Previous therapy / medication
        therapy_history: list[str] = []
        for a in answers:
            q = a["question"].lower()
            if "therapist" in q or "psychologist" in q:
                therapy_history.append(f"Previous therapy: {a['answer']}")
            if "diagnosed" in q:
                therapy_history.append(f"Diagnoses: {a['answer']}")
            if "medication" in q:
                therapy_history.append(f"Medication: {a['answer']}")
        if not therapy_history:
            therapy_history.append("No previous therapy or medication information provided")

        # Risk flags
        risk_flags: list[str] = []
        if session.get("safety_flag"):
            risk_flags.append("URGENT: direct safety language detected — clinician review required")
        if analytics.get("sleep_health", 100) < 60:
            risk_flags.append("⚠️ Poor sleep quality reported")
        if analytics.get("risk_level") == "High":
            risk_flags.append("🔴 High emotional risk level")
        if "numb" in lower:
            risk_flags.append("⚠️ Emotional numbness flagged")
        if any(kw in lower for kw in ["worthless", "hate myself", "useless", "failure", "hopeless"]):
            risk_flags.append("🔴 Poor self-perception indicators")
        if analytics.get("appetite_energy_flag"):
            risk_flags.append("⚠️ Appetite or energy changes noted")
        if analytics.get("chronicity"):
            risk_flags.append("⚠️ Chronic / long-duration concern")
        if not risk_flags:
            risk_flags.append("✅ No major risk flags identified")

        # Suggested therapy direction
        suggestions: list[str] = []
        if "anxious" in lower or "anxiety" in lower:
            suggestions.append("Explore cognitive-behavioral techniques for anxiety management")
        if "sad" in lower or "depressed" in lower:
            suggestions.append("Consider behavioral activation strategies")
        if "numb" in lower:
            suggestions.append("Assess dissociative tendencies; grounding exercises recommended")
        if analytics.get("sleep_health", 100) < 60:
            suggestions.append("Focus on sleep hygiene psychoeducation")
        if any(kw in lower for kw in ["worthless", "hate myself", "failure"]):
            suggestions.append("Cognitive reframing for self-perception")
        if "trigger" in lower or "event" in lower:
            suggestions.append("Explore recent trigger events in depth")
        if not suggestions:
            suggestions.append("General supportive counseling and rapport building")

        # Session opening strategy
        opening_strategies = [
            "Start with emotional validation and active listening",
        ]
        if risk_flags and "🔴" in " ".join(risk_flags):
            opening_strategies.append("Address high-risk indicators early with care")
        if "trigger" in lower:
            opening_strategies.append("Explore the triggering event to build narrative")
        opening_strategies.append("Establish therapeutic goals collaboratively")
        opening_strategies.append("Assess motivation and readiness for change")

        return {
            "session_id": session_id,
            "generated_at": session.get("updated_at"),
            "patient_info": patient_info,
            "appointment": appointment,
            "primary_concern": primary_concern,
            "emotional_patterns": patterns,
            "therapy_medication_history": therapy_history,
            "risk_flags": risk_flags,
            "suggested_therapy_direction": suggestions,
            "session_opening_strategy": opening_strategies,
            "analytics": analytics,
            "question_responses": answers,
            "limitations": "Prototype keyword indicators only; clinician review is required.",
        }
