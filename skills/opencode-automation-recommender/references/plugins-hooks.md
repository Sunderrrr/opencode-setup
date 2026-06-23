# Plugins & Hooks (OpenCode)

OpenCode has **no separate `hooks` config** like Claude Code's `.claude/settings.json`. Instead, hook-style automation is implemented through the **plugin API**: a JS/TS module that exports an async function returning event handlers.

## Where plugins live

- **Project**: `.opencode/plugin/<name>.js`
- **Global**: `~/.config/opencode/plugin/<name>.js`
- **NPM package**: list it under `"plugin": ["pkg-name"]` in `opencode.json`

Local `.js`/`.ts` files load automatically at startup. Plugins run in **ESM** — use `import`, not `require`.

## Plugin shape

```js
// .opencode/plugin/example.js
export const Example = async ({ project, directory, worktree, client, $ }) => {
  return {
    // event handlers go here
    "tool.execute.after": async (input, output) => { /* ... */ },
  }
}
```

The plugin function receives:
- `directory` / `worktree` — paths
- `project` — project info
- `client` — OpenCode SDK client
- `$` — Bun shell API for running commands (`await $\`prettier --write ${file}\``)

## Useful events (Claude Code hook → OpenCode hook)

OpenCode's `Hooks` interface exposes a fixed set of handler keys. Tool/permission/command
events are their own keys; everything else (session/file lifecycle) arrives through the
generic **`event`** handler, where you switch on `event.type`.

| Claude Code hook | OpenCode handler |
|------------------|------------------|
| `PreToolUse` (block/guard) | `tool.execute.before(input, output)` — file path in `output.args`; **throw** to block |
| `PostToolUse` (format/lint) | `tool.execute.after(input, output)` — file path in `input.args` |
| permission prompts | `permission.ask(input, output)` |
| command run | `command.execute.before(input, output)` |
| file changed / session idle | generic `event({ event })` → check `event.type` (`"file.edited"`, `"session.idle"`, …) |

---

## Pattern A — Format on edit (PostToolUse → `tool.execute.after`)

**When**: Prettier configured (`.prettierrc`, `prettier` dep).
```js
// .opencode/plugin/format-on-edit.js
export const FormatOnEdit = async ({ $ }) => ({
  // tool.execute.after: input = { tool, sessionID, callID, args }, output = { title, output, metadata }
  "tool.execute.after": async (input) => {
    if (input.tool !== "edit" && input.tool !== "write") return
    const file = input.args?.filePath
    if (file && /\.(t|j)sx?$/.test(file)) {
      await $`npx prettier --write ${file}`.quiet().nothrow()
    }
  },
})
```

## Pattern B — Lint on edit

**When**: ESLint or Ruff configured.
```js
// .opencode/plugin/lint-on-edit.js
export const LintOnEdit = async ({ $ }) => ({
  "tool.execute.after": async (input) => {
    if (!["edit", "write"].includes(input.tool)) return
    const file = input.args?.filePath
    if (file?.endsWith(".py")) await $`ruff check --fix ${file}`.quiet().nothrow()
    else if (/\.(t|j)sx?$/.test(file ?? "")) await $`npx eslint --fix ${file}`.quiet().nothrow()
  },
})
```

## Pattern C — Block sensitive-file edits (PreToolUse → `tool.execute.before`)

**When**: `.env` files or lockfiles present. Throw to abort the tool call.
```js
// .opencode/plugin/block-sensitive-edits.js
const BLOCKED = [/(^|\/)\.env(\.|$)/, /(package-lock\.json|pnpm-lock\.yaml|bun\.lock|yarn\.lock)$/]
export const BlockSensitiveEdits = async () => ({
  "tool.execute.before": async (input, output) => {
    if (!["edit", "write"].includes(input.tool)) return
    const file = output?.args?.filePath ?? ""
    if (BLOCKED.some((re) => re.test(file))) {
      throw new Error(`Editing ${file} is blocked by block-sensitive-edits plugin`)
    }
  },
})
```

## Pattern D — Type-check on idle (generic `event` handler)

**When**: TypeScript project — run a background check when the session goes idle.
`session.idle` is **not** a top-level hook key; it arrives through the generic `event`
handler, where you switch on `event.type`.
```js
// .opencode/plugin/typecheck-on-idle.js
export const TypecheckOnIdle = async ({ $, client }) => ({
  event: async ({ event }) => {
    if (event.type !== "session.idle") return
    const res = await $`npx tsc --noEmit`.quiet().nothrow()
    if (res.exitCode !== 0) {
      await client.tui?.showToast?.({ message: "tsc errors — run /typecheck", variant: "warning" })
    }
  },
})
```

> Event payload shapes can vary by OpenCode version. When unsure, log the `event` once and
> inspect, or check https://opencode.ai/docs/plugins/. Use `.nothrow()` on `$` so a failing
> formatter never breaks the session.

## Quick Reference: Detection → Plugin/Hook

| Detected signal | Plugin (event) |
|-----------------|----------------|
| Prettier config | format-on-edit (`tool.execute.after`) |
| ESLint / Ruff config | lint-on-edit (`tool.execute.after`) |
| `.env` / lockfiles | block-sensitive-edits (`tool.execute.before`) |
| `tsconfig.json` | typecheck-on-idle (generic `event` → `session.idle`) |
| test framework | test-on-idle (generic `event` → `session.idle`) |

## Custom tools via plugins

Plugins can also register **custom tools** (callable by the agent), not just event hooks:
```js
import { tool } from "@opencode-ai/plugin"
export const MyTools = async () => ({
  tool: {
    "project-scan": tool({
      description: "Scan the project and report detected stack signals",
      args: { path: tool.schema.string().optional() },
      async execute(args, ctx) { /* read-only detection */ return "..." },
    }),
  },
})
```
The bundled `plugin/index.js` in this repo uses exactly this pattern to expose a read-only `project-scan` tool the recommender skill can call.

**Docs**: https://opencode.ai/docs/plugins/
