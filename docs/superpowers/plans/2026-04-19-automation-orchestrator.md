# Automation Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build zero-interaction automation system với hooks + MCP server orchestration

**Architecture:** Extend dual-graph MCP server với orchestration endpoints, hook scripts để detect tasks, state machine để track workflow

**Tech Stack:** Python (MCP server), PowerShell (hooks), SQLite (state), Claude Code Agent tool

---

### Task 1: MCP Server Orchestration Endpoints

**Files:**
- Create: `.dual-graph/orchestrator.py`
- Modify: `.dual-graph/dual_graph_launch.sh:400-450`
- Test: Manual test với curl

- [ ] **Step 1: Write orchestrator module skeleton**

```python
# .dual-graph/orchestrator.py
import json
import sqlite3
from datetime import datetime
from typing import Dict, Any, Optional

class WorkflowOrchestrator:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS workflows (
                session_id TEXT PRIMARY KEY,
                state TEXT NOT NULL,
                task_type TEXT,
                prompt TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        conn.commit()
        conn.close()
    
    def classify_task(self, prompt: str) -> Dict[str, Any]:
        # Simple keyword-based classification
        prompt_lower = prompt.lower()
        if any(kw in prompt_lower for kw in ['bug', 'fix', 'error', 'broken']):
            return {'type': 'bug', 'confidence': 0.8}
        elif any(kw in prompt_lower for kw in ['add', 'create', 'new', 'feature']):
            return {'type': 'feature', 'confidence': 0.8}
        elif any(kw in prompt_lower for kw in ['refactor', 'clean', 'improve']):
            return {'type': 'refactor', 'confidence': 0.7}
        elif any(kw in prompt_lower for kw in ['test', 'spec']):
            return {'type': 'test', 'confidence': 0.8}
        else:
            return {'type': 'unknown', 'confidence': 0.5}
    
    def create_workflow(self, prompt: str, cwd: str) -> str:
        import uuid
        session_id = str(uuid.uuid4())[:8]
        classification = self.classify_task(prompt)
        
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            INSERT INTO workflows (session_id, state, task_type, prompt, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (session_id, 'CLASSIFYING', classification['type'], prompt, 
              datetime.now().isoformat(), datetime.now().isoformat()))
        conn.commit()
        conn.close()
        
        return session_id
    
    def get_status(self, session_id: str) -> Optional[Dict[str, Any]]:
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            "SELECT state, task_type, created_at FROM workflows WHERE session_id = ?",
            (session_id,)
        )
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return {'state': row[0], 'task_type': row[1], 'created_at': row[2]}
        return None
```

- [ ] **Step 2: Test orchestrator module**

```bash
cd .dual-graph
python3 -c "
from orchestrator import WorkflowOrchestrator
orch = WorkflowOrchestrator('test_workflows.db')
sid = orch.create_workflow('fix bug in login', '/tmp')
print(f'Session: {sid}')
status = orch.get_status(sid)
print(f'Status: {status}')
"
```

Expected: Session ID printed, status shows CLASSIFYING state

- [ ] **Step 3: Add HTTP endpoints to MCP server**

Modify `.dual-graph/dual_graph_launch.sh` để start orchestrator cùng MCP server. Thêm vào sau dòng 450:

```bash
# Start orchestrator HTTP server
python3 -c "
from http.server import HTTPServer, BaseHTTPRequestHandler
from orchestrator import WorkflowOrchestrator
import json

orch = WorkflowOrchestrator('$DATA_DIR/workflows.db')

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/orchestrate':
            length = int(self.headers['Content-Length'])
            body = json.loads(self.rfile.read(length))
            session_id = orch.create_workflow(body['prompt'], body.get('cwd', ''))
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'session_id': session_id}).encode())
        elif self.path.startswith('/status/'):
            session_id = self.path.split('/')[-1]
            status = orch.get_status(session_id)
            self.send_response(200 if status else 404)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(status or {}).encode())

HTTPServer(('127.0.0.1', 8081), Handler).serve_forever()
" &
```

- [ ] **Step 4: Test HTTP endpoints**

```bash
# Test orchestrate endpoint
curl -X POST http://127.0.0.1:8081/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"add new feature","cwd":"/tmp"}'

# Test status endpoint (use session_id from above)
curl http://127.0.0.1:8081/status/abc123
```

Expected: First returns session_id, second returns workflow status

- [ ] **Step 5: Commit**

```bash
git add .dual-graph/orchestrator.py .dual-graph/dual_graph_launch.sh
git commit -m "feat(orchestrator): add MCP server orchestration endpoints"
```

---

### Task 2: Hook Integration - onUserPromptSubmit

**Files:**
- Create: `.claude/hooks/onUserPromptSubmit.ps1`
- Modify: `.claude/settings.local.json`

- [ ] **Step 1: Create onUserPromptSubmit hook**

```powershell
# .claude/hooks/onUserPromptSubmit.ps1
$hookInput = [Console]::In.ReadToEnd()
try {
    $data = $hookInput | ConvertFrom-Json
    $prompt = $data.prompt
    $cwd = Get-Location
    
    # POST to orchestrator
    $body = @{
        prompt = $prompt
        cwd = $cwd.Path
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Method Post `
        -Uri "http://127.0.0.1:8081/orchestrate" `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction SilentlyContinue
    
    if ($response.session_id) {
        Write-Output "[Orchestrator] Session: $($response.session_id)"
    }
} catch {
    # Silent fail - không block user prompt
}
```

- [ ] **Step 2: Register hook trong settings**

Thêm vào `.claude/settings.local.json`:

```json
{
  "hooks": {
    "onUserPromptSubmit": [{
      "hooks": [{
        "type": "command",
        "command": "powershell -NoProfile -File \".claude/hooks/onUserPromptSubmit.ps1\""
      }],
      "matcher": ""
    }],
    "SessionStart": [...existing...],
    "Stop": [...existing...],
    "PreCompact": [...existing...]
  }
}
```

- [ ] **Step 3: Test hook**

```bash
# Restart Claude Code session
# Type any prompt
# Check for "[Orchestrator] Session: xxx" output
```

Expected: Hook fires, session ID appears

- [ ] **Step 4: Commit**

```bash
git add .claude/hooks/onUserPromptSubmit.ps1 .claude/settings.local.json
git commit -m "feat(hooks): add onUserPromptSubmit orchestration hook"
```

---

### Task 3: Desktop Notifications

**Files:**
- Create: `.dual-graph/notifier.py`
- Modify: `.dual-graph/orchestrator.py:50-60`

- [ ] **Step 1: Create notification module**

```python
# .dual-graph/notifier.py
import subprocess
import platform

def send_notification(title: str, message: str):
    if platform.system() == 'Windows':
        # PowerShell toast notification
        ps_script = f"""
        $null = [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]
        $null = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]
        $xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
        $xml.LoadXml(@"
        <toast>
            <visual>
                <binding template='ToastText02'>
                    <text id='1'>{title}</text>
                    <text id='2'>{message}</text>
                </binding>
            </visual>
        </toast>
"@)
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Claude Code').Show($toast)
        """
        subprocess.run(['powershell', '-Command', ps_script], 
                      capture_output=True, timeout=5)
```

- [ ] **Step 2: Integrate vào orchestrator**

Thêm vào `.dual-graph/orchestrator.py`:

```python
from notifier import send_notification

class WorkflowOrchestrator:
    # ... existing code ...
    
    def notify_workflow_start(self, session_id: str, task_type: str):
        send_notification(
            "Automation Started",
            f"Đang xử lý: {task_type} (Session: {session_id})"
        )
    
    def notify_workflow_done(self, session_id: str, duration: str):
        send_notification(
            "Automation Complete",
            f"Hoàn thành trong {duration} (Session: {session_id})"
        )
```

- [ ] **Step 3: Test notifications**

```bash
python3 -c "
from notifier import send_notification
send_notification('Test', 'This is a test notification')
"
```

Expected: Toast notification xuất hiện trên Windows

- [ ] **Step 4: Commit**

```bash
git add .dual-graph/notifier.py .dual-graph/orchestrator.py
git commit -m "feat(notifier): add desktop notification support"
```

---

## Phase 1 Complete

Phase 1 (Core Automation Foundation) đã hoàn thành với:
- MCP server orchestration endpoints
- Hook integration để detect tasks
- Desktop notifications

**Next Steps:**
- Phase 2: Agent spawning logic
- Phase 3: Git automation
- Phase 4: Testing integration
