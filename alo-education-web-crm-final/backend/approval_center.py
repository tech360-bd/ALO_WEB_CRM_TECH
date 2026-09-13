import os
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

class ApprovalCenter:
    def __init__(self):
        pass

    def create_request(self, task_id: str, request_type: str, title: str, description: str) -> dict:
        req_id = f"APP-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO approvals (id, task_id, request_type, title, description, status, requested_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (req_id, task_id, request_type, title, description, "pending", "System/Agent", datetime.now().isoformat())
        )
        conn.commit()
        conn.close()

        return {
            "id": req_id,
            "task_id": task_id,
            "request_type": request_type,
            "title": title,
            "status": "pending"
        }

    def process_approval(self, approval_id: str, status: str, reviewer: str = "Super Admin Owner") -> dict:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE approvals SET status = ?, reviewed_by = ? WHERE id = ?",
            (status, reviewer, approval_id)
        )
        conn.commit()
        conn.close()
        return {"id": approval_id, "status": status, "reviewed_by": reviewer}

    def list_pending(self) -> list:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, task_id, request_type, title, description, created_at FROM approvals WHERE status = 'pending'")
        rows = cursor.fetchall()
        conn.close()
        return [{"id": r[0], "task_id": r[1], "request_type": r[2], "title": r[3], "description": r[4], "created_at": r[5]} for r in rows]

approval_center = ApprovalCenter()
