# .dual-graph/orchestrator.py
import json
import sqlite3
import logging
import re
import os
from datetime import datetime
from typing import Dict, Any, Optional
from contextlib import contextmanager
from notifier import send_notification
from agent_spawner import AgentSpawner
from test_runner import TestRunner
from git_automation import GitAutomation

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
        self.agent_spawner = AgentSpawner()
        self.test_runner = TestRunner()
        self.git_automation = GitAutomation()
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

    def notify_workflow_start(self, session_id: str, task_type: str):
        """Gửi notification khi workflow bắt đầu"""
        try:
            send_notification(
                "Automation Started",
                f"Đang xử lý: {task_type} (Session: {session_id})"
            )
            logger.info(f"Sent start notification for session {session_id}")
        except Exception as e:
            logger.warning(f"Failed to send start notification: {e}")

    def notify_workflow_done(self, session_id: str, duration: str):
        """Gửi notification khi workflow hoàn thành"""
        try:
            send_notification(
                "Automation Complete",
                f"Hoàn thành trong {duration} (Session: {session_id})"
            )
            logger.info(f"Sent completion notification for session {session_id}")
        except Exception as e:
            logger.warning(f"Failed to send completion notification: {e}")

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

        # Gửi notification khi workflow bắt đầu
        self.notify_workflow_start(session_id, classification['type'])

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

    def transition_to_executing(self, session_id: str) -> Dict[str, Any]:
        """
        Transition workflow from CLASSIFYING to EXECUTING state and spawn agent

        Args:
            session_id: Unique session identifier

        Returns:
            Dict containing transition status and agent spawn result
        """
        if not self._validate_session_id(session_id):
            logger.warning(f"Invalid session_id format: {session_id}")
            return {'success': False, 'error': 'Invalid session_id format'}

        logger.info(f"Transitioning session {session_id} to EXECUTING state")

        # Get current workflow state
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT state, task_type, prompt FROM workflows WHERE session_id = ?",
                (session_id,)
            )
            row = cursor.fetchone()

        if not row:
            logger.error(f"Workflow not found for session_id: {session_id}")
            return {'success': False, 'error': 'Workflow not found'}

        current_state, task_type, prompt = row

        if current_state != 'CLASSIFYING':
            logger.warning(f"Cannot transition from {current_state} to EXECUTING")
            return {'success': False, 'error': f'Invalid state transition from {current_state}'}

        # Update state to EXECUTING
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE workflows SET state = ?, updated_at = ? WHERE session_id = ?",
                ('EXECUTING', datetime.now().isoformat(), session_id)
            )

        logger.info(f"State updated to EXECUTING for session {session_id}")

        # Spawn agent
        agent_result = self.agent_spawner.spawn_agent(task_type, prompt, session_id)

        logger.info(f"Agent spawn result: {agent_result['status']}")

        return {
            'success': True,
            'session_id': session_id,
            'previous_state': current_state,
            'new_state': 'EXECUTING',
            'agent_result': agent_result
        }

    def transition_to_testing(self, session_id: str, cwd: str = None) -> Dict[str, Any]:
        """
        Transition workflow from EXECUTING to TESTING state and run tests

        Args:
            session_id: Unique session identifier
            cwd: Working directory

        Returns:
            Dict containing transition status and test results
        """
        if not self._validate_session_id(session_id):
            logger.warning(f"Invalid session_id format: {session_id}")
            return {'success': False, 'error': 'Invalid session_id format'}

        logger.info(f"Transitioning session {session_id} to TESTING state")

        # Get current workflow state
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT state FROM workflows WHERE session_id = ?",
                (session_id,)
            )
            row = cursor.fetchone()

        if not row:
            logger.error(f"Workflow not found for session_id: {session_id}")
            return {'success': False, 'error': 'Workflow not found'}

        current_state = row[0]

        if current_state != 'EXECUTING':
            logger.warning(f"Cannot transition from {current_state} to TESTING")
            return {'success': False, 'error': f'Invalid state transition from {current_state}'}

        # Update state to TESTING
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE workflows SET state = ?, updated_at = ? WHERE session_id = ?",
                ('TESTING', datetime.now().isoformat(), session_id)
            )

        logger.info(f"State updated to TESTING for session {session_id}")

        # Run tests
        test_result = self.test_runner.run_playwright_tests(session_id, cwd)

        logger.info(f"Test result: {'passed' if test_result['passed'] else 'failed'}")

        return {
            'success': True,
            'session_id': session_id,
            'previous_state': current_state,
            'new_state': 'TESTING',
            'test_result': test_result
        }

    def transition_to_committing(self, session_id: str, cwd: str = None) -> Dict[str, Any]:
        """
        Transition workflow from TESTING to COMMITTING state and auto commit

        Args:
            session_id: Unique session identifier
            cwd: Working directory

        Returns:
            Dict containing transition status and commit result
        """
        if not self._validate_session_id(session_id):
            logger.warning(f"Invalid session_id format: {session_id}")
            return {'success': False, 'error': 'Invalid session_id format'}

        logger.info(f"Transitioning session {session_id} to COMMITTING state")

        # Get current workflow state
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT state, task_type FROM workflows WHERE session_id = ?",
                (session_id,)
            )
            row = cursor.fetchone()

        if not row:
            logger.error(f"Workflow not found for session_id: {session_id}")
            return {'success': False, 'error': 'Workflow not found'}

        current_state, task_type = row

        if current_state != 'TESTING':
            logger.warning(f"Cannot transition from {current_state} to COMMITTING")
            return {'success': False, 'error': f'Invalid state transition from {current_state}'}

        # Update state to COMMITTING
        with self._get_connection() as conn:
            conn.execute(
                "UPDATE workflows SET state = ?, updated_at = ? WHERE session_id = ?",
                ('COMMITTING', datetime.now().isoformat(), session_id)
            )

        logger.info(f"State updated to COMMITTING for session {session_id}")

        # Generate commit message and commit
        commit_message = self.git_automation.generate_commit_message(session_id, task_type, cwd)
        commit_result = self.git_automation.auto_commit(session_id, commit_message, cwd)

        logger.info(f"Commit result: {'success' if commit_result['success'] else 'failed'}")

        return {
            'success': True,
            'session_id': session_id,
            'previous_state': current_state,
            'new_state': 'COMMITTING',
            'commit_result': commit_result
        }
