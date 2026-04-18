# .dual-graph/test_env_manager.py
import unittest
import os
import json
import tempfile
import shutil
from env_manager import EnvironmentManager

class TestEnvironmentManager(unittest.TestCase):
    """Test suite cho EnvironmentManager"""

    def setUp(self):
        """Tạo temporary directory cho mỗi test"""
        self.test_dir = tempfile.mkdtemp()
        self.env_manager = EnvironmentManager(self.test_dir)

    def tearDown(self):
        """Cleanup temporary directory"""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir)

    def test_no_dependencies(self):
        """Test khi không có package.json hoặc requirements.txt"""
        result = self.env_manager.check_dependencies()

        self.assertFalse(result['has_missing'])
        self.assertEqual(len(result['npm']['missing']), 0)
        self.assertEqual(len(result['pip']['missing']), 0)

    def test_npm_all_installed(self):
        """Test khi tất cả npm packages đã được install"""
        # Tạo package.json
        package_json = {
            'dependencies': {
                'react': '^18.0.0',
                'next': '^14.0.0'
            }
        }
        with open(os.path.join(self.test_dir, 'package.json'), 'w') as f:
            json.dump(package_json, f)

        # Tạo node_modules với các packages
        node_modules = os.path.join(self.test_dir, 'node_modules')
        os.makedirs(node_modules)
        os.makedirs(os.path.join(node_modules, 'react'))
        os.makedirs(os.path.join(node_modules, 'next'))

        result = self.env_manager.check_dependencies()

        self.assertFalse(result['has_missing'])
        self.assertEqual(len(result['npm']['missing']), 0)
        self.assertEqual(len(result['npm']['installed']), 2)
        self.assertIn('react', result['npm']['installed'])
        self.assertIn('next', result['npm']['installed'])

    def test_npm_missing_packages(self):
        """Test khi có npm packages bị thiếu"""
        # Tạo package.json
        package_json = {
            'dependencies': {
                'react': '^18.0.0',
                'next': '^14.0.0',
                'typescript': '^5.0.0'
            }
        }
        with open(os.path.join(self.test_dir, 'package.json'), 'w') as f:
            json.dump(package_json, f)

        # Chỉ tạo node_modules với 1 package
        node_modules = os.path.join(self.test_dir, 'node_modules')
        os.makedirs(node_modules)
        os.makedirs(os.path.join(node_modules, 'react'))

        result = self.env_manager.check_dependencies()

        self.assertTrue(result['has_missing'])
        self.assertEqual(len(result['npm']['missing']), 2)
        self.assertEqual(len(result['npm']['installed']), 1)
        self.assertIn('next', result['npm']['missing'])
        self.assertIn('typescript', result['npm']['missing'])
        self.assertIn('react', result['npm']['installed'])

    def test_pip_all_installed(self):
        """Test khi tất cả pip packages đã được install"""
        # Tạo requirements.txt với packages đã install trong system
        requirements = "pip\nsetuptools\n"
        with open(os.path.join(self.test_dir, 'requirements.txt'), 'w') as f:
            f.write(requirements)

        result = self.env_manager.check_dependencies()

        # pip và setuptools thường đã có sẵn
        self.assertFalse(result['has_missing'])
        self.assertGreaterEqual(len(result['pip']['installed']), 1)

    def test_pip_missing_packages(self):
        """Test khi có pip packages bị thiếu"""
        # Tạo requirements.txt với package không tồn tại
        requirements = "pip\nnonexistent-package-xyz-123\n"
        with open(os.path.join(self.test_dir, 'requirements.txt'), 'w') as f:
            f.write(requirements)

        result = self.env_manager.check_dependencies()

        self.assertTrue(result['has_missing'])
        self.assertIn('nonexistent-package-xyz-123', result['pip']['missing'])

    def test_ensure_environment_no_missing(self):
        """Test ensure_environment khi không có missing packages"""
        result = self.env_manager.ensure_environment()

        self.assertTrue(result['ready'])
        self.assertFalse(result['dep_check']['has_missing'])
        self.assertNotIn('install_result', result)

    def test_ensure_environment_with_missing(self):
        """Test ensure_environment khi có missing packages"""
        # Tạo package.json với missing packages
        package_json = {
            'dependencies': {
                'react': '^18.0.0'
            }
        }
        with open(os.path.join(self.test_dir, 'package.json'), 'w') as f:
            json.dump(package_json, f)

        # Không tạo node_modules -> packages sẽ missing
        result = self.env_manager.ensure_environment()

        self.assertTrue(result['dep_check']['has_missing'])
        self.assertIn('install_result', result)

    def test_npm_with_dev_dependencies(self):
        """Test npm check với cả dependencies và devDependencies"""
        package_json = {
            'dependencies': {
                'react': '^18.0.0'
            },
            'devDependencies': {
                'typescript': '^5.0.0',
                'eslint': '^8.0.0'
            }
        }
        with open(os.path.join(self.test_dir, 'package.json'), 'w') as f:
            json.dump(package_json, f)

        result = self.env_manager.check_dependencies()

        # Tất cả 3 packages đều missing
        self.assertTrue(result['has_missing'])
        self.assertEqual(len(result['npm']['missing']), 3)

    def test_pip_requirements_with_versions(self):
        """Test pip check với version specifiers"""
        requirements = "nonexistent-pkg-a==1.0.0\nnonexistent-pkg-b>=2.0.0\nnonexistent-pkg-c<=3.0.0\n"
        with open(os.path.join(self.test_dir, 'requirements.txt'), 'w') as f:
            f.write(requirements)

        result = self.env_manager.check_dependencies()

        # Packages sẽ missing vì không tồn tại
        self.assertTrue(result['has_missing'])
        self.assertIn('nonexistent-pkg-a', result['pip']['missing'])
        self.assertIn('nonexistent-pkg-b', result['pip']['missing'])
        self.assertIn('nonexistent-pkg-c', result['pip']['missing'])

    def test_pip_requirements_with_comments(self):
        """Test pip check với comments trong requirements.txt"""
        requirements = "# This is a comment\npip\n# Another comment\nsetuptools\n\n"
        with open(os.path.join(self.test_dir, 'requirements.txt'), 'w') as f:
            f.write(requirements)

        result = self.env_manager.check_dependencies()

        # Comments không được parse
        self.assertEqual(len(result['pip']['installed']) + len(result['pip']['missing']), 2)

def run_tests():
    """Chạy tất cả tests"""
    suite = unittest.TestLoader().loadTestsFromTestCase(TestEnvironmentManager)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    exit(0 if success else 1)
