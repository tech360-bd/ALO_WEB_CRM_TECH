import os
import sqlite3
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "storage", "agentos.db")

class QdrantMemory:
    def __init__(self, host="localhost", port=6333):
        self.host = host
        self.port = port

    def check_status(self) -> dict:
        # SQLite/File fallback mode active if Qdrant offline
        return {
            "online": False,
            "fallback": "SQLite & File Memory Layer Active",
            "db_path": DB_PATH
        }

    def save_memory(self, level: str, key: str, value: str):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        if level == "hot":
            cursor.execute("INSERT INTO memory_hot (id, context_key, content, created_at) VALUES (?, ?, ?, ?)",
                           (f"HOT-{datetime.now().strftime('%Y%m%d%H%M%S%f')}", key, value, datetime.now().isoformat()))
        elif level == "company":
            cursor.execute("INSERT INTO company_memory (id, key, value, updated_at) VALUES (?, ?, ?, ?)",
                           (f"COMP-{datetime.now().strftime('%Y%m%d%H%M%S%f')}", key, value, datetime.now().isoformat()))
        conn.commit()
        conn.close()

qdrant_memory = QdrantMemory()
