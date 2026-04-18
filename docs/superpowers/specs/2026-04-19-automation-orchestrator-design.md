# Automation Orchestrator Design
**Date:** 2026-04-19  
**Status:** Approved  
**Approach:** Hybrid (Hooks + MCP Server)

## Success Criteria
Zero interaction workflow: User gõ task → chờ → nhận notification "xong". Có khả năng review sau khi hoàn thành.

## Architecture Overview

### 3-Layer Architecture

**1. Hook Layer** (Claude Code hooks)
- `onUserPromptSubmit`: Detect task type → route to orchestrator
- `PreCompact`: Auto-save state to MemPalace
- `Stop`: Checkpoint + optional auto-commit

**2. Orchestrator Layer** (MCP Server - mở rộng dual-graph)
- HTTP endpoints: `/orchestrate`, `/status`, `/cancel`
- Task classification engine
- Agent spawning logic (parallel/sequential)
- State machine tracking workflow progress

**3. Execution Layer** (Agents + Tools)
- Brainstorm → Plan → Implementation agents
- Playwright for browser testing
- Git operations (commit/push)
- MemPalace for cross-session state

**Data Flow:**
```
User prompt → Hook intercepts → POST /orchestrate → Classify task → Spawn agents → Execute → Notify user
```

## Core Components

### 2.1 MCP Server Extensions
Mở rộng dual-graph hiện tại với:
- `/orchestrate` endpoint: Nhận task → classify → spawn agents
- `/status/{session_id}`: Track progress real-time
- `/cancel/{session_id}`: Stop workflow
- State persistence: SQLite (như dual-graph)

### 2.2 Task Classifier
- Rule-based + keyword matching
- Detect types: feature/bug/refactor/test/docs
- Extract dependencies từ task description
- Output: task type + confidence + suggested workflow

### 2.3 Agent Spawner
- Dependency graph builder (parallel vs sequential)
- Agent pool management (max 3 concurrent)
- Result aggregation từ multiple agents
- Retry logic (max 3 attempts per agent)

### 2.4 Notification System
- Desktop notifications qua PowerShell
- Status updates qua file watching
- Error alerts với actionable suggestions

## Workflow State Machine

### States
1. `IDLE` - Chờ task mới
2. `CLASSIFYING` - Phân tích task type
3. `PLANNING` - Brainstorm + viết plan
4. `EXECUTING` - Spawn agents + run tasks
5. `TESTING` - Auto test (unit + browser)
6. `REVIEWING` - Tự review code
7. `COMMITTING` - Git commit + push
8. `DONE` - Notify user

### Transitions
- User prompt → `CLASSIFYING`
- Classification done → `PLANNING` (complex) hoặc `EXECUTING` (simple)
- Execution done → `TESTING`
- Tests pass → `REVIEWING`
- Review pass → `COMMITTING`
- Commit done → `DONE` → `IDLE`

### Error Handling
- Mỗi state có retry limit (3 lần)
- Fail → rollback + notify user
- User có thể cancel bất cứ lúc nào qua `/cancel`

## Hook Integration Details

### Hook Scripts (PowerShell)

**1. onUserPromptSubmit.ps1**
```powershell
# Parse user prompt → extract task intent
# POST to http://localhost:8080/orchestrate
# Payload: {prompt, cwd, git_status}
# Response: {session_id, workflow_type, estimated_time}
```

**2. PreCompact.ps1** (mở rộng existing)
```powershell
# Save current state to MemPalace
# POST to /status/{session_id} để lấy progress
# Nếu workflow running → pause + save checkpoint
```

**3. Stop.ps1** (mở rộng existing)
```powershell
# Check uncommitted changes
# Nếu workflow completed → auto commit + push
# Cleanup temp files + notify user
```

### Communication Protocol
- Hooks ↔ MCP Server: HTTP REST API (localhost:8080)
- MCP Server ↔ Agents: Claude Code Agent tool
- Notifications: PowerShell `New-BurntToastNotification`

## Integration với Existing Tools

### MemPalace Integration
- Auto-save decisions/facts sau mỗi workflow
- Knowledge graph: task → files → agents → results
- Cross-session learning: patterns từ previous workflows

### Playwright Integration
- Auto browser testing sau UI changes
- Screenshot comparison (visual regression)
- Auto-retry nếu test fail (max 2 lần)

### Git Automation
- Smart commit messages: analyze git diff → generate message
- Auto-push chỉ khi tests pass + review pass
- Branch naming: `auto/{task-type}/{timestamp}`

### Desktop Notifications
- Workflow started: "Đang xử lý: {task_summary}"
- Workflow done: "Hoàn thành: {task_summary} - {duration}"
- Error: "Lỗi: {error_summary} - cần review"

## Implementation Phases

### Phase 1: Core Automation Foundation
- Auto Workflow Engine (hook-based detection)
- Smart Context Management (auto compact + MemPalace)

### Phase 2: Execution Intelligence
- Smart Agent Orchestration (dependency detection)
- Auto Testing & Validation (test gen + browser check)

### Phase 3: Developer Experience
- Git Automation (smart commits + PR)
- Environment Management (dependency detection)

### Phase 4: Advanced Intelligence
- Prompt Optimization Engine (learning patterns)
- Code Intelligence (analysis + security)

### Phase 5: Nice-to-have
- Documentation Auto-gen
- Voice Control (optional)

## Technical Constraints

**Why:** Tận dụng infrastructure hiện có (dual-graph, hooks, MemPalace) để minimize setup overhead.

**How to apply:** 
- Reuse dual-graph SQLite database cho state persistence
- Extend existing hooks thay vì tạo mới
- Use MemPalace cho cross-session learning
- Playwright đã có sẵn cho browser testing

## Non-Goals
- Không support multi-project orchestration (focus single project)
- Không build UI dashboard (notifications đủ)
- Không support voice control trong Phase 1-4
