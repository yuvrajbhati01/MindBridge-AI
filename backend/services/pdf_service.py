"""
pdf_service.py — Generate polished PDF clinical intake summaries using fpdf2.
"""

from __future__ import annotations
import io
from typing import Any

from fpdf import FPDF

from models.session_state import SessionStore
from services.report_service import ReportService


def _pdf_safe(text: object) -> str:
    """Convert arbitrary user text to a Helvetica-compatible PDF string."""
    return str(text).encode("latin-1", "replace").decode("latin-1")


class _TheraAssistPDF(FPDF):
    """Custom PDF with header/footer branding."""

    def header(self):
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(90, 60, 180)
        self.cell(0, 10, "TheraAssist AI", align="C", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(120, 120, 120)
        self.cell(0, 5, "Clinical Intake Summary", align="C", new_x="LMARGIN", new_y="NEXT")
        self.line(10, self.get_y() + 2, 200, self.get_y() + 2)
        self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(160, 160, 160)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}  |  Confidential - For licensed therapist use only",
                  align="C")

    def section_title(self, title: str):
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(70, 40, 150)
        self.cell(0, 8, _pdf_safe(title), new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(200, 200, 220)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def body_text(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5.5, _pdf_safe(text), new_x="LMARGIN", new_y="NEXT")
        self.ln(2)

    def bullet(self, text: str):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.cell(5)
        self.cell(5, 5.5, "-")
        self.multi_cell(0, 5.5, _pdf_safe(text), new_x="LMARGIN", new_y="NEXT")

    def kv(self, key: str, value: str):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(70, 70, 70)
        self.cell(45, 6, f"{key}:")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(50, 50, 50)
        self.cell(0, 6, _pdf_safe(value), new_x="LMARGIN", new_y="NEXT")


class PDFService:
    """Generate PDF reports for completed sessions."""

    def __init__(self, store: SessionStore, report_service: ReportService) -> None:
        self.store = store
        self.report_service = report_service

    def generate(self, session_id: str) -> bytes | None:
        report = self.report_service.generate(session_id)
        if not report:
            return None

        pdf = _TheraAssistPDF()
        pdf.alias_nb_pages()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=20)

        # 1. Patient Details
        pdf.section_title("1. Patient Details")
        pdf.kv("Name", report["patient_info"]["name"])
        pdf.kv("Phone", report["patient_info"]["phone"])
        pdf.ln(3)

        # 2. Appointment
        pdf.section_title("2. Appointment")
        pdf.kv("Date", report["appointment"]["date"])
        pdf.kv("Time", report["appointment"]["time"])
        pdf.kv("Timezone", report["appointment"]["timezone"])
        pdf.ln(3)

        # 3. Intake Summary
        pdf.section_title("3. Primary Concern")
        pdf.body_text(report["primary_concern"])

        # 4. Question Responses
        pdf.section_title("4. Question Responses")
        for i, qa in enumerate(report["question_responses"], 1):
            pdf.set_font("Helvetica", "B", 10)
            pdf.set_text_color(70, 40, 150)
            pdf.multi_cell(0, 5.5, _pdf_safe(f"Q{i}: {qa['question']}"), new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 10)
            pdf.set_text_color(50, 50, 50)
            pdf.multi_cell(0, 5.5, _pdf_safe(f"A: {qa['answer']}"), new_x="LMARGIN", new_y="NEXT")
            pdf.ln(2)

        # 5. Emotional Patterns
        pdf.section_title("5. Emotional Pattern Indicators")
        for p in report["emotional_patterns"]:
            pdf.bullet(p)
        pdf.ln(3)

        # 6. Therapy / Medication History
        pdf.section_title("6. Previous Therapy & Medication")
        for t in report["therapy_medication_history"]:
            pdf.bullet(t)
        pdf.ln(3)

        # 7. Risk Flags
        pdf.section_title("7. Risk Flags")
        for r in report["risk_flags"]:
            # Strip emoji for PDF compatibility
            clean = r.encode("ascii", "ignore").decode().strip()
            if clean:
                pdf.bullet(clean)
        pdf.ln(3)

        # 8. Suggested Therapy Direction
        pdf.section_title("8. Suggested Therapy Direction")
        for s in report["suggested_therapy_direction"]:
            pdf.bullet(s)
        pdf.ln(3)

        # 9. Session Opening Strategy
        pdf.section_title("9. Session Opening Strategy")
        for s in report["session_opening_strategy"]:
            pdf.bullet(s)
        pdf.ln(3)

        # 10. Analytics Scores
        analytics = report.get("analytics", {})
        if analytics:
            pdf.section_title("10. Analytics Scores")
            pdf.kv("Stress Score", f"{analytics.get('stress_score', 'N/A')} / 100")
            pdf.kv("Mood Stability", f"{analytics.get('mood_stability', 'N/A')} / 100")
            pdf.kv("Sleep Health", f"{analytics.get('sleep_health', 'N/A')} / 100")
            pdf.kv("Risk Level", str(analytics.get("risk_level", "N/A")))
            pdf.kv("Session Readiness", f"{analytics.get('readiness_score', 'N/A')} / 100")

        return bytes(pdf.output())
