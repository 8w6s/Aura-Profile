# .dual-graph/test_runner.py
import subprocess
import json
import logging
import os
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class TestRunner:
    """Runs Playwright tests and other test suites"""

    def __init__(self):
        self.log_dir = os.path.dirname(os.path.abspath(__file__))
        self.test_log_file = os.path.join(self.log_dir, 'test_runner.log')
        self._setup_logging()

    def _setup_logging(self):
        """Configure logging for test runner"""
        handler = logging.FileHandler(self.test_log_file)
        handler.setLevel(logging.INFO)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    def run_playwright_tests(self, session_id: str, cwd: str = None) -> Dict[str, Any]:
        """
        Run Playwright tests

        Args:
            session_id: Unique session identifier
            cwd: Working directory (defaults to current directory)

        Returns:
            Dict containing test results
        """
        logger.info(f"Running Playwright tests for session {session_id}")

        if cwd is None:
            cwd = os.getcwd()

        # Check if Playwright is installed
        check_result = subprocess.run(
            ['npx', 'playwright', '--version'],
            capture_output=True,
            text=True,
            cwd=cwd
        )

        if check_result.returncode != 0:
            logger.error(f"Playwright not found for session {session_id}")
            return {
                'session_id': session_id,
                'passed': False,
                'output': 'Playwright not installed. Run: npm install -D @playwright/test',
                'returncode': -1,
                'timestamp': datetime.now().isoformat()
            }

        try:
            result = subprocess.run(
                ['npx', 'playwright', 'test'],
                capture_output=True,
                timeout=120,
                text=True,
                cwd=cwd
            )

            passed = result.returncode == 0
            output = result.stdout if result.returncode == 0 else result.stderr

            logger.info(f"Playwright tests {'passed' if passed else 'failed'} for session {session_id}")

            return {
                'session_id': session_id,
                'passed': passed,
                'output': output,
                'returncode': result.returncode,
                'timestamp': datetime.now().isoformat()
            }

        except subprocess.TimeoutExpired:
            logger.error(f"Playwright tests timeout for session {session_id}")
            return {
                'session_id': session_id,
                'passed': False,
                'output': 'Tests timed out after 120 seconds',
                'returncode': -1,
                'timestamp': datetime.now().isoformat()
            }
        except FileNotFoundError:
            logger.error(f"Playwright not found for session {session_id}")
            return {
                'session_id': session_id,
                'passed': False,
                'output': 'Playwright not installed. Run: npm install -D @playwright/test',
                'returncode': -1,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Playwright tests failed: {e}")
            return {
                'session_id': session_id,
                'passed': False,
                'output': str(e),
                'returncode': -1,
                'timestamp': datetime.now().isoformat()
            }

    def run_unit_tests(self, session_id: str, cwd: str = None) -> Dict[str, Any]:
        """
        Run unit tests (npm test)

        Args:
            session_id: Unique session identifier
            cwd: Working directory

        Returns:
            Dict containing test results
        """
        logger.info(f"Running unit tests for session {session_id}")

        if cwd is None:
            cwd = os.getcwd()

        # Check if package.json exists
        package_json = os.path.join(cwd, 'package.json')
        if not os.path.exists(package_json):
            logger.error(f"package.json not found for session {session_id}")
            return {
                'session_id': session_id,
                'passed': False,
                'output': 'package.json not found in project directory',
                'returncode': -1,
                'timestamp': datetime.now().isoformat()
            }

        try:
            result = subprocess.run(
                ['npm', 'test', '--', '--run'],
                capture_output=True,
                timeout=120,
                text=True,
                cwd=cwd
            )

            passed = result.returncode == 0
            output = result.stdout if result.returncode == 0 else result.stderr

            logger.info(f"Unit tests {'passed' if passed else 'failed'} for session {session_id}")

            return {
                'session_id': session_id,
                'passed': passed,
                'output': output,
                'returncode': result.returncode,
                'timestamp': datetime.now().isoformat()
            }

        except subprocess.TimeoutExpired:
            logger.error(f"Unit tests timeout for session {session_id}")
            return {
                'session_id': session_id,
                'passed': False,
                'output': 'Tests timed out after 120 seconds',
                'returncode': -1,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Unit tests failed: {e}")
            return {
                'session_id': session_id,
                'passed': False,
                'output': str(e),
                'returncode': -1,
                'timestamp': datetime.now().isoformat()
            }
