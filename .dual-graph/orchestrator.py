# .dual-graph/orchestrator.py
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional

class WorkflowOrchestrator:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS workflows (
                session_id TEXT PRIMARY KEY,
                state TEXT NOT NULL,
                task_type TEXT,
                prompt TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        conn.commit()
        conn.close()

    def classify_task(self, prompt: str) -> Dict[str, Any]:
        # Simple keyword-based classification
        prompt_lower = prompt.lower()
        if any(kw in prompt_lower for kw in ['bug', 'fix', 'error', 'broken']):
            return {'type': 'bug', 'confidence': 0.8}
        elif any(kw in prompt_lower for kw in ['add', 'create', 'new', 'feature']):
            return {'type': 'feature', 'confidence': 0.8}
        elif any(kw in prompt_lower for kw in ['refactor', 'clean', 'improve']):
            return {'type': 'refactor', 'confidence': 0.7}
        elif any(kw in prompt_lower for kw in ['test', 'spec']):
            return {'type': 'test', 'confidence': 0.8}
        else:
            return {'type': 'unknown', 'confidence': 0.5}

    def create_workflow(self, prompt: str, cwd: str) -> str:
        import uuid
        session_id = str(uuid.uuid4())[:8]
        classification = self.classify_task(prompt)

        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            INSERT INTO workflows (session_id, state, task_type, prompt, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (session_id, 'CLASSIFYING', classification['type'], prompt,
              datetime.now().isoformat(), datetime.now().isoformat()))
        conn.commit()
        conn.close()

        return session_id

    def get_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            "SELECT state, task_type, created_at FROM workflows WHERE session_id = ?",
            (session_id,)
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return {'state': row[0], 'task_type': row[1], 'created_at': row[2]}
        return None
