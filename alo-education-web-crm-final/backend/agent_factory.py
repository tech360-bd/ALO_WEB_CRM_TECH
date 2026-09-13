import os
import sqlite3
from datetime import datetime
from backend.approval_center import approval_center

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

class AgentFactory:
    def __init__(self):
        pass

    def request_new_agent(self, name: str, department: str, purpose: str) -> dict:
        req_id = f"AGREQ-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO agent_build_requests (id, name, department, purpose, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (req_id, name, department, purpose, "pending_owner_approval", datetime.now().isoformat())
        )
        conn.commit()
        conn.close()

        app_item = approval_center.create_request(
            task_id=req_id,
            request_type="NEW_AGENT_FACTORY_BUILD",
            title=f"Request to create new Agent: {name}",
            description=f"Department: {department}. Purpose: {purpose}"
        )

        return {
            "request_id": req_id,
            "status": "pending_owner_approval",
            "approval_item": app_item
        }

agent_factory = AgentFactory()
