# .dual-graph/test_orchestrator_agent_integration.py
import unittest
import os
import sys
import tempfile
from unittest.mock import patch, MagicMock

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from orchestrator import WorkflowOrchestrator

class TestOrchestratorAgentIntegration(unittest.TestCase):
    def setUp(self):
        # Create temporary database for testing
        self.temp_db = tempfile.NamedTemporaryFile(delete=False, suffix='.db')
        self.temp_db.close()
        self.orchestrator = WorkflowOrchestrator(self.temp_db.name)

    def tearDown(self):
        # Clean up temporary database
        if os.path.exists(self.temp_db.name):
            os.unlink(self.temp_db.name)

    def test_orchestrator_has_agent_spawner(self):
        """Test that orchestrator initializes with agent spawner"""
        self.assertIsNotNone(self.orchestrator.agent_spawner)
        self.assertEqual(self.orchestrator.agent_spawner.__class__.__name__, 'AgentSpawner')

    @patch('notifier.send_notification')
    def test_create_workflow_initializes_classifying_state(self, mock_notify):
        """Test workflow creation starts in CLASSIFYING state"""
        session_id = self.orchestrator.create_workflow('Fix bug in login', os.getcwd())

        status = self.orchestrator.get_status(session_id)
        self.assertIsNotNone(status)
        self.assertEqual(status['state'], 'CLASSIFYING')
        self.assertEqual(status['task_type'], 'bug')

    @patch('notifier.send_notification')
    @patch('subprocess.run')
    def test_transition_to_executing_success(self, mock_run, mock_notify):
        """Test successful transition from CLASSIFYING to EXECUTING"""
        # Mock successful agent spawn
        mock_run.return_value = MagicMock(
            returncode=0,
            stdout='Agent started successfully',
            stderr=''
        )

        # Create workflow
        session_id = self.orchestrator.create_workflow('Add new feature', os.getcwd())

        # Verify initial state
        status = self.orchestrator.get_status(session_id)
        self.assertEqual(status['state'], 'CLASSIFYING')

        # Transition to EXECUTING
        result = self.orchestrator.transition_to_executing(session_id)

        # Verify transition result
        self.assertTrue(result['success'])
        self.assertEqual(result['session_id'], session_id)
        self.assertEqual(result['previous_state'], 'CLASSIFYING')
        self.assertEqual(result['new_state'], 'EXECUTING')
        self.assertEqual(result['agent_result']['status'], 'running')

        # Verify state updated in database
        status = self.orchestrator.get_status(session_id)
        self.assertEqual(status['state'], 'EXECUTING')

    @patch('notifier.send_notification')
    def test_transition_invalid_session(self, mock_notify):
        """Test transition with invalid session_id"""
        result = self.orchestrator.transition_to_executing('invalid123')

        self.assertFalse(result['success'])
        self.assertIn('error', result)

    @patch('notifier.send_notification')
    def test_transition_nonexistent_session(self, mock_notify):
        """Test transition with non-existent session"""
        result = self.orchestrator.transition_to_executing('abcd1234')

        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'Workflow not found')

    @patch('notifier.send_notification')
    @patch('subprocess.run')
    def test_agent_receives_correct_prompt(self, mock_run, mock_notify):
        """Test that agent receives correctly formatted prompt"""
        mock_run.return_value = MagicMock(returncode=0, stdout='OK', stderr='')

        # Create bug workflow
        session_id = self.orchestrator.create_workflow('Fix authentication error', os.getcwd())

        # Transition to executing
        self.orchestrator.transition_to_executing(session_id)

        # Verify subprocess was called (may be called multiple times due to notifications)
        # Find the call with claude agent
        claude_calls = [call for call in mock_run.call_args_list
                       if len(call[0]) > 0 and isinstance(call[0][0], list)
                       and 'claude' in call[0][0]]

        self.assertEqual(len(claude_calls), 1, "Should have exactly one claude agent call")

        call_args = claude_calls[0][0][0]
        self.assertIn('claude', call_args)
        self.assertIn('--agent', call_args)
        self.assertIn('--prompt', call_args)

        # Find the prompt argument
        prompt_index = call_args.index('--prompt') + 1
        prompt = call_args[prompt_index]
        self.assertIn('Debug và fix bug:', prompt)
        self.assertIn('Fix authentication error', prompt)

if __name__ == '__main__':
    unittest.main()
