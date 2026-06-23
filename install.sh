#!/usr/bin/env bash
set -euo pipefail

# OpenCode Setup installer — installs the automation-recommender skill,
# the /setup command, and the read-only project-scan plugin into your
# global OpenCode config (~/.config/opencode).

OPENCODE_CONFIG="${OPENCODE_CONFIG:-$HOME/.config/opencode}"
SKILLS_DIR="${OPENCODE_CONFIG}/skills/opencode-automation-recommender"
COMMAND_DIR="${OPENCODE_CONFIG}/command"
PLUGIN_DIR="${OPENCODE_CONFIG}/plugin"

REPO="${REPO:-Sunderrrr/opencode-setup}"
BRANCH="${BRANCH:-main}"
RAW="https://raw.githubusercontent.com/${REPO}/${BRANCH}"

echo "╭────────────────────────────╮"
echo "│  OpenCode Setup Installer  │"
echo "╰────────────────────────────╯"
echo ""

fetch() { curl -fsSL "$1" -o "$2"; echo "  ✓ $2"; }

# 1. Skill + reference files
echo "→ Installing skill (opencode-automation-recommender)..."
mkdir -p "${SKILLS_DIR}/references"
fetch "${RAW}/skills/opencode-automation-recommender/SKILL.md" "${SKILLS_DIR}/SKILL.md"
for ref in mcp-servers skills-reference subagents commands plugins-hooks; do
  fetch "${RAW}/skills/opencode-automation-recommender/references/${ref}.md" "${SKILLS_DIR}/references/${ref}.md"
done

# 2. /setup command
echo "→ Installing /setup command..."
mkdir -p "${COMMAND_DIR}"
fetch "${RAW}/command/setup.md" "${COMMAND_DIR}/setup.md"

# 3. project-scan plugin (read-only)
echo "→ Installing project-scan plugin..."
mkdir -p "${PLUGIN_DIR}"
fetch "${RAW}/plugin/index.js" "${PLUGIN_DIR}/opencode-setup.js"

echo ""
echo "  Installation terminée !"
echo "  Skill   : ${SKILLS_DIR}/SKILL.md"
echo "  Command : ${COMMAND_DIR}/setup.md"
echo "  Plugin  : ${PLUGIN_DIR}/opencode-setup.js"
echo ""
echo "  Redémarre OpenCode, puis :"
echo "    • tape /setup            → analyse + recommandations"
echo "    • ou demande simplement  : « recommend automations for this project »"
echo "      (le skill se déclenche tout seul)"
echo ""
