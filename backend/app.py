"""Flask API for the TheraAssist AI intake prototype."""

from __future__ import annotations

import io

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS

from models.session_state import SessionStore
from services.analytics_service import AnalyticsService
from services.conversation_engine import ConversationEngine
from services.pdf_service import PDFService
from services.report_service import ReportService

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
CORS(app, resources={r"/*": {"origins": "*"}})

store = SessionStore()
engine = ConversationEngine(store)
analytics_svc = AnalyticsService(store)
report_svc = ReportService(store, analytics_svc)
pdf_svc = PDFService(store, report_svc)


@app.get("/health")
def health() -> tuple[object, int]:
    """Lightweight deployment/readiness probe."""
    return jsonify({"status": "ok", "service": "theraassist-api", "storage": "sqlite"}), 200


@app.post("/chat")
def chat() -> tuple[object, int] | object:
    """Start or advance a patient intake session."""
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()
    session_id = data.get("session_id")

    if not session_id:
        greeting, session = engine.start_session()
        return jsonify({
            "session_id": session["session_id"],
            "response": greeting,
            "step": session["current_step"],
            "completed": False,
            "safety_alert": False,
        })

    if not isinstance(session_id, str) or not session_id.strip():
        return jsonify({"error": "session_id must be a non-empty string"}), 400
    if not message:
        return jsonify({"error": "message is required"}), 400

    return jsonify(engine.process_message(session_id, message))


@app.post("/generate-report")
def generate_report() -> tuple[object, int] | object:
    data = request.get_json(silent=True) or {}
    session_id = data.get("session_id")
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    report = report_svc.generate(session_id)
    if not report:
        return jsonify({"error": "Session not found or contains no intake answers"}), 404
    return jsonify(report)


@app.get("/sessions")
def list_sessions() -> object:
    summaries = [
        {
            "session_id": session["session_id"],
            "patient_name": session["patient_info"].get("name", "Unknown"),
            "phone": session["patient_info"].get("phone"),
            "appointment_date": session["patient_info"].get("appointment_date"),
            "appointment_time": session["patient_info"].get("appointment_time"),
            "completed": session["completed"],
            "current_step": session["current_step"],
            "safety_flag": bool(session.get("safety_flag")),
            "created_at": session["created_at"],
            "updated_at": session["updated_at"],
        }
        for session in store.list_all()
    ]
    return jsonify(summaries)


@app.get("/session/<session_id>")
def get_session(session_id: str) -> tuple[object, int] | object:
    session = store.get(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    analytics = analytics_svc.compute(session_id) if session["completed"] else None
    return jsonify({**session, "analytics": analytics})


@app.get("/download-report/<session_id>")
def download_report(session_id: str) -> tuple[object, int] | object:
    pdf_bytes = pdf_svc.generate(session_id)
    if not pdf_bytes:
        return jsonify({"error": "Cannot generate a report for this session"}), 404

    name = store.get(session_id)["patient_info"].get("name", "patient")
    filename = f"TheraAssist_Report_{name.replace(' ', '_')}.pdf"
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype="application/pdf",
        as_attachment=True,
        download_name=filename,
    )


if __name__ == "__main__":
    print("\nTheraAssist AI API running on http://localhost:5000\n")
    app.run(host="0.0.0.0", port=5000, debug=True)
