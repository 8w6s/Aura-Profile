# .dual-graph/test_agent_spawner.py
import unittest
import os
import sys
from unittest.mock import patch, MagicMock
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agent_spawner import AgentSpawner

class TestAgentSpawner(unittest.TestCase):
    def setUp(self):
        self.spawner = AgentSpawner()

    def test_build_agent_prompt_bug(self):
        """Test bug task prompt building"""
        prompt = self.spawner._build_agent_prompt('bug', 'Fix login error')
        self.assertEqual(prompt, 'Debug và fix bug: Fix login error')

    def test_build_agent_prompt_feature(self):
        """Test feature task prompt building"""
        prompt = self.spawner._build_agent_prompt('feature', 'Add dark mode')
        self.assertEqual(prompt, 'Implement feature: Add dark mode')

    def test_build_agent_prompt_refactor(self):
        """Test refactor task prompt building"""
        prompt = self.spawner._build_agent_prompt('refactor', 'Clean up auth code')
        self.assertEqual(prompt, 'Refactor code: Clean up auth code')

    def test_build_agent_prompt_test(self):
        """Test test task prompt building"""
        prompt = self.spawner._build_agent_prompt('test', 'Add unit tests')
        self.assertEqual(prompt, 'Write tests: Add unit tests')

    def test_build_agent_prompt_unknown(self):
        """Test unknown task type uses original prompt"""
        prompt = self.spawner._build_agent_prompt('unknown', 'Do something')
        self.assertEqual(prompt, 'Do something')

    @patch('subprocess.run')
    def test_spawn_agent_success(self, mock_run):
        """Test successful agent spawn"""
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout='Agent completed successfully',
            stderr=''
        )

        result = self.spawner.spawn_agent('bug', 'Fix error', 'test123')

        self.assertEqual(result['agent_id'], 'test123')
        self.assertEqual(result['status'], 'running')
        self.assertEqual(result['output'], 'Agent completed successfully')
        self.assertEqual(result['returncode'], 0)
        self.assertIn('timestamp', result)

    @patch('subprocess.run')
    def test_spawn_agent_failure(self, mock_run):
        """Test failed agent spawn"""
        mock_run.return_value = MagicMock(
            returncode=1,
            stdout='',
            stderr='Agent failed'
        )

        result = self.spawner.spawn_agent('feature', 'Add feature', 'test456')

        self.assertEqual(result['agent_id'], 'test456')
        self.assertEqual(result['status'], 'failed')
        self.assertEqual(result['output'], 'Agent failed')
        self.assertEqual(result['returncode'], 1)

    @patch('subprocess.run')
    def test_spawn_agent_timeout(self, mock_run):
        """Test agent spawn timeout"""
        from subprocess import TimeoutExpired
        mock_run.side_effect = TimeoutExpired('claude', 300)

        result = self.spawner.spawn_agent('refactor', 'Refactor code', 'test789')

        self.assertEqual(result['agent_id'], 'test789')
        self.assertEqual(result['status'], 'timeout')
        self.assertIn('timed out', result['output'])
        self.assertEqual(result['returncode'], -1)

if __name__ == '__main__':
    unittest.main()
