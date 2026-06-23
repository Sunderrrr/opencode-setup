#!/usr/bin/env bash
set -euo pipefail

OPENCODE_CONFIG="${OPENCODE_CONFIG:-$HOME/.config/opencode}"
PLUGINS_DIR="${OPENCODE_CONFIG}/plugins"
COMMANDS_DIR="${OPENCODE_CONFIG}/commands"

echo "╭────────────────────────────╮"
echo "│  OpenCode Setup Installer  │"
echo "╰────────────────────────────╯"
echo ""

REPO="${REPO:-Sunderrrr/opencode-setup}"
BRANCH="${BRANCH:-main}"
RAW="https://raw.githubusercontent.com/$REPO/$BRANCH"

# 1. Install plugin (auto-loaded by OpenCode from ~/.config/opencode/plugins/)
echo "→ Installing plugin..."
mkdir -p "$PLUGINS_DIR"
curl -fsSL "$RAW/plugin/index.js" -o "$PLUGINS_DIR/opencode-setup.js"
echo "  ✓ $PLUGINS_DIR/opencode-setup.js"

# 2. Install /setup command
echo "→ Installing /setup command..."
mkdir -p "$COMMANDS_DIR"
curl -fsSL "$RAW/commands/setup.md" -o "$COMMANDS_DIR/setup.md"
echo "  ✓ $COMMANDS_DIR/setup.md"

# 3. Add /setup command to opencode.jsonc
CONFIG_FILE="${OPENCODE_CONFIG}/opencode.jsonc"
if [ -f "$CONFIG_FILE" ]; then
  python3 -c "
import json
config = json.load(open('$CONFIG_FILE'))
if 'command' not in config:
    config['command'] = {}
if 'setup' not in config['command']:
    config['command']['setup'] = {
        'description': 'Analyze project and recommend tools, MCP servers, skills'
    }
json.dump(config, open('$CONFIG_FILE', 'w'), indent=2)
print('  ✓ Config updated')
"
else
  cat > "$CONFIG_FILE" << JSON
{
  "\$schema": "https://opencode.ai/config.json",
  "command": {
    "setup": {
      "description": "Analyze project and recommend tools, MCP servers, skills"
    }
  }
}
JSON
  echo "  ✓ Config created"
fi

echo ""
echo "╰────────────────────────────╯"
echo ""
echo "  Installation terminée !"
echo "  Redémarre OpenCode, puis :"
echo "    - Tape /setup  (analyse + recommandations)"
echo "    - Ou utilise l'outil 'opencode-setup' dans le chat"
echo ""
echo "  Le plugin est auto-détecté dans ~/.config/opencode/plugins/"
echo "╰────────────────────────────╯"
