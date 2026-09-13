import os
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

PAID_APIS = [
    "openai", "anthropic", "gemini_paid", "heygen", "elevenlabs",
    "runway", "midjourney", "canva_paid", "suno_paid", "semrush",
    "ahrefs", "zapier", "hubspot", "bolt_paid", "lovable_paid"
]

class PaymentGuard:
    def __init__(self):
        self.enabled = True
        self.paid_api_allowed = False

    def check_api_request(self, api_name: str) -> dict:
        api_lower = api_name.lower()
        for paid_api in PAID_APIS:
            if paid_api in api_lower:
                self.log_payment_blocked(api_name, True, f"Local replacement active for {api_name}")
                return {
                    "paid_api_used": False,
                    "blocked": True,
                    "approval_required": True,
                    "replacement_used": True,
                    "reason": f"Payment Guard blocked paid API {api_name}. Used local open-source replacement workflow."
                }

        return {
            "paid_api_used": False,
            "blocked": False,
            "approval_required": False,
            "replacement_used": False,
            "reason": "Free/Local component approved."
        }

    def log_payment_blocked(self, api_name: str, blocked: bool, fallback: str):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO payment_guard_logs (id, requested_api, blocked, fallback_used, timestamp) VALUES (?, ?, ?, ?, ?)",
            (f"PAY-{datetime.now().strftime('%Y%m%d%H%M%S%f')}", api_name, 1 if blocked else 0, fallback, datetime.now().isoformat())
        )
        conn.commit()
        conn.close()

payment_guard = PaymentGuard()
