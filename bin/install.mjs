#!/usr/bin/env node
// OpenCode Setup — cross-platform installer.
//
// Copies the automation-recommender skill, the /setup command, and the
// read-only project-scan plugin into your global OpenCode config directory.
//
// Run with:   npx @sunderrrr/opencode-setup
// Or locally: node bin/install.mjs
//
// Override the target with OPENCODE_CONFIG=/path npx @sunderrrr/opencode-setup

import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CONFIG_DIR = process.env.OPENCODE_CONFIG || path.join(os.homedir(), ".config", "opencode")

const SKILL_NAME = "opencode-automation-recommender"

function copyInto(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.cpSync(src, dest, { recursive: true })
}

function main() {
  console.log("╭────────────────────────────╮")
  console.log("│  OpenCode Setup Installer   │")
  console.log("╰────────────────────────────╯\n")
  console.log(`  Target config: ${CONFIG_DIR}\n`)

  const targets = [
    {
      label: "skill",
      src: path.join(PKG_ROOT, "skills", SKILL_NAME),
      dest: path.join(CONFIG_DIR, "skills", SKILL_NAME),
    },
    {
      label: "command",
      src: path.join(PKG_ROOT, "command", "setup.md"),
      dest: path.join(CONFIG_DIR, "command", "setup.md"),
    },
    {
      label: "plugin",
      src: path.join(PKG_ROOT, "plugin", "index.js"),
      dest: path.join(CONFIG_DIR, "plugin", "opencode-setup.js"),
    },
  ]

  for (const t of targets) {
    if (!fs.existsSync(t.src)) {
      console.error(`  ✗ missing source: ${t.src}`)
      process.exitCode = 1
      return
    }
    copyInto(t.src, t.dest)
    console.log(`  ✓ ${t.label.padEnd(8)} → ${t.dest}`)
  }

  warnStaleConfig()

  console.log("\n  Installation complete!\n")
  console.log("  Restart OpenCode, then:")
  console.log("    • type /setup            -> analysis + recommendations")
  console.log('    • or just ask            : "recommend automations for this project"')
  console.log("      (the skill triggers itself)\n")
}

// Non-fatal heads-up: a previous setup may have left a broken command
// reference in opencode.jsonc that prevents OpenCode from starting.
function warnStaleConfig() {
  for (const name of ["opencode.jsonc", "opencode.json"]) {
    const p = path.join(CONFIG_DIR, name)
    if (!fs.existsSync(p)) continue
    let text
    try {
      text = fs.readFileSync(p, "utf8")
    } catch {
      continue
    }
    if (text.includes("opencode-setup/commands/setup.md") || /commands\/setup\.md/.test(text)) {
      console.log(
        `\n  ⚠ ${name} references an old "commands/setup.md" path that no longer exists.\n` +
          `    The /setup command is now auto-discovered from command/setup.md, so you can\n` +
          `    safely remove that stale "command" entry from ${p} if OpenCode fails to start.`,
      )
    }
  }
}

main()
