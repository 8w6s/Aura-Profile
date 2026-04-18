# .dual-graph/agent_spawner.py
import subprocess
import json
import logging
import os
from typing import Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class AgentSpawner:
    """Spawns Claude agents for different task types"""

    def __init__(self):
        self.log_dir = os.path.dirname(os.path.abspath(__file__))
        self.agent_log_file = os.path.join(self.log_dir, 'agent_spawner.log')
        self._setup_logging()

    def _setup_logging(self):
        """Configure logging for agent spawner"""
        handler = logging.FileHandler(self.agent_log_file)
        handler.setLevel(logging.INFO)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    def spawn_agent(self, task_type: str, prompt: str, session_id: str) -> Dict[str, Any]:
        """
        Spawn a Claude agent to handle a specific task

        Args:
            task_type: Type of task (bug, feature, refactor, test)
            prompt: Original user prompt
            session_id: Unique session identifier

        Returns:
            Dict containing agent_id, status, and output
        """
        logger.info(f"Spawning agent for task_type={task_type}, session_id={session_id}")

        agent_prompt = self._build_agent_prompt(task_type, prompt)

        try:
            result = subprocess.run(
                ['claude', '--agent', '--prompt', agent_prompt],
                capture_output=True,
                timeout=300,
                text=True
            )

            status = 'running' if result.returncode == 0 else 'failed'
            output = result.stdout if result.returncode == 0 else result.stderr

            logger.info(f"Agent spawned: status={status}, returncode={result.returncode}")

            return {
                'agent_id': session_id,
                'status': status,
                'output': output,
                'returncode': result.returncode,
                'timestamp': datetime.now().isoformat()
            }

        except subprocess.TimeoutExpired:
            logger.error(f"Agent timeout for session {session_id}")
            return {
                'agent_id': session_id,
                'status': 'timeout',
                'output': 'Agent execution timed out after 300 seconds',
                'returncode': -1,
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Agent spawn failed: {e}")
            return {
                'agent_id': session_id,
                'status': 'error',
                'output': str(e),
                'returncode': -1,
                'timestamp': datetime.now().isoformat()
            }

    def _build_agent_prompt(self, task_type: str, prompt: str) -> str:
        """
        Build specialized prompt based on task type

        Args:
            task_type: Type of task
            prompt: Original user prompt

        Returns:
            Formatted prompt for the agent
        """
        prompt_templates = {
            'bug': f"Debug và fix bug: {prompt}",
            'feature': f"Implement feature: {prompt}",
            'refactor': f"Refactor code: {prompt}",
            'test': f"Write tests: {prompt}",
            'unknown': prompt
        }

        agent_prompt = prompt_templates.get(task_type, prompt)
        logger.debug(f"Built agent prompt for {task_type}: {agent_prompt[:100]}...")

        return agent_prompt
