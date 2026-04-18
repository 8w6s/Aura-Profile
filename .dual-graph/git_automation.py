# .dual-graph/git_automation.py
import subprocess
import logging
import os
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class GitAutomation:
    """Automates git operations: commit, push, branch management"""

    def __init__(self):
        self.log_dir = os.path.dirname(os.path.abspath(__file__))
        self.git_log_file = os.path.join(self.log_dir, 'git_automation.log')
        self._setup_logging()

    def _setup_logging(self):
        """Configure logging for git automation"""
        handler = logging.FileHandler(self.git_log_file)
        handler.setLevel(logging.INFO)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    def get_git_status(self, cwd: str = None) -> Dict[str, Any]:
        """
        Get current git status

        Args:
            cwd: Working directory

        Returns:
            Dict containing git status info
        """
        if cwd is None:
            cwd = os.getcwd()

        try:
            result = subprocess.run(
                ['git', 'status', '--porcelain'],
                capture_output=True,
                text=True,
                cwd=cwd
            )

            has_changes = len(result.stdout.strip()) > 0

            return {
                'has_changes': has_changes,
                'output': result.stdout,
                'success': True
            }

        except Exception as e:
            logger.error(f"Failed to get git status: {e}")
            return {
                'has_changes': False,
                'output': str(e),
                'success': False
            }

    def auto_commit(self, session_id: str, message: str, cwd: str = None) -> Dict[str, Any]:
        """
        Auto commit changes

        Args:
            session_id: Unique session identifier
            message: Commit message
            cwd: Working directory

        Returns:
            Dict containing commit result
        """
        logger.info(f"Auto committing for session {session_id}")

        if cwd is None:
            cwd = os.getcwd()

        try:
            # Check if there are changes to commit
            status = self.get_git_status(cwd)
            if not status['has_changes']:
                logger.info(f"No changes to commit for session {session_id}")
                return {
                    'session_id': session_id,
                    'success': True,
                    'message': 'No changes to commit',
                    'timestamp': datetime.now().isoformat()
                }

            # Add all changes
            add_result = subprocess.run(
                ['git', 'add', '.'],
                capture_output=True,
                text=True,
                cwd=cwd
            )

            if add_result.returncode != 0:
                logger.error(f"Git add failed: {add_result.stderr}")
                return {
                    'session_id': session_id,
                    'success': False,
                    'message': f'Git add failed: {add_result.stderr}',
                    'timestamp': datetime.now().isoformat()
                }

            # Commit changes
            commit_result = subprocess.run(
                ['git', 'commit', '-m', message],
                capture_output=True,
                text=True,
                cwd=cwd
            )

            if commit_result.returncode != 0:
                logger.error(f"Git commit failed: {commit_result.stderr}")
                return {
                    'session_id': session_id,
                    'success': False,
                    'message': f'Git commit failed: {commit_result.stderr}',
                    'timestamp': datetime.now().isoformat()
                }

            logger.info(f"Successfully committed for session {session_id}")

            return {
                'session_id': session_id,
                'success': True,
                'message': f'Committed: {message}',
                'output': commit_result.stdout,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Auto commit failed: {e}")
            return {
                'session_id': session_id,
                'success': False,
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def auto_push(self, session_id: str, branch: str = 'main', cwd: str = None) -> Dict[str, Any]:
        """
        Auto push to remote

        Args:
            session_id: Unique session identifier
            branch: Branch name to push
            cwd: Working directory

        Returns:
            Dict containing push result
        """
        logger.info(f"Auto pushing to {branch} for session {session_id}")

        if cwd is None:
            cwd = os.getcwd()

        try:
            result = subprocess.run(
                ['git', 'push', 'origin', branch],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=cwd
            )

            if result.returncode != 0:
                logger.error(f"Git push failed: {result.stderr}")
                return {
                    'session_id': session_id,
                    'success': False,
                    'message': f'Git push failed: {result.stderr}',
                    'timestamp': datetime.now().isoformat()
                }

            logger.info(f"Successfully pushed to {branch} for session {session_id}")

            return {
                'session_id': session_id,
                'success': True,
                'message': f'Pushed to {branch}',
                'output': result.stdout,
                'timestamp': datetime.now().isoformat()
            }

        except subprocess.TimeoutExpired:
            logger.error(f"Git push timeout for session {session_id}")
            return {
                'session_id': session_id,
                'success': False,
                'message': 'Git push timed out after 60 seconds',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Auto push failed: {e}")
            return {
                'session_id': session_id,
                'success': False,
                'message': str(e),
                'timestamp': datetime.now().isoformat()
            }

    def generate_commit_message(self, session_id: str, task_type: str, cwd: str = None) -> str:
        """
        Generate smart commit message based on git diff

        Args:
            session_id: Unique session identifier
            task_type: Type of task (bug, feature, refactor, test)
            cwd: Working directory

        Returns:
            Generated commit message
        """
        if cwd is None:
            cwd = os.getcwd()

        try:
            # Get git diff
            result = subprocess.run(
                ['git', 'diff', '--cached', '--stat'],
                capture_output=True,
                text=True,
                cwd=cwd
            )

            diff_stat = result.stdout.strip()

            # Generate message based on task type
            prefix_map = {
                'bug': 'fix',
                'feature': 'feat',
                'refactor': 'refactor',
                'test': 'test',
                'unknown': 'chore'
            }

            prefix = prefix_map.get(task_type, 'chore')

            if diff_stat:
                # Extract file names from diff stat
                files = [line.split('|')[0].strip() for line in diff_stat.split('\n') if '|' in line]
                if files:
                    first_file = files[0]
                    scope = first_file.split('/')[0] if '/' in first_file else 'core'
                    return f"{prefix}({scope}): auto commit for session {session_id[:8]}"

            return f"{prefix}: auto commit for session {session_id[:8]}"

        except Exception as e:
            logger.error(f"Failed to generate commit message: {e}")
            return f"chore: auto commit for session {session_id[:8]}"
