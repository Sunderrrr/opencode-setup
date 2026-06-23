# Command Recommendations (OpenCode)

Custom slash commands are markdown files. The filename becomes the command name (`test.md` → `/test`).

- **Project**: `.opencode/command/<name>.md`
- **Global**: `~/.config/opencode/command/<name>.md`

You can also define commands inline in `opencode.jsonc` under a `command` block, but files are preferred for anything non-trivial.

## Format

```markdown
---
description: Short text shown in the TUI
agent: build            # optional: which agent runs it
model: anthropic/claude-sonnet-4-6   # optional override
---
The prompt template the command sends.
```

### Placeholders
- `$ARGUMENTS` — everything typed after the command. `$1`, `$2`, … for positional args.
- `` !`shell command` `` — injects the command's stdout into the prompt at run time.
- `@path/to/file` — inlines a file's contents.

## High-Value Commands by Signal

### /test — run the suite
**When**: any project with tests.
```markdown
---
description: Run the test suite and summarize failures
---
Run the project's tests and fix or explain any failures.

Test output:
!`npm test 2>&1 | tail -40`
```

### /pr — prepare a pull request
**When**: GitHub/GitLab workflow.
```markdown
---
description: Summarize staged changes into a PR title + description
---
Write a PR title and description for these changes.

Diff:
!`git diff --staged --stat && git diff --staged | head -300`
```

### /explain — explain a file or symbol
**When**: large/unfamiliar codebase.
```markdown
---
description: Explain how a file or feature works
agent: plan
---
Explain @$1 — its responsibility, key functions, and how it connects to the rest of the system.
```

### /api-doc — document an endpoint
**When**: API project.
```markdown
---
description: Document an API route
---
Generate OpenAPI docs for the endpoint in @$1. Read the handler and types; do not invent fields.
```

### /review — local diff review
**When**: any project; pairs well with the `code-reviewer` subagent.
```markdown
---
description: Review the current working-tree changes
agent: code-reviewer
---
Review the current diff for correctness bugs and cleanups.

!`git diff | head -400`
```

## Quick Reference: Detection → Command

| Detected | Command |
|----------|---------|
| test framework | /test |
| git + remote | /pr, /review |
| large codebase | /explain |
| API routes | /api-doc |
| release tags | /release-notes |

**Docs**: https://opencode.ai/docs/commands/
