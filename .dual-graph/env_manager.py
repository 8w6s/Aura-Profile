# .dual-graph/env_manager.py
import subprocess
import json
import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class EnvironmentManager:
    """
    Quản lý dependencies và environment cho workflow automation.
    Auto-detect missing packages và install chúng trước khi spawn agent.
    """

    def __init__(self, cwd: str = None):
        self.cwd = cwd or os.getcwd()
        logger.info(f"EnvironmentManager initialized with cwd: {self.cwd}")

    def check_dependencies(self) -> Dict[str, Any]:
        """
        Kiểm tra dependencies trong project và detect missing packages.

        Returns:
            Dict chứa thông tin về dependencies:
            {
                'npm': {'missing': [...], 'installed': [...]},
                'pip': {'missing': [...], 'installed': [...]},
                'has_missing': bool
            }
        """
        logger.info("Checking project dependencies...")

        result = {
            'npm': {'missing': [], 'installed': []},
            'pip': {'missing': [], 'installed': []},
            'has_missing': False
        }

        # Check npm dependencies
        npm_result = self._check_npm_dependencies()
        result['npm'] = npm_result

        # Check pip dependencies
        pip_result = self._check_pip_dependencies()
        result['pip'] = pip_result

        # Determine if there are any missing dependencies
        result['has_missing'] = (
            len(npm_result['missing']) > 0 or
            len(pip_result['missing']) > 0
        )

        logger.info(f"Dependency check complete. Missing: {result['has_missing']}")
        return result

    def _check_npm_dependencies(self) -> Dict[str, List[str]]:
        """Kiểm tra npm dependencies từ package.json"""
        package_json_path = os.path.join(self.cwd, 'package.json')

        if not os.path.exists(package_json_path):
            logger.debug("No package.json found, skipping npm check")
            return {'missing': [], 'installed': []}

        try:
            with open(package_json_path, 'r', encoding='utf-8') as f:
                package_data = json.load(f)

            # Get all dependencies
            all_deps = {}
            all_deps.update(package_data.get('dependencies', {}))
            all_deps.update(package_data.get('devDependencies', {}))

            if not all_deps:
                logger.debug("No npm dependencies declared")
                return {'missing': [], 'installed': []}

            # Check node_modules
            node_modules_path = os.path.join(self.cwd, 'node_modules')

            missing = []
            installed = []

            for pkg_name in all_deps.keys():
                pkg_path = os.path.join(node_modules_path, pkg_name)
                if os.path.exists(pkg_path):
                    installed.append(pkg_name)
                else:
                    missing.append(pkg_name)

            logger.info(f"NPM: {len(installed)} installed, {len(missing)} missing")
            return {'missing': missing, 'installed': installed}

        except Exception as e:
            logger.error(f"Error checking npm dependencies: {e}")
            return {'missing': [], 'installed': []}

    def _check_pip_dependencies(self) -> Dict[str, List[str]]:
        """Kiểm tra pip dependencies từ requirements.txt"""
        requirements_path = os.path.join(self.cwd, 'requirements.txt')

        if not os.path.exists(requirements_path):
            logger.debug("No requirements.txt found, skipping pip check")
            return {'missing': [], 'installed': []}

        try:
            # Read requirements.txt
            with open(requirements_path, 'r', encoding='utf-8') as f:
                requirements = [
                    line.strip().split('==')[0].split('>=')[0].split('<=')[0]
                    for line in f
                    if line.strip() and not line.startswith('#')
                ]

            if not requirements:
                logger.debug("No pip dependencies declared")
                return {'missing': [], 'installed': []}

            # Get installed packages
            result = subprocess.run(
                ['pip', 'list', '--format=json'],
                capture_output=True,
                text=True,
                cwd=self.cwd
            )

            if result.returncode != 0:
                logger.error(f"Failed to list pip packages: {result.stderr}")
                return {'missing': [], 'installed': []}

            installed_packages = {
                pkg['name'].lower()
                for pkg in json.loads(result.stdout)
            }

            missing = []
            installed = []

            for pkg in requirements:
                pkg_lower = pkg.lower()
                if pkg_lower in installed_packages:
                    installed.append(pkg)
                else:
                    missing.append(pkg)

            logger.info(f"PIP: {len(installed)} installed, {len(missing)} missing")
            return {'missing': missing, 'installed': installed}

        except Exception as e:
            logger.error(f"Error checking pip dependencies: {e}")
            return {'missing': [], 'installed': []}

    def auto_install(self, dep_check: Dict[str, Any]) -> Dict[str, Any]:
        """
        Tự động install missing dependencies.

        Args:
            dep_check: Result từ check_dependencies()

        Returns:
            Dict chứa kết quả installation:
            {
                'npm': {'success': bool, 'installed': [...], 'failed': [...]},
                'pip': {'success': bool, 'installed': [...], 'failed': [...]},
                'overall_success': bool
            }
        """
        logger.info("Starting auto-install of missing dependencies...")

        result = {
            'npm': {'success': True, 'installed': [], 'failed': []},
            'pip': {'success': True, 'installed': [], 'failed': []},
            'overall_success': True
        }

        # Install npm packages
        if dep_check['npm']['missing']:
            npm_result = self._install_npm_packages(dep_check['npm']['missing'])
            result['npm'] = npm_result
            if not npm_result['success']:
                result['overall_success'] = False

        # Install pip packages
        if dep_check['pip']['missing']:
            pip_result = self._install_pip_packages(dep_check['pip']['missing'])
            result['pip'] = pip_result
            if not pip_result['success']:
                result['overall_success'] = False

        logger.info(f"Auto-install complete. Success: {result['overall_success']}")
        return result

    def _install_npm_packages(self, packages: List[str]) -> Dict[str, Any]:
        """Install npm packages"""
        logger.info(f"Installing {len(packages)} npm packages...")

        try:
            # Use npm install to install all missing packages
            result = subprocess.run(
                ['npm', 'install'],
                capture_output=True,
                text=True,
                cwd=self.cwd,
                timeout=300  # 5 minutes timeout
            )

            if result.returncode == 0:
                logger.info(f"Successfully installed npm packages")
                return {
                    'success': True,
                    'installed': packages,
                    'failed': []
                }
            else:
                logger.error(f"npm install failed: {result.stderr}")
                return {
                    'success': False,
                    'installed': [],
                    'failed': packages,
                    'error': result.stderr
                }

        except subprocess.TimeoutExpired:
            logger.error("npm install timed out after 5 minutes")
            return {
                'success': False,
                'installed': [],
                'failed': packages,
                'error': 'Installation timed out'
            }
        except Exception as e:
            logger.error(f"Error installing npm packages: {e}")
            return {
                'success': False,
                'installed': [],
                'failed': packages,
                'error': str(e)
            }

    def _install_pip_packages(self, packages: List[str]) -> Dict[str, Any]:
        """Install pip packages"""
        logger.info(f"Installing {len(packages)} pip packages...")

        installed = []
        failed = []

        for pkg in packages:
            try:
                result = subprocess.run(
                    ['pip', 'install', pkg],
                    capture_output=True,
                    text=True,
                    cwd=self.cwd,
                    timeout=120  # 2 minutes per package
                )

                if result.returncode == 0:
                    logger.info(f"Successfully installed {pkg}")
                    installed.append(pkg)
                else:
                    logger.error(f"Failed to install {pkg}: {result.stderr}")
                    failed.append(pkg)

            except subprocess.TimeoutExpired:
                logger.error(f"Installation of {pkg} timed out")
                failed.append(pkg)
            except Exception as e:
                logger.error(f"Error installing {pkg}: {e}")
                failed.append(pkg)

        success = len(failed) == 0
        logger.info(f"Pip install complete: {len(installed)} success, {len(failed)} failed")

        return {
            'success': success,
            'installed': installed,
            'failed': failed
        }

    def ensure_environment(self) -> Dict[str, Any]:
        """
        Đảm bảo environment sẵn sàng bằng cách check và install dependencies.

        Returns:
            Dict chứa kết quả:
            {
                'ready': bool,
                'dep_check': {...},
                'install_result': {...} (nếu có install)
            }
        """
        logger.info("Ensuring environment is ready...")

        # Check dependencies
        dep_check = self.check_dependencies()

        result = {
            'ready': True,
            'dep_check': dep_check
        }

        # If there are missing dependencies, install them
        if dep_check['has_missing']:
            logger.info("Missing dependencies detected, starting auto-install...")
            install_result = self.auto_install(dep_check)
            result['install_result'] = install_result
            result['ready'] = install_result['overall_success']
        else:
            logger.info("All dependencies are installed")

        return result
