---
description: Analyze this project and recommend OpenCode automations (MCP servers, skills, subagents, commands, plugins)
---

Use the **opencode-automation-recommender** skill to analyze this project and recommend tailored OpenCode automations.

Follow the skill's read-only workflow:

1. **Scan** — call the `project-scan` tool (from the bundled plugin) if available, otherwise gather signals with bash/glob/grep/read.
2. **Map** — turn detected signals into the top **1-2 recommendations per category**: MCP servers, skills, subagents, commands, plugins/hooks.
3. **Web** — for libraries/frameworks not in the reference files, search the OpenCode docs and ecosystem for relevant servers/tools:
   - https://opencode.ai/docs/mcp-servers/
   - https://opencode.ai/docs/agents/
   - https://opencode.ai/docs/commands/
   - https://opencode.ai/docs/skills/
   - https://opencode.ai/docs/plugins/
4. **Output** — give copy-pasteable config: exact `opencode.jsonc` JSON for MCP servers/commands, and exact file paths + frontmatter for skills/agents/plugins.

This is **read-only** — recommend, don't create files. If the user wants a specific category, give 3-5 options for it instead.

$ARGUMENTS

## Current OpenCode config (if any)

@opencode.jsonc
@opencode.json
