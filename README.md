# OpenCode Setup

> A reproduction of [`claude-code-setup`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-code-setup) (Anthropic's official plugin), **adapted to [OpenCode](https://opencode.ai)**.
>
> Analyzes your codebase and recommends the most useful OpenCode automations — MCP servers, skills, subagents, commands, and plugins/hooks. It is **read-only**: it recommends, it never modifies your files.

## How it works

Like the original, the core is an **LLM-driven skill** (not a fixed detection script). It follows a 3-phase workflow — scan → map → report — backed by detailed reference files. It surfaces the **top 1-2 automations per category** (or 3-5 if you ask for a specific category).

```
opencode-setup/
├── skills/opencode-automation-recommender/
│   ├── SKILL.md                       # the brain (workflow + decision framework)
│   └── references/
│       ├── mcp-servers.md             # context7, Playwright, Supabase, GitHub…
│       ├── skills-reference.md        # custom skills to create
│       ├── subagents.md               # code-reviewer, security-reviewer…
│       ├── commands.md                # /test, /pr, /review…
│       └── plugins-hooks.md           # format/lint/block via the plugin API
├── command/setup.md                   # the /setup command (trigger)
└── plugin/index.js                    # read-only `project-scan` tool (ESM)
```

### claude-code-setup → OpenCode mapping

| claude-code-setup | OpenCode |
|---|---|
| MCP Servers | `mcp` block in `opencode.jsonc` (`type: local`/`remote`) |
| Skills | `.opencode/skills/<n>/SKILL.md` |
| Subagents | `.opencode/agent/<n>.md` (`mode: subagent`) |
| Slash Commands | `.opencode/command/<n>.md` |
| **Hooks** | OpenCode **plugin API** (`tool.execute.before/after`, `event`) — OpenCode has no separate `hooks` config |

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Sunderrrr/opencode-setup/main/install.sh | bash
```

Installs the skill, the `/setup` command, and the `project-scan` plugin into `~/.config/opencode/`.

## Usage

In OpenCode:

```
/setup
```

or simply, in natural language (the skill triggers itself):

```
recommend automations for this project
help me set up OpenCode for this project
what plugins/hooks should I use?
```

## Requirements

- OpenCode 1.17+
- `curl` (for installation); Node/Bun is provided by OpenCode for the plugin

## License

MIT
