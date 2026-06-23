# Subagent Recommendations (OpenCode)

Subagents are specialized assistants invoked by the primary agent or via `@name`. Define them as markdown files:

- **Project**: `.opencode/agent/<name>.md`
- **Global**: `~/.config/opencode/agent/<name>.md`

The filename becomes the agent id (`security-reviewer.md` → `@security-reviewer`).

## Frontmatter Reference

```yaml
---
description: When and why to use this agent   # required — used for auto-delegation
mode: subagent                                # subagent | primary | all
model: anthropic/claude-sonnet-4-6            # optional override
temperature: 0.2                              # optional
permission:                                   # lock down read-only reviewers
  edit: deny
  bash: ask
tools:                                        # optional allow/deny map
  write: false
---
[System prompt: the agent's role and focus]
```

For read-only reviewers, set `permission.edit: deny` (and often `bash: deny`) so the agent can analyze but never modify the repo.

## Code Review Agents

### code-reviewer
**When**: large codebase (>500 files) or active PR workflow.
```markdown
---
description: Reviews changes for correctness, readability, and maintainability. Use after a feature is implemented or before a PR.
mode: subagent
permission: { edit: deny, bash: deny }
---
You are a senior code reviewer. Review the diff for correctness bugs, unclear naming,
missing error handling, and duplicated logic. Report findings by severity. Do not edit files.
```

### security-reviewer
**When**: auth, payments, crypto, or handling of secrets/PII is present.
```markdown
---
description: Audits code for security vulnerabilities (authn/authz, injection, secrets, SSRF). Use for any auth, payment, or data-handling change.
mode: subagent
permission: { edit: deny, bash: deny }
---
You are a security reviewer. Focus on injection, broken access control, insecure secrets
handling, SSRF, and unsafe deserialization. Cite file:line. Rank by exploitability.
```

### test-writer
**When**: coverage is thin or a test framework is configured.
```markdown
---
description: Writes unit/integration tests matching the project's existing test style. Use when new code lacks tests.
mode: subagent
---
You write tests that mirror existing patterns in the test suite. Cover happy path, edge cases,
and error handling. Match the framework already in use (Vitest/Jest/pytest).
```

## Specialized Agents

### api-documenter
**When**: project exposes HTTP/GraphQL APIs.
```markdown
---
description: Generates OpenAPI documentation from route handlers. Use for API projects.
mode: subagent
permission: { edit: deny }
---
Read route handlers and type definitions, then produce an accurate OpenAPI 3.1 spec. Never invent fields.
```

### performance-analyzer
**When**: hot paths, data pipelines, or perf-sensitive code.
```markdown
---
description: Finds performance bottlenecks (N+1 queries, unnecessary allocations, blocking I/O). Use on perf-critical code.
mode: subagent
permission: { edit: deny }
---
Profile-by-reading: flag N+1 queries, synchronous blocking calls, and avoidable allocations. Suggest concrete fixes.
```

### ui-reviewer
**When**: frontend-heavy projects.
```markdown
---
description: Reviews UI code for accessibility and responsive correctness. Use on frontend changes.
mode: subagent
permission: { edit: deny }
---
Review components for a11y (roles, labels, contrast, keyboard nav) and responsive issues. Cite component:line.
```

## Quick Reference: Detection → Subagent

| Detected signal | Subagent |
|-----------------|----------|
| >500 files / PR workflow | code-reviewer |
| auth / payments / secrets | security-reviewer |
| thin coverage + test framework | test-writer |
| HTTP/GraphQL API | api-documenter |
| perf-critical code / pipelines | performance-analyzer |
| frontend-heavy | ui-reviewer |

## Model & Tool Selection

- **Read-only reviewers** → `permission: { edit: deny }`, optionally `bash: deny`.
- **Cheaper/faster reviews** → set a lighter `model` (e.g. `anthropic/claude-haiku-4-5-20251001`).
- **Deep reasoning** (security, architecture) → keep a strong model (Opus/Sonnet).

**Docs**: https://opencode.ai/docs/agents/
