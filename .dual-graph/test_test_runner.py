# .dual-graph/test_test_runner.py
import unittest
import os
import tempfile
import shutil
from test_runner import TestRunner

class TestTestRunner(unittest.TestCase):
    def setUp(self):
        self.runner = TestRunner()
        self.session_id = 'test1234'
        self.test_dir = tempfile.mkdtemp()

    def tearDown(self):
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_runner_initialization(self):
        """Test TestRunner initializes correctly"""
        self.assertIsNotNone(self.runner)
        self.assertTrue(os.path.exists(self.runner.test_log_file))

    def test_playwright_not_installed(self):
        """Test handling when Playwright is not installed"""
        result = self.runner.run_playwright_tests(self.session_id, self.test_dir)

        self.assertEqual(result['session_id'], self.session_id)
        self.assertFalse(result['passed'])
        self.assertIn('Playwright not installed', result['output'])

    def test_unit_tests_no_package_json(self):
        """Test handling when no package.json exists"""
        result = self.runner.run_unit_tests(self.session_id, self.test_dir)

        self.assertEqual(result['session_id'], self.session_id)
        self.assertFalse(result['passed'])

    def test_result_structure(self):
        """Test that results have correct structure"""
        result = self.runner.run_playwright_tests(self.session_id, self.test_dir)

        self.assertIn('session_id', result)
        self.assertIn('passed', result)
        self.assertIn('output', result)
        self.assertIn('returncode', result)
        self.assertIn('timestamp', result)

if __name__ == '__main__':
    unittest.main()
