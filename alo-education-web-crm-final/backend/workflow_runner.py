import os
import sqlite3
from datetime import datetime
from backend.protection_mode import protection_mode
from backend.payment_guard import payment_guard
from backend.self_improvement import self_improvement_engine
from backend.productivity_engine import productivity_engine
from backend.file_builder import file_builder
from backend.local_ai import local_ai
from backend.approval_center import approval_center

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

class WorkflowRunner:
    def __init__(self):
        pass

    def run_workflow(self, command_text: str, workflow_slug: str) -> dict:
        task_id = f"TASK-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"

        # 1. Protection Check
        prot_res = protection_mode.check_command(command_text)
        if not prot_res["allowed"] and prot_res["action"] == "BLOCKED":
            return {
                "success": False,
                "task_id": task_id,
                "workflow": workflow_slug,
                "reason": prot_res["reason"],
                "protection_mode_triggered": True
            }

        # 2. Payment Guard Check
        pay_res = payment_guard.check_api_request(command_text)

        # 3. Create Task Entry in DB
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO tasks (id, command_id, title, department, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (task_id, f"CMD-{task_id}", command_text[:100], workflow_slug, "running", datetime.now().isoformat(), None)
        )
        conn.commit()
        conn.close()

        # 4. Generate local AI response or fallback
        ai_resp = local_ai.generate(f"Execute workflow '{workflow_slug}' for directive: {command_text}")

        # 5. Build Output Files
        out_res = file_builder.build_task_outputs(task_id, workflow_slug, {"command": command_text, "ai_output": ai_resp["text"]})

        # 6. Self Improvement & Productivity Reports
        learn_rep = self_improvement_engine.create_learning_report(task_id, True, {})
        prod_rep = productivity_engine.calculate_score(task_id, 4, ai_resp["fallback_used"])

        # 7. Complete Task Entry in DB
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE tasks SET status = 'completed', completed_at = ? WHERE id = ?",
            (datetime.now().isoformat(), task_id)
        )
        conn.commit()
        conn.close()

        return {
            "success": True,
            "task_id": task_id,
            "workflow": workflow_slug,
            "local_first": True,
            "paid_api_used": False,
            "ai_output": ai_resp["text"],
            "fallback_used": ai_resp["fallback_used"],
            "files_created": out_res["files_created"],
            "learning_report": learn_rep,
            "productivity_report": prod_rep,
            "approval_required": prot_res["action"] == "REQUIRES_OWNER_APPROVAL"
        }

workflow_runner = WorkflowRunner()
