// OpenCode Setup — read-only project scanner.
//
// Exposes a `project-scan` tool that the `opencode-automation-recommender`
// skill can call to quickly gather stack signals. It is intentionally
// READ-ONLY: it detects and reports, it never writes config. The actual
// recommendations are produced by the skill (LLM-driven), mirroring how
// Anthropic's claude-code-setup works.
//
// ESM only (OpenCode loads plugins as ES modules).
import { tool } from "@opencode-ai/plugin"
import fs from "node:fs"
import path from "node:path"

// signal -> filename patterns that indicate it (supports * glob)
const DETECTORS = {
  react: ["package.json"],
  nextjs: ["next.config.js", "next.config.mjs", "next.config.ts"],
  vue: ["vue.config.js", "nuxt.config.ts"],
  svelte: ["svelte.config.js"],
  node: ["package.json"],
  python: ["pyproject.toml", "requirements.txt", "setup.py"],
  rust: ["Cargo.toml"],
  go: ["go.mod"],
  php: ["composer.json"],
  ruby: ["Gemfile"],
  docker: ["Dockerfile", "docker-compose.yml", "compose.yml"],
  terraform: ["*.tf"],
  cloudflare: ["wrangler.toml"],
  prettier: [".prettierrc", ".prettierrc.json", "prettier.config.js"],
  eslint: [".eslintrc", ".eslintrc.json", ".eslintrc.js", "eslint.config.js"],
  ruff: ["ruff.toml", ".ruff.toml"],
  typescript: ["tsconfig.json"],
  playwright: ["playwright.config.ts", "playwright.config.js"],
  github: [".github"],
  env: [".env"],
}

// package.json dependency -> human-readable signal for MCP recommendations
const DEP_SIGNALS = {
  react: "React (→ context7, Playwright MCP)",
  next: "Next.js (→ context7, Playwright MCP)",
  vue: "Vue (→ context7, Playwright MCP)",
  svelte: "Svelte (→ context7, Playwright MCP)",
  "@supabase/supabase-js": "Supabase (→ Supabase MCP)",
  convex: "Convex (→ Convex MCP)",
  pg: "PostgreSQL (→ Postgres MCP)",
  prisma: "Prisma (→ Database MCP / context7)",
  drizzle: "Drizzle ORM (→ Database MCP)",
  stripe: "Stripe (→ context7, security-reviewer subagent)",
  "@sentry/node": "Sentry (→ Sentry MCP)",
  "@sentry/react": "Sentry (→ Sentry MCP)",
  express: "Express (→ context7)",
  fastify: "Fastify (→ context7)",
}

function globMatch(pattern, entries) {
  if (!pattern.includes("*")) return entries.includes(pattern) ? [pattern] : []
  const re = new RegExp("^" + pattern.replace(/[.]/g, "\\.").replace(/\*/g, ".*") + "$")
  return entries.filter((e) => re.test(e))
}

function detectStack(root) {
  if (!fs.existsSync(root)) return { project: path.basename(root), signals: [], deps: [], error: "path not found" }
  let entries
  try {
    entries = fs.readdirSync(root)
  } catch (e) {
    return { project: path.basename(root), signals: [], deps: [], error: e.message }
  }

  const signals = []
  for (const [signal, patterns] of Object.entries(DETECTORS)) {
    for (const p of patterns) {
      if (globMatch(p, entries).length) {
        signals.push(signal)
        break
      }
    }
  }

  // Inspect package.json dependencies for MCP-relevant libraries
  const deps = []
  const pkgPath = path.join(root, "package.json")
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
      const all = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
      for (const dep of Object.keys(all)) {
        if (DEP_SIGNALS[dep]) deps.push(DEP_SIGNALS[dep])
      }
    } catch {
      /* ignore unparsable package.json */
    }
  }

  // Package manager
  let pm = null
  if (entries.includes("bun.lock") || entries.includes("bun.lockb")) pm = "bun"
  else if (entries.includes("pnpm-lock.yaml")) pm = "pnpm"
  else if (entries.includes("yarn.lock")) pm = "yarn"
  else if (entries.includes("package-lock.json")) pm = "npm"

  const hasOpencodeConfig =
    entries.includes("opencode.json") || entries.includes("opencode.jsonc") || entries.includes(".opencode")
  const hasAgentsMd = entries.includes("AGENTS.md") || entries.includes("CLAUDE.md")

  return {
    project: path.basename(root),
    path: root,
    signals,
    deps: [...new Set(deps)],
    packageManager: pm,
    hasOpencodeConfig,
    hasAgentsMd,
  }
}

function render(scan) {
  let out = `## project-scan — ${scan.project}\n\n`
  if (scan.error) return out + `⚠️ ${scan.error}\n`
  if (!scan.signals.length && !scan.deps.length) return out + "No recognizable stack signals found.\n"

  out += "**Detected signals:** " + (scan.signals.join(", ") || "—") + "\n\n"
  if (scan.packageManager) out += `**Package manager:** ${scan.packageManager}\n\n`
  if (scan.deps.length) {
    out += "**Library signals (for MCP/agent recs):**\n"
    for (const d of scan.deps) out += `- ${d}\n`
    out += "\n"
  }
  out += `**OpenCode config present:** ${scan.hasOpencodeConfig ? "yes" : "no"}\n`
  out += `**AGENTS.md / CLAUDE.md present:** ${scan.hasAgentsMd ? "yes" : "no — suggest running /init"}\n\n`
  out += "_Now apply the opencode-automation-recommender skill: map these signals to 1-2 recommendations per category (MCP / Skills / Subagents / Commands / Plugins-Hooks)._\n"
  return out
}

export const OpenCodeSetup = async ({ directory }) => {
  return {
    tool: {
      "project-scan": tool({
        description:
          "Read-only scan of a project directory: reports detected stack, package manager, and library signals " +
          "used by the opencode-automation-recommender skill to suggest MCP servers, skills, subagents, commands, and plugins. Does not modify files.",
        args: {
          path: tool.schema
            .string()
            .optional()
            .describe("Project path to scan (defaults to the current directory)"),
        },
        // OpenCode's ToolResult is a string (or { output, metadata }) — return text directly.
        async execute(args, context) {
          const target = args.path || context?.directory || directory || process.cwd()
          return render(detectStack(path.resolve(target)))
        },
      }),
    },
  }
}

export default OpenCodeSetup
