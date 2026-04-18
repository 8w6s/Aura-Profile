# .dual-graph/orchestrator.py
import json
import sqlite3
import logging
import re
import os
from datetime import datetime
from typing import Dict, Any, Optional
from contextlib import contextmanager

# Configure logging
log_dir = os.path.dirname(os.path.abspath(__file__))
log_file = os.path.join(log_dir, 'orchestrator.log')

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Add file handler
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.INFO)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))

# Add console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))

logger.addHandler(file_handler)
logger.addHandler(console_handler)

class WorkflowOrchestrator:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()
        logger.info(f"WorkflowOrchestrator initialized with db_path: {db_path}")

    @contextmanager
    def _get_connection(self):
        """Context manager for database connections to ensure proper cleanup"""
        conn = sqlite3.connect(self.db_path)
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            conn.close()

    def _init_db(self):
        with self._get_connection() as conn:
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
            logger.info("Database initialized successfully")

    def _validate_session_id(self, session_id: str) -> bool:
        """Validate session_id format (8 hex characters) to prevent SQL injection"""
        if not session_id or not isinstance(session_id, str):
            return False
        return bool(re.match(r'^[0-9a-f]{8}$', session_id))

    def classify_task(self, prompt: str) -> Dict[str, Any]:
        # Simple keyword-based classification
        logger.debug(f"Classifying task with prompt length: {len(prompt)}")
        prompt_lower = prompt.lower()
        if any(kw in prompt_lower for kw in ['bug', 'fix', 'error', 'broken']):
            result = {'type': 'bug', 'confidence': 0.8}
        elif any(kw in prompt_lower for kw in ['add', 'create', 'new', 'feature']):
            result = {'type': 'feature', 'confidence': 0.8}
        elif any(kw in prompt_lower for kw in ['refactor', 'clean', 'improve']):
            result = {'type': 'refactor', 'confidence': 0.7}
        elif any(kw in prompt_lower for kw in ['test', 'spec']):
            result = {'type': 'test', 'confidence': 0.8}
        else:
            result = {'type': 'unknown', 'confidence': 0.5}

        logger.info(f"Task classified as: {result['type']} (confidence: {result['confidence']})")
        return result

    def create_workflow(self, prompt: str, cwd: str) -> str:
        import uuid
        session_id = str(uuid.uuid4())[:8]
        classification = self.classify_task(prompt)

        logger.info(f"Creating workflow with session_id: {session_id}, task_type: {classification['type']}")

        with self._get_connection() as conn:
            conn.execute("""
                INSERT INTO workflows (session_id, state, task_type, prompt, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (session_id, 'CLASSIFYING', classification['type'], prompt,
                  datetime.now().isoformat(), datetime.now().isoformat()))

        return session_id

    def get_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        # C1 Fix: Validate session_id format to prevent SQL injection
        if not self._validate_session_id(session_id):
            logger.warning(f"Invalid session_id format: {session_id}")
            return None

        logger.debug(f"Fetching status for session_id: {session_id}")

        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT state, task_type, created_at FROM workflows WHERE session_id = ?",
                (session_id,)
            )
            row = cursor.fetchone()

        if row:
            result = {'state': row[0], 'task_type': row[1], 'created_at': row[2]}
            logger.info(f"Status found for session_id {session_id}: {result['state']}")
            return result

        logger.warning(f"No workflow found for session_id: {session_id}")
        return None
