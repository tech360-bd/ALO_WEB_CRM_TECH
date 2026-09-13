import os
import sqlite3
from datetime import datetime
from backend.approval_center import approval_center

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

class AutoDomainDeploy:
    def __init__(self):
        pass

    def deploy_domain(self, domain: str, project_folder: str, stack: str = "auto_detect") -> dict:
        dep_id = f"DEP-{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        folder_path = f"/www/wwwroot/{domain}"

        # Create approval item as required by Owner Safety Rules
        app_item = approval_center.create_request(
            task_id=dep_id,
            request_type="DOMAIN_DEPLOYMENT",
            title=f"Request to deploy domain: {domain}",
            description=f"Stack: {stack}. Target Folder: {folder_path}"
        )

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO domain_deployments (id, domain, stack, status, folder_path, ssl_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (dep_id, domain, stack, "pending_owner_approval", folder_path, 0, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()

        return {
            "deployment_id": dep_id,
            "domain": domain,
            "target_folder": folder_path,
            "status": "pending_owner_approval",
            "approval_required": True,
            "approval_item": app_item
        }

auto_domain_deploy = AutoDomainDeploy()
