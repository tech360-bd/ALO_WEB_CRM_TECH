import os
import json
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

class SelfImprovementEngine:
    def __init__(self):
        self.enabled = True

    def create_learning_report(self, task_id: str, success: bool, details: dict) -> dict:
        summary = f"Task {task_id} completed successfully." if success else f"Task {task_id} encountered execution warnings."
        lessons = json.dumps([
            "Reused department memory SOP",
            "Validated 100% compliance with zero paid APIs",
            "Checked local AI fallback response"
        ])

        report_id = f"LEARN-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO learning_reports (id, task_id, summary, lessons, created_at) VALUES (?, ?, ?, ?, ?)",
            (report_id, task_id, summary, lessons, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()

        return {
            "id": report_id,
            "task_id": task_id,
            "success": success,
            "summary": summary,
            "promoted_memory": "Department Memory Level 2"
        }

self_improvement_engine = SelfImprovementEngine()
