"""Smoke tests for the most important API and persistence flows."""

from __future__ import annotations

from pathlib import Path

import app as app_module
from models.session_state import SessionStore
from services.analytics_service import AnalyticsService
from services.conversation_engine import ConversationEngine
from services.pdf_service import PDFService
from services.report_service import ReportService


def configure_test_store(tmp_path: Path) -> None:
    test_store = SessionStore(tmp_path / "test_sessions.db")
    app_module.store = test_store
    app_module.engine = ConversationEngine(test_store)
    app_module.analytics_svc = AnalyticsService(test_store)
    app_module.report_svc = ReportService(test_store, app_module.analytics_svc)
    app_module.pdf_svc = PDFService(test_store, app_module.report_svc)
    app_module.app.config.update(TESTING=True)


def test_health_endpoint(tmp_path: Path) -> None:
    configure_test_store(tmp_path)
    client = app_module.app.test_client()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"


def test_session_persists_and_advances(tmp_path: Path) -> None:
    configure_test_store(tmp_path)
    client = app_module.app.test_client()

    start = client.post("/chat", json={"message": ""})
    assert start.status_code == 200
    session_id = start.get_json()["session_id"]

    for message in ("Yuvraj Bharti", "9876543210", "2026-08-10", "10:30 AM", "IST"):
        response = client.post("/chat", json={"session_id": session_id, "message": message})
        assert response.status_code == 200

    persisted = SessionStore(tmp_path / "test_sessions.db").get(session_id)
    assert persisted is not None
    assert persisted["patient_info"]["name"] == "Yuvraj Bharti"
    assert persisted["current_step"].value == "issue"


def test_urgent_safety_language_returns_alert(tmp_path: Path) -> None:
    configure_test_store(tmp_path)
    client = app_module.app.test_client()
    session_id = client.post("/chat", json={"message": ""}).get_json()["session_id"]

    response = client.post(
        "/chat", json={"session_id": session_id, "message": "I want to hurt myself"}
    )
    payload = response.get_json()
    assert response.status_code == 200
    assert payload["safety_alert"] is True
    assert "not an emergency service" in payload["response"]
