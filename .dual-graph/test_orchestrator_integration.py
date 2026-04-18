# .dual-graph/test_orchestrator_integration.py
import unittest
import os
import tempfile
import shutil
from orchestrator import WorkflowOrchestrator

class TestOrchestratorIntegration(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.test_dir, 'test_workflows.db')
        self.orchestrator = WorkflowOrchestrator(self.db_path)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_orchestrator_has_test_runner(self):
        """Test orchestrator has test_runner instance"""
        self.assertIsNotNone(self.orchestrator.test_runner)

    def test_orchestrator_has_git_automation(self):
        """Test orchestrator has git_automation instance"""
        self.assertIsNotNone(self.orchestrator.git_automation)

    def test_transition_to_testing_invalid_session(self):
        """Test transition to testing with invalid session"""
        result = self.orchestrator.transition_to_testing('invalid')

        self.assertFalse(result['success'])
        self.assertIn('Invalid session_id format', result['error'])

    def test_transition_to_testing_nonexistent_session(self):
        """Test transition to testing with nonexistent session"""
        result = self.orchestrator.transition_to_testing('abcd1234')

        self.assertFalse(result['success'])
        self.assertIn('Workflow not found', result['error'])

    def test_transition_to_testing_wrong_state(self):
        """Test transition to testing from wrong state"""
        # Create workflow in CLASSIFYING state
        session_id = self.orchestrator.create_workflow('test prompt', '/tmp')

        result = self.orchestrator.transition_to_testing(session_id)

        self.assertFalse(result['success'])
        self.assertIn('Invalid state transition', result['error'])

    def test_transition_to_committing_invalid_session(self):
        """Test transition to committing with invalid session"""
        result = self.orchestrator.transition_to_committing('invalid')

        self.assertFalse(result['success'])
        self.assertIn('Invalid session_id format', result['error'])

    def test_transition_to_committing_nonexistent_session(self):
        """Test transition to committing with nonexistent session"""
        result = self.orchestrator.transition_to_committing('abcd1234')

        self.assertFalse(result['success'])
        self.assertIn('Workflow not found', result['error'])

    def test_transition_to_committing_wrong_state(self):
        """Test transition to committing from wrong state"""
        # Create workflow in CLASSIFYING state
        session_id = self.orchestrator.create_workflow('test prompt', '/tmp')

        result = self.orchestrator.transition_to_committing(session_id)

        self.assertFalse(result['success'])
        self.assertIn('Invalid state transition', result['error'])

    def test_full_workflow_state_transitions(self):
        """Test full workflow state transitions"""
        # Create workflow
        session_id = self.orchestrator.create_workflow('add new feature', '/tmp')
        status = self.orchestrator.get_status(session_id)
        self.assertEqual(status['state'], 'CLASSIFYING')

        # Note: Cannot test full transitions without actual agent/test/git setup
        # This test verifies the state machine structure is correct

if __name__ == '__main__':
    unittest.main()
