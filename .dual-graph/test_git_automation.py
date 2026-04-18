# .dual-graph/test_git_automation.py
import unittest
import os
import tempfile
import shutil
import subprocess
from git_automation import GitAutomation

class TestGitAutomation(unittest.TestCase):
    def setUp(self):
        self.git = GitAutomation()
        self.session_id = 'test5678'
        self.test_dir = tempfile.mkdtemp()

        # Initialize git repo
        subprocess.run(['git', 'init'], cwd=self.test_dir, capture_output=True)
        subprocess.run(['git', 'config', 'user.name', 'Test User'], cwd=self.test_dir, capture_output=True)
        subprocess.run(['git', 'config', 'user.email', 'test@example.com'], cwd=self.test_dir, capture_output=True)

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_git_initialization(self):
        """Test GitAutomation initializes correctly"""
        self.assertIsNotNone(self.git)
        self.assertTrue(os.path.exists(self.git.git_log_file))

    def test_get_git_status_no_changes(self):
        """Test git status with no changes"""
        result = self.git.get_git_status(self.test_dir)

        self.assertTrue(result['success'])
        self.assertFalse(result['has_changes'])

    def test_get_git_status_with_changes(self):
        """Test git status with changes"""
        # Create a test file
        test_file = os.path.join(self.test_dir, 'test.txt')
        with open(test_file, 'w') as f:
            f.write('test content')

        result = self.git.get_git_status(self.test_dir)

        self.assertTrue(result['success'])
        self.assertTrue(result['has_changes'])

    def test_auto_commit_no_changes(self):
        """Test auto commit with no changes"""
        result = self.git.auto_commit(self.session_id, 'test commit', self.test_dir)

        self.assertTrue(result['success'])
        self.assertIn('No changes to commit', result['message'])

    def test_auto_commit_with_changes(self):
        """Test auto commit with changes"""
        # Create and add a test file
        test_file = os.path.join(self.test_dir, 'test.txt')
        with open(test_file, 'w') as f:
            f.write('test content')

        result = self.git.auto_commit(self.session_id, 'test commit', self.test_dir)

        self.assertTrue(result['success'])
        self.assertIn('Committed', result['message'])

    def test_generate_commit_message(self):
        """Test commit message generation"""
        message = self.git.generate_commit_message(self.session_id, 'feature', self.test_dir)

        self.assertIsInstance(message, str)
        self.assertIn('feat', message)
        self.assertIn(self.session_id[:8], message)

    def test_generate_commit_message_bug(self):
        """Test commit message generation for bug fix"""
        message = self.git.generate_commit_message(self.session_id, 'bug', self.test_dir)

        self.assertIn('fix', message)

    def test_result_structure(self):
        """Test that results have correct structure"""
        result = self.git.auto_commit(self.session_id, 'test', self.test_dir)

        self.assertIn('session_id', result)
        self.assertIn('success', result)
        self.assertIn('message', result)
        self.assertIn('timestamp', result)

if __name__ == '__main__':
    unittest.main()
