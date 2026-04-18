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

# Determine data directory
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DATA_DIR, 'workflows.db')

# Initialize orchestrator
orch = WorkflowOrchestrator(DB_PATH)

class OrchestrationHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Override to log to stderr"""
        sys.stderr.write(f"[orchestrator] {format % args}\n")

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

                if not prompt:
                    self.send_json_response(400, {'error': 'Missing prompt field'})
                    return

                session_id = orch.create_workflow(prompt, cwd)
                self.send_json_response(200, {'session_id': session_id})

            except json.JSONDecodeError:
                self.send_json_response(400, {'error': 'Invalid JSON'})
            except Exception as e:
                self.send_json_response(500, {'error': str(e)})
        else:
            self.send_json_response(404, {'error': 'Not found'})

    def do_GET(self):
        """Handle GET requests"""
        if self.path.startswith('/status/'):
            try:
                session_id = self.path.split('/')[-1]
                status = orch.get_status(session_id)

                if status:
                    self.send_json_response(200, status)
                else:
                    self.send_json_response(404, {'error': 'Session not found'})

            except Exception as e:
                self.send_json_response(500, {'error': str(e)})
        elif self.path == '/health':
            self.send_json_response(200, {'status': 'ok'})
        else:
            self.send_json_response(404, {'error': 'Not found'})

def main():
    port = 8081
    server = HTTPServer(('127.0.0.1', port), OrchestrationHandler)
    print(f"[orchestrator] Starting HTTP server on port {port}", file=sys.stderr)
    print(f"[orchestrator] Database: {DB_PATH}", file=sys.stderr)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[orchestrator] Shutting down", file=sys.stderr)
        server.shutdown()

if __name__ == '__main__':
    main()
