#!/usr/bin/env python3
# .dual-graph/orchestrator_server.py
"""
HTTP server for workflow orchestration endpoints.
Runs on port 8081 alongside the main MCP server.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
from orchestrator import WorkflowOrchestrator
import json
import os
import sys
import logging
from pathlib import Path

# Configure logging with file rotation
from logging.handlers import RotatingFileHandler

log_dir = os.path.dirname(os.path.abspath(__file__))
log_file = os.path.join(log_dir, 'orchestrator_server.log')

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# File handler with rotation (10MB max, keep 5 backups)
file_handler = RotatingFileHandler(
    log_file,
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
))

# Console handler
console_handler = logging.StreamHandler(sys.stderr)
console_handler.setFormatter(logging.Formatter(
    '[orchestrator] %(levelname)s - %(message)s'
))

logger.addHandler(file_handler)
logger.addHandler(console_handler)

# Determine data directory
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DATA_DIR, 'workflows.db')

# Initialize orchestrator
orch = WorkflowOrchestrator(DB_PATH)
logger.info(f"Orchestrator initialized with DB: {DB_PATH}")

# Validation constants
MAX_PROMPT_LENGTH = 10000

def validate_prompt(prompt: str) -> tuple[bool, str]:
    """I1 Fix: Validate prompt input"""
    if not prompt:
        return False, "Prompt cannot be empty"
    if not isinstance(prompt, str):
        return False, "Prompt must be a string"
    if len(prompt) > MAX_PROMPT_LENGTH:
        return False, f"Prompt exceeds maximum length of {MAX_PROMPT_LENGTH} characters"
    return True, ""

def validate_cwd(cwd: str) -> tuple[bool, str]:
    """I1 Fix: Validate cwd is an absolute path"""
    if not cwd:
        return True, ""  # cwd is optional
    if not isinstance(cwd, str):
        return False, "cwd must be a string"
    if not os.path.isabs(cwd):
        return False, "cwd must be an absolute path"
    return True, ""

class OrchestrationHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Override to log to stderr and file"""
        logger.info(format % args)

    def send_json_response(self, status_code, data):
        """Helper to send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/orchestrate':
            try:
                length = int(self.headers.get('Content-Length', 0))
                body = json.loads(self.rfile.read(length).decode())

                prompt = body.get('prompt')
                cwd = body.get('cwd', '')

                # I1 Fix: Validate prompt
                valid_prompt, prompt_error = validate_prompt(prompt)
                if not valid_prompt:
                    logger.warning(f"Invalid prompt: {prompt_error}")
                    self.send_json_response(400, {'error': prompt_error})
                    return

                # I1 Fix: Validate cwd
                valid_cwd, cwd_error = validate_cwd(cwd)
                if not valid_cwd:
                    logger.warning(f"Invalid cwd: {cwd_error}")
                    self.send_json_response(400, {'error': cwd_error})
                    return

                logger.info(f"Creating workflow for prompt (length: {len(prompt)})")
                session_id = orch.create_workflow(prompt, cwd)
                logger.info(f"Workflow created with session_id: {session_id}")
                self.send_json_response(200, {'session_id': session_id})

            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {e}")
                self.send_json_response(400, {'error': 'Invalid JSON'})
            except Exception as e:
                logger.error(f"Unexpected error in /orchestrate: {e}", exc_info=True)
                self.send_json_response(500, {'error': str(e)})
        else:
            self.send_json_response(404, {'error': 'Not found'})

    def do_GET(self):
        """Handle GET requests"""
        if self.path.startswith('/status/'):
            try:
                session_id = self.path.split('/')[-1]
                logger.info(f"Status request for session_id: {session_id}")
                status = orch.get_status(session_id)

                if status:
                    self.send_json_response(200, status)
                else:
                    logger.warning(f"Session not found: {session_id}")
                    self.send_json_response(404, {'error': 'Session not found'})

            except Exception as e:
                logger.error(f"Unexpected error in /status: {e}", exc_info=True)
                self.send_json_response(500, {'error': str(e)})
        elif self.path == '/health':
            self.send_json_response(200, {'status': 'ok'})
        else:
            self.send_json_response(404, {'error': 'Not found'})

def main():
    port = 8081
    server = HTTPServer(('127.0.0.1', port), OrchestrationHandler)
    logger.info(f"Starting HTTP server on port {port}")
    logger.info(f"Database: {DB_PATH}")
    logger.info(f"Log file: {log_file}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down server")
        server.shutdown()

if __name__ == '__main__':
    main()
