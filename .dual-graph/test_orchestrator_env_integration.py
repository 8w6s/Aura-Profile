# .dual-graph/test_orchestrator_env_integration.py
import unittest
import os
import json
import tempfile
import shutil
import sqlite3
from orchestrator import WorkflowOrchestrator

class TestOrchestratorEnvIntegration(unittest.TestCase):
    """Test suite cho integration giữa Orchestrator và EnvironmentManager"""

    def setUp(self):
        """Setup test environment"""
        self.test_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.test_dir, 'test_workflows.db')
        self.orchestrator = WorkflowOrchestrator(self.db_path, self.test_dir)

    def tearDown(self):
        """Cleanup test environment"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_transition_to_executing_no_dependencies(self):
        """Test transition khi không có dependencies"""
        # Create workflow
        session_id = self.orchestrator.create_workflow(
            "Fix bug in authentication",
            self.test_dir
        )

        # Mock agent_spawner để không spawn thật
        original_spawn = self.orchestrator.agent_spawner.spawn_agent
        self.orchestrator.agent_spawner.spawn_agent = lambda *args, **kwargs: {
            'status': 'mocked',
            'session_id': args[2] if len(args) > 2 else 'test'
        }

        # Transition to executing
        result = self.orchestrator.transition_to_executing(session_id)

        # Restore original
        self.orchestrator.agent_spawner.spawn_agent = original_spawn

        # Verify success
        self.assertTrue(result['success'])
        self.assertEqual(result['new_state'], 'EXECUTING')
        self.assertIn('env_result', result)
        self.assertTrue(result['env_result']['ready'])
        self.assertFalse(result['env_result']['dep_check']['has_missing'])

    def test_transition_to_executing_with_installed_dependencies(self):
        """Test transition khi có dependencies nhưng đã install"""
        # Create package.json với installed packages
        package_json = {
            'dependencies': {
                'react': '^18.0.0'
            }
        }
        with open(os.path.join(self.test_dir, 'package.json'), 'w') as f:
            json.dump(package_json, f)

        # Create node_modules
        node_modules = os.path.join(self.test_dir, 'node_modules')
        os.makedirs(node_modules)
        os.makedirs(os.path.join(node_modules, 'react'))

        # Create workflow
        session_id = self.orchestrator.create_workflow(
            "Add new feature",
            self.test_dir
        )

        # Mock agent_spawner
        self.orchestrator.agent_spawner.spawn_agent = lambda *args, **kwargs: {
            'status': 'mocked',
            'session_id': args[2] if len(args) > 2 else 'test'
        }

        # Transition to executing
        result = self.orchestrator.transition_to_executing(session_id)

        # Verify success
        self.assertTrue(result['success'])
        self.assertEqual(result['new_state'], 'EXECUTING')
        self.assertTrue(result['env_result']['ready'])
        self.assertFalse(result['env_result']['dep_check']['has_missing'])

    def test_transition_to_executing_with_missing_dependencies(self):
        """Test transition khi có missing dependencies"""
        # Create package.json với missing packages
        package_json = {
            'dependencies': {
                'react': '^18.0.0',
                'next': '^14.0.0'
            }
        }
        with open(os.path.join(self.test_dir, 'package.json'), 'w') as f:
            json.dump(package_json, f)

        # Không tạo node_modules -> packages sẽ missing

        # Create workflow
        session_id = self.orchestrator.create_workflow(
            "Add new feature",
            self.test_dir
        )

        # Transition to executing
        result = self.orchestrator.transition_to_executing(session_id)

        # Verify env check detected missing packages
        self.assertIn('env_result', result)
        self.assertTrue(result['env_result']['dep_check']['has_missing'])
        self.assertIn('install_result', result['env_result'])

        # Note: npm install sẽ fail trong test environment vì không có npm
        # nhưng logic đã được test

    def test_env_check_before_agent_spawn(self):
        """Test rằng env check được thực hiện trước khi spawn agent"""
        # Create requirements.txt với missing package
        requirements = "nonexistent-package-xyz\n"
        with open(os.path.join(self.test_dir, 'requirements.txt'), 'w') as f:
            f.write(requirements)

        # Create workflow
        session_id = self.orchestrator.create_workflow(
            "Refactor code",
            self.test_dir
        )

        # Transition to executing
        result = self.orchestrator.transition_to_executing(session_id)

        # Verify env check was performed
        self.assertIn('env_result', result)
        self.assertIn('dep_check', result['env_result'])
        self.assertTrue(result['env_result']['dep_check']['has_missing'])

        # Verify install was attempted
        self.assertIn('install_result', result['env_result'])

    def test_orchestrator_cwd_propagation(self):
        """Test rằng cwd được propagate đúng đến env_manager"""
        # Verify orchestrator có cwd
        self.assertEqual(self.orchestrator.cwd, self.test_dir)

        # Verify env_manager có cùng cwd
        self.assertEqual(self.orchestrator.env_manager.cwd, self.test_dir)

    def test_workflow_state_after_env_check(self):
        """Test workflow state sau khi env check"""
        # Create workflow
        session_id = self.orchestrator.create_workflow(
            "Fix bug",
            self.test_dir
        )

        # Initial state should be CLASSIFYING
        status = self.orchestrator.get_status(session_id)
        self.assertEqual(status['state'], 'CLASSIFYING')

        # Transition to executing (với env check)
        result = self.orchestrator.transition_to_executing(session_id)

        # State should be EXECUTING
        status = self.orchestrator.get_status(session_id)
        self.assertEqual(status['state'], 'EXECUTING')

    def test_multiple_workflows_independent_env_checks(self):
        """Test rằng multiple workflows có independent env checks"""
        # Mock agent_spawner
        self.orchestrator.agent_spawner.spawn_agent = lambda *args, **kwargs: {
            'status': 'mocked',
            'session_id': args[2] if len(args) > 2 else 'test'
        }

        # Create first workflow
        session_id_1 = self.orchestrator.create_workflow(
            "Fix bug 1",
            self.test_dir
        )

        # Create second workflow
        session_id_2 = self.orchestrator.create_workflow(
            "Fix bug 2",
            self.test_dir
        )

        # Both should transition independently
        result_1 = self.orchestrator.transition_to_executing(session_id_1)
        result_2 = self.orchestrator.transition_to_executing(session_id_2)

        self.assertTrue(result_1['success'])
        self.assertTrue(result_2['success'])
        self.assertNotEqual(session_id_1, session_id_2)

def run_tests():
    """Chạy tất cả tests"""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestOrchestratorEnvIntegration)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    exit(0 if success else 1)
