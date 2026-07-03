"""Lightweight, transparent keyword-based intake analytics.

Scores are prototype indicators only. They must never be interpreted as a clinical
diagnosis, risk assessment, or replacement for review by a qualified clinician.
"""

from __future__ import annotations

from typing import Any

from models.session_state import SessionStore

_SLEEP_BAD_KEYWORDS = [
    "bad", "poor", "terrible", "awful", "insomnia", "can't sleep", "barely",
    "restless", "tossing", "nightmares", "few hours", "disturbed", "broken",
    "trouble sleeping", "difficulty", "not well", "worse", "struggling",
]
_NUMBNESS_KEYWORDS = [
    "numb", "empty", "nothing", "detached", "disconnected", "void", "flat",
    "hollow", "blank", "don't feel", "emotionless",
]
_POOR_SELF_IMAGE_KEYWORDS = [
    "worthless", "useless", "hate myself", "ugly", "failure", "not good enough",
    "terrible", "bad person", "don't like myself", "disgusting", "ashamed", "guilty",
    "inadequate", "loser", "burden", "waste", "stupid", "pathetic", "hopeless",
]
_LONG_DURATION_KEYWORDS = [
    "years", "months", "long time", "very long", "forever", "a while",
    "since childhood", "always", "as long as", "decade",
]
_ANXIETY_KEYWORDS = [
    "anxious", "anxiety", "panic", "worry", "nervous", "fear", "dread",
    "restless", "tense", "uneasy", "overwhelmed",
]
_DEPRESSION_KEYWORDS = [
    "depressed", "depression", "sad", "hopeless", "crying", "tears", "low",
    "down", "unmotivated", "exhausted", "tired",
]
_OVERSTIMULATED_KEYWORDS = [
    "overstimulated", "overwhelmed", "too much", "sensory", "can't cope",
    "burning out", "burnout", "overload",
]
_APPETITE_CHANGE_KEYWORDS = [
    "no appetite", "not eating", "overeating", "binge", "weight gain", "weight loss",
    "lost appetite", "skip meals", "can't eat", "eating too much", "no energy",
    "exhausted", "fatigue", "drained", "lethargic",
]
_MOOD_KEYWORDS_MAP = {"sad": 15, "anxious": 15, "angry": 10, "numb": 20, "overwhelmed": 15}


def _scan(text: str, keywords: list[str]) -> int:
    lower = text.lower()
    return sum(1 for keyword in keywords if keyword in lower)


class AnalyticsService:
    """Compute transparent prototype indicators from free-text answers."""

    def __init__(self, store: SessionStore) -> None:
        self.store = store

    def compute(self, session_id: str) -> dict[str, Any] | None:
        session = self.store.get(session_id)
        if not session or not session["answers"]:
            return None

        answers_text = " ".join(answer["answer"] for answer in session["answers"])
        full_text = f"{session.get('issue_summary', '') or ''} {answers_text}"

        stress = 20
        if _scan(full_text, _SLEEP_BAD_KEYWORDS):
            stress += 20
        if _scan(full_text, _NUMBNESS_KEYWORDS):
            stress += 15
        if _scan(full_text, _POOR_SELF_IMAGE_KEYWORDS):
            stress += 20
        if _scan(full_text, _LONG_DURATION_KEYWORDS):
            stress += 15
        if _scan(full_text, _OVERSTIMULATED_KEYWORDS):
            stress += 10
        stress = min(stress, 100)

        mood_hits = sum(points for word, points in _MOOD_KEYWORDS_MAP.items() if word in full_text.lower())
        mood_stability = max(0, 100 - mood_hits - (_scan(full_text, _ANXIETY_KEYWORDS) * 5))
        sleep_health = max(0, 100 - _scan(full_text, _SLEEP_BAD_KEYWORDS) * 20)

        risk_score = (
            _scan(full_text, _NUMBNESS_KEYWORDS) * 15
            + _scan(full_text, _POOR_SELF_IMAGE_KEYWORDS) * 12
            + _scan(full_text, _DEPRESSION_KEYWORDS) * 10
        )
        safety_flag = bool(session.get("safety_flag"))
        if safety_flag:
            risk_score = 100
        risk_score = min(risk_score, 100)
        risk_level = "High" if risk_score >= 60 else "Moderate" if risk_score >= 30 else "Low"

        readiness = max(0, min(100, 100 - int(stress * 0.3) - int(risk_score * 0.3) + int(mood_stability * 0.4)))
        mood_breakdown = [
            {"mood": mood.capitalize(), "score": min(100, _scan(full_text, [mood]) * points + 10)}
            for mood, points in _MOOD_KEYWORDS_MAP.items()
        ]

        return {
            "session_id": session_id,
            "stress_score": stress,
            "mood_stability": mood_stability,
            "sleep_health": sleep_health,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "readiness_score": readiness,
            "mood_breakdown": mood_breakdown,
            "appetite_energy_flag": _scan(full_text, _APPETITE_CHANGE_KEYWORDS) > 0,
            "chronicity": _scan(full_text, _LONG_DURATION_KEYWORDS) > 0,
            "safety_flag": safety_flag,
            "disclaimer": "Prototype keyword indicators only; clinician review is required.",
        }
