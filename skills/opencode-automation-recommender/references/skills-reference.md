# Skills Recommendations (OpenCode)

Skills package expertise, workflows, and repeatable tasks. OpenCode discovers `SKILL.md` files in:

- **Project**: `.opencode/skills/<name>/SKILL.md` (also reads `.claude/skills/`, `.agents/skills/`)
- **Global**: `~/.config/opencode/skills/<name>/SKILL.md` (also `~/.claude/skills/`)

The agent invokes a skill through the built-in `skill` tool; the user can trigger one with `/skill-name`.

## Skill Structure

```
.opencode/skills/<name>/
├── SKILL.md            # required: frontmatter + instructions
├── references/         # optional: deep-dive docs the skill reads on demand
└── scripts/            # optional: helper scripts the skill can run
```

## Frontmatter Reference

```yaml
---
name: skill-name          # required, 1-64 chars, lowercase + single hyphens, MUST match folder name
description: When to use this skill and what it does   # required, 1-1024 chars — this is what the model matches on
---
```

Keep `description` action-oriented: state **what it does** and **when to use it**. That string is the only thing the model sees when deciding to invoke the skill.

## Custom Project Skills to Recommend

Map the codebase to a skill worth creating (the recommender suggests these; it does not build them):

| Codebase signal | Skill to create | Purpose |
|-----------------|-----------------|---------|
| API routes / OpenAPI | **api-doc** | Generate/update endpoint docs from a template |
| Migrations dir | **create-migration** | Scaffold + validate a DB migration |
| Test suite | **gen-test** | Generate tests from existing examples |
| Component library | **new-component** | Scaffold a component from project templates |
| Release process | **release-notes** | Build notes from git history |
| Strong code style | **project-conventions** | Background rules the model applies automatically |
| Onboarding scripts | **setup-dev** | Walk through env setup / prereqs |

## Example: API documentation skill

`.opencode/skills/api-doc/SKILL.md`
```markdown
---
name: api-doc
description: Generate or update OpenAPI documentation for HTTP endpoints. Use when the user adds or changes an API route, or asks to document the API.
---

# API Doc Generator

1. Locate route handlers (search `app/api`, `src/routes`, `routes/`).
2. For each endpoint capture method, path, params, request/response shapes.
3. Emit/merge an OpenAPI 3.1 fragment following @references/openapi-template.yaml.
4. Never invent fields — read the actual handler and types.
```

## Example: project-conventions (model-invoked background skill)

`.opencode/skills/project-conventions/SKILL.md`
```markdown
---
name: project-conventions
description: Apply this project's coding conventions (naming, imports, error handling). Use automatically whenever writing or editing code in this repo.
---

# Project Conventions
- Use named exports; no default exports.
- Imports ordered: node builtins, external, internal (`@/`).
- All async I/O wrapped in the `Result<T>` helper from `src/lib/result.ts`.
```

## Quick Reference: Detection → Skill

| Detected | Recommend skill |
|----------|-----------------|
| `app/api` or `openapi*` | api-doc |
| `migrations/` | create-migration |
| `__tests__/` / `*.test.*` | gen-test |
| `components/` library | new-component |
| Tagged releases | release-notes |
| ESLint/Prettier with strict rules | project-conventions |

**Docs**: https://opencode.ai/docs/skills/
