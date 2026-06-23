---
name: opencode-automation-recommender
description: Analyze a codebase and recommend OpenCode automations (MCP servers, skills, subagents, commands, plugins/hooks). Use when the user asks for automation recommendations, wants to set up or optimize OpenCode for a project, mentions improving their OpenCode workflow, or asks what OpenCode features they should use.
---

# OpenCode Automation Recommender

Analyze codebase patterns to recommend tailored OpenCode automations across all extensibility options.

**This skill is read-only.** It analyzes the codebase and outputs recommendations. It does NOT create or modify any files. Users implement the recommendations themselves or ask separately for help building them.

## Output Guidelines

- **Recommend 1-2 of each type**: Don't overwhelm — surface the top 1-2 most valuable automations per category.
- **If the user asks for a specific type**: Focus only on that type and provide more options (3-5 recommendations).
- **Go beyond the reference lists**: The reference files contain common patterns, but use web search to find recommendations specific to the codebase's tools, frameworks, and libraries.
- **Always give copy-pasteable config**: For MCP servers and commands, output the exact JSON to paste into `opencode.jsonc`. For skills/agents, output the exact file path and frontmatter.
- **Tell users they can ask for more**: End by noting they can request more recommendations for any specific category.

## Automation Types Overview

| Type | Best For | Where it lives in OpenCode |
|------|----------|----------------------------|
| **MCP Servers** | External tool integrations (databases, APIs, browsers, docs) | `mcp` block in `opencode.jsonc` |
| **Skills** | Packaged expertise, workflows, repeatable tasks | `.opencode/skills/<name>/SKILL.md` |
| **Subagents** | Specialized reviewers/analyzers invoked in parallel | `.opencode/agent/<name>.md` |
| **Commands** | Quick slash workflows (`/test`, `/pr`) | `.opencode/command/<name>.md` |
| **Plugins / Hooks** | Automatic actions on tool/file events (format, lint, block edits) | `.opencode/plugin/<name>.js` |

> Note: OpenCode has no separate "hooks" config like Claude Code. Hook-style automation is implemented through the **plugin API** (event handlers such as `tool.execute.before`, `tool.execute.after`, `file.edited`). See `references/plugins-hooks.md`.

## Workflow

### Phase 1: Codebase Analysis

Gather project context (read-only). You may call the `project-scan` tool from the bundled plugin if available, otherwise use `bash`/`glob`/`grep`/`read`:

```bash
# Detect project type and tooling
ls -la package.json pyproject.toml Cargo.toml go.mod pom.xml composer.json Gemfile 2>/dev/null
cat package.json 2>/dev/null | head -50

# Check dependencies that inform MCP recommendations
cat package.json 2>/dev/null | grep -E '"(react|vue|angular|next|svelte|express|fastapi|django|prisma|supabase|convex|drizzle|stripe|@sentry)"'

# Existing OpenCode config
ls -la opencode.json opencode.jsonc .opencode/ AGENTS.md CLAUDE.md 2>/dev/null

# Project structure
ls -la src/ app/ lib/ tests/ components/ pages/ api/ 2>/dev/null
```

**Key indicators to capture:**

| Category | What to look for | Informs recommendations for |
|----------|------------------|----------------------------|
| Language / Framework | package.json, pyproject.toml, import patterns | MCP servers, plugins |
| Frontend stack | React, Vue, Angular, Next.js, Svelte | Playwright MCP, frontend agents |
| Backend stack | Express, FastAPI, Django | API docs MCP/commands |
| Database | Prisma, Drizzle, Supabase, Convex, raw SQL | Database MCP servers |
| External APIs | Stripe, OpenAI, AWS, Sentry SDKs | context7 MCP, Sentry MCP |
| Testing | Jest, Vitest, pytest, Playwright configs | Test plugins, test-writer agent |
| CI/CD | GitHub Actions, GitLab CI | GitHub/GitLab MCP server |
| Issue tracking | Linear, Jira references | Issue tracker MCP |
| Linters/Formatters | Prettier, ESLint, Ruff, gofmt configs | Format/lint plugins |

### Phase 2: Generate Recommendations

Map detected signals to recommendations. Consult the reference files for exact configs:

- **MCP servers** → `references/mcp-servers.md`
- **Skills** → `references/skills-reference.md`
- **Subagents** → `references/subagents.md`
- **Commands** → `references/commands.md`
- **Plugins / hooks** → `references/plugins-hooks.md`

Quick decision matrix:

| Codebase signal | Recommendation | Type |
|-----------------|----------------|------|
| Uses popular libs (React, Express…) | **context7** — live docs lookup | MCP |
| Frontend with UI testing | **Playwright MCP** | MCP |
| Supabase / Convex / Postgres | matching **Database MCP** | MCP |
| GitHub repo | **GitHub MCP** | MCP |
| Sentry SDK | **Sentry MCP** (remote, OAuth) | MCP |
| Prettier configured | **format-on-edit** plugin (`tool.execute.after`) | Plugin/hook |
| ESLint / Ruff configured | **lint-on-edit** plugin | Plugin/hook |
| `.env` present | **block-sensitive-edits** plugin (`tool.execute.before`) | Plugin/hook |
| Auth / payments code | **security-reviewer** subagent | Subagent |
| Large codebase (>500 files) | **code-reviewer** subagent | Subagent |
| API routes | **/api-doc** command, **api-documenter** subagent | Command/Subagent |
| Test suite present | **/test** command, **test-writer** subagent | Command/Subagent |
| Repeated project workflow | custom **skill** | Skill |

### Phase 3: Output Recommendations Report

Format clearly. **Only include 1-2 recommendations per category** — the most valuable for this specific codebase. Skip irrelevant categories.

````markdown
## OpenCode Automation Recommendations

I analyzed your codebase. Here are my top 1-2 recommendations per category.

### Codebase Profile
- **Type**: [detected language/runtime]
- **Framework**: [detected framework]
- **Key Libraries**: [relevant libraries detected]

---

### 🔌 MCP Servers

#### context7
**Why**: [specific reason based on detected libraries]
**Add to `opencode.jsonc`**:
```json
{
  "mcp": {
    "context7": {
      "type": "local",
      "command": ["npx", "-y", "@upstash/context7-mcp"],
      "enabled": true
    }
  }
}
```

---

### 🎯 Skills

#### [skill-name]
**Why**: [specific reason]
**Create**: `.opencode/skills/[name]/SKILL.md`
```yaml
---
name: [skill-name]
description: [what it does and when to use it]
---
```

---

### 🤖 Subagents

#### [agent-name]
**Why**: [specific reason]
**Create**: `.opencode/agent/[name].md`
```yaml
---
description: [purpose]
mode: subagent
permission:
  edit: deny
---
```

---

### ⌨️ Commands

#### /[command-name]
**Why**: [specific reason]
**Create**: `.opencode/command/[name].md`

---

### 🪝 Plugins / Hooks

#### [plugin-name]
**Why**: [specific reason based on detected config]
**Create**: `.opencode/plugin/[name].js` (event: `tool.execute.after`)

---

**Want more?** Ask for additional recommendations for any specific category (e.g. "show me more MCP options" or "what plugins would help?").

**Want help implementing any of these?** Just ask and I can set up any recommendation above.
````

## Decision Framework

### When to recommend MCP servers
External service integration (databases, APIs), documentation lookup for libraries/SDKs, browser automation/testing, team tooling (GitHub, Linear, Slack), cloud infrastructure.

### When to recommend Skills
Frequently repeated prompts or workflows, project-specific tasks, applying templates/scripts, background expertise. Skills can be invoked by the model automatically or by the user via `/skill-name`.

### When to recommend Subagents
Specialized expertise (security, performance), parallel review workflows, background quality checks. Set `mode: subagent` and restrict permissions (`edit: deny`, `bash: deny`) for read-only reviewers.

### When to recommend Commands
Quick repeatable workflows triggered with `/name`. Commands can embed shell output with `` !`cmd` ``, file refs with `@path`, and arguments with `$ARGUMENTS` / `$1`.

### When to recommend Plugins / Hooks
Repetitive post-edit actions (format, lint, type-check), protection rules (block `.env`/lockfile edits), validation on tool events. Implemented as JS event handlers — see `references/plugins-hooks.md`.

## Configuration Tips

- **Team sharing**: Commit `opencode.json` / `.opencode/` into the repo so the whole team gets the same MCP servers, agents, and commands.
- **Global vs project**: Global config lives in `~/.config/opencode/`; project config in `./.opencode/` and `./opencode.jsonc`. Project overrides global.
- **AGENTS.md**: If the project has no `AGENTS.md`, recommend running `/init` to generate project rules OpenCode reads on every session.
