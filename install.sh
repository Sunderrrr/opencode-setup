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

# 1. Install plugin
echo "→ Installing plugin..."
mkdir -p "$PLUGINS_DIR"
curl -fsSL "$RAW/plugin/index.js" -o "$PLUGINS_DIR/opencode-setup.js"
echo "  ✓ Plugin installed → $PLUGINS_DIR/opencode-setup.js"

# 2. Install /setup command
echo "→ Installing /setup command..."
mkdir -p "$COMMANDS_DIR"
curl -fsSL "$RAW/commands/setup.md" -o "$COMMANDS_DIR/setup.md"
echo "  ✓ Command installed → $COMMANDS_DIR/setup.md"

# 3. Add plugin to opencode.jsonc
CONFIG_FILE="${OPENCODE_CONFIG}/opencode.jsonc"
PLUGIN_NAME="@sunderrrr/opencode-setup"

if [ -f "$CONFIG_FILE" ]; then
  echo "→ Updating opencode.jsonc..."
  python3 -c "
import json
config = json.load(open('$CONFIG_FILE'))

# Add plugin
if 'plugin' not in config:
    config['plugin'] = []
if '$PLUGIN_NAME' not in config['plugin']:
    config['plugin'].append('$PLUGIN_NAME')

# Add /setup command
if 'command' not in config:
    config['command'] = {}
if 'setup' not in config['command']:
    config['command']['setup'] = {
        'description': 'Analyze project and recommend tools, MCP servers, skills'
    }

json.dump(config, open('$CONFIG_FILE', 'w'), indent=2)
print('  ✓ Config updated')
" 2>&1
else
  echo "→ Creating opencode.jsonc..."
  cat > "$CONFIG_FILE" << JSON
{
  "\$schema": "https://opencode.ai/config.json",
  "plugin": ["$PLUGIN_NAME"],
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
echo "  Installation terminée !"
echo ""
echo "  Pour utiliser :"
echo "  1. Lance OpenCode"
echo "  2. Tape /setup (ou utilise l'outil opencode-setup dans le chat)"
echo ""
echo "  Le plugin ajoute un outil 'opencode-setup' qui analyse"
echo "  ton projet et recommande les configs adaptées."
echo "╭────────────────────────────╯"
