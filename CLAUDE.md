<!-- dgc-policy-v11 -->
# Dual-Graph Context Policy

This project uses a local dual-graph MCP server for efficient context retrieval.

## 🇻🇳 NGÔN NGỮ / LANGUAGE

**BẮT BUỘC: Sử dụng 100% tiếng Việt trong toàn bộ giao tiếp.**

- **Tất cả phản hồi** phải bằng tiếng Việt
- **Thinking/reasoning** phải bằng tiếng Việt
- **Giải thích code** phải bằng tiếng Việt
- **Commit messages** phải bằng tiếng Việt
- **Comments trong code** (nếu cần) phải bằng tiếng Việt
- **Error messages và logs** giữ nguyên tiếng Anh (technical)
- **Code identifiers** (tên biến, hàm, class) giữ nguyên tiếng Anh

**Ngoại lệ duy nhất:** Thuật ngữ kỹ thuật không có bản dịch chuẩn (API, endpoint, hook, middleware, etc.) có thể giữ nguyên tiếng Anh.

## 🚀 AUTONOMOUS OPERATION MODE

**CRITICAL: This project is configured for fully autonomous operation.**

- **NO token limits** - Use as many tokens as needed to complete tasks thoroughly
- **NO permission prompts** - All tools are pre-approved via settings.local.json
- **NO asking for confirmation** - Make decisions and execute autonomously
- **YES to deep exploration** - Read multiple files, spawn subagents, use all available tools
- **YES to comprehensive solutions** - Don't cut corners to save tokens

**When running in /loop mode:**
- Work through tasks systematically without waiting for user input
- Make reasonable assumptions when requirements are ambiguous
- Document decisions in context-store.json for user review later
- Use MemPalace to save important findings across loop iterations
- Prioritize completing work over conserving resources

**Decision-making autonomy:**
- Choose appropriate approaches without asking (refactor vs patch, library selection, architecture decisions)
- Fix bugs and issues you discover proactively
- Improve code quality opportunistically (but don't over-engineer)
- Create comprehensive tests and documentation
- Commit work in logical chunks with clear messages

## MANDATORY: Adaptive graph_continue rule

**Call `graph_continue` ONLY when you do NOT already know the relevant files.**

### Call `graph_continue` when:
- This is the first message of a new task / conversation
- The task shifts to a completely different area of the codebase
- You need files you haven't read yet in this session

### SKIP `graph_continue` when:
- You already identified the relevant files earlier in this conversation
- You are doing follow-up work on files already read (verify, refactor, test, docs, cleanup, commit)
- The task is pure text (writing a commit message, summarising, explaining)

**If skipping, go directly to `graph_read` on the already-known `file::symbol`.**

## When you DO call graph_continue

1. **If `graph_continue` returns `needs_project=true`**: call `graph_scan` with `pwd`. Do NOT ask the user.

2. **If `graph_continue` returns `skip=true`**: fewer than 5 files  - read only specifically named files.

3. **Read `recommended_files`** using `graph_read`.
   - Always use `file::symbol` notation (e.g. `src/auth.ts::handleLogin`)  - never read whole files.
   - `recommended_files` entries that already contain `::` must be passed verbatim.

4. **Obey confidence caps:**
   - `confidence=high` -> Stop. Do NOT grep or explore further.
   - `confidence=medium` -> `fallback_rg` at most `max_supplementary_greps` times, then `graph_read` at most `max_supplementary_files` more symbols. Stop.
   - `confidence=low` -> same as medium. Stop.

## Session State (compact, update after every turn)

Maintain a short JSON block in your working memory. Update it after each turn:

```json
{
  "files_identified": ["path/to/file.py"],
  "symbols_changed": ["module::function"],
  "fix_applied": true,
  "features_added": ["description"],
  "open_issues": ["one-line note"]
}
```

Use this state  - not prose summaries  - to remember what's been done across turns.

## Token Usage

A `token-counter` MCP is available for tracking live token usage.

- Before reading a large file: `count_tokens({text: "<content>"})` to check cost first.
- To show running session cost: `get_session_stats()`
- To log completed task: `log_usage({input_tokens: N, output_tokens: N, description: "task"})`

## Rules

- Do NOT use `rg`, `grep`, or bash file exploration before calling `graph_continue` (when required).
- Do NOT do broad/recursive exploration at any confidence level.
- `max_supplementary_greps` and `max_supplementary_files` are hard caps  - never exceed them.
- Do NOT call `graph_continue` more than once per turn.
- Always use `file::symbol` notation with `graph_read`  - never bare filenames.
- After edits, call `graph_register_edit` with changed files using `file::symbol` notation.

## Context Store

Whenever you make a decision, identify a task, note a next step, fact, or blocker during a conversation, append it to `.dual-graph/context-store.json`.

**Entry format:**
```json
{"type": "decision|task|next|fact|blocker", "content": "one sentence max 15 words", "tags": ["topic"], "files": ["relevant/file.ts"], "date": "YYYY-MM-DD"}
```

**To append:** Read the file -> add the new entry to the array -> Write it back -> call `graph_register_edit` on `.dual-graph/context-store.json`.

**Rules:**
- Only log things worth remembering across sessions (not every minor detail)
- `content` must be under 15 words
- `files` lists the files this decision/task relates to (can be empty)
- Log immediately when the item arises  - not at session end

## Session End

When the user signals they are done (e.g. "bye", "done", "wrap up", "end session"), proactively update `CONTEXT.md` in the project root with:
- **Current Task**: one sentence on what was being worked on
- **Key Decisions**: bullet list, max 3 items
- **Next Steps**: bullet list, max 3 items

Keep `CONTEXT.md` under 20 lines total. Do NOT summarize the full conversation  - only what's needed to resume next session.
