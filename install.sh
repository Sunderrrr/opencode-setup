#!/usr/bin/env bash
set -euo pipefail

OPENCODE_CONFIG="${OPENCODE_CONFIG:-$HOME/.config/opencode}"
MCP_SERVER_DIR="${OPENCODE_CONFIG}/mcp-servers/opencode-setup"
COMMANDS_DIR="${OPENCODE_CONFIG}/commands"

echo "╭────────────────────────────╮"
echo "│  OpenCode Setup Installer  │"
echo "╰────────────────────────────╯"
echo ""

# Detect package manager
if command -v uv &>/dev/null; then
  INSTALL_CMD="uv tool install"
elif command -v pipx &>/dev/null; then
  INSTALL_CMD="pipx install"
elif command -v pip &>/dev/null; then
  echo "⚠ Using pip — consider uv or pipx for isolation"
  INSTALL_CMD="pip install"
else
  echo "✗ Need Python (uv, pipx, or pip)"
  exit 1
fi

# 1. Install the MCP server
echo "→ Installing opencode-setup MCP server..."
if [ "$INSTALL_CMD" = "uv tool install" ]; then
  uv tool install --reinstall "$(dirname "$0")/mcp-server" 2>&1 | tail -3
elif [ "$INSTALL_CMD" = "pipx install" ]; then
  pipx install "$(dirname "$0")/mcp-server" 2>&1 | tail -3
else
  pip install -e "$(dirname "$0")/mcp-server" 2>&1 | tail -3
fi

# 2. Install the command
echo "→ Installing /setup command..."
mkdir -p "$COMMANDS_DIR"
cp "$(dirname "$0")/commands/setup.md" "$COMMANDS_DIR/setup.md"

# 3. Add to opencode.jsonc
CONFIG_FILE="${OPENCODE_CONFIG}/opencode.jsonc"
if [ -f "$CONFIG_FILE" ]; then
  echo "→ Adding MCP server to opencode.jsonc..."
  python3 -c "
import json
config = json.load(open('$CONFIG_FILE'))
if 'mcp' not in config:
    config['mcp'] = {}
config['mcp']['opencode-setup'] = {
    'command': 'opencode-setup',
    'args': [],
    'type': 'stdio',
    'enabled': True
}
if 'command' not in config:
    config['command'] = {}
config['command']['setup'] = {
    'description': 'Analyze project and recommend tools, MCP servers, skills'
}
json.dump(config, open('$CONFIG_FILE', 'w'), indent=2)
print('✓ Updated opencode.jsonc')
" 2>&1
else
  echo "→ Creating opencode.jsonc..."
  cat > "$CONFIG_FILE" << 'JSON'
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "opencode-setup": {
      "command": "opencode-setup",
      "args": [],
      "type": "stdio",
      "enabled": true
    }
  },
  "command": {
    "setup": {
      "description": "Analyze project and recommend tools, MCP servers, skills"
    }
  }
}
JSON
  fi

echo ""
echo "✓ Installation terminée !"
echo ""
echo "Pour utiliser :"
echo "  1. Lance OpenCode"
echo "  2. Tape /setup"
echo ""
echo "Ou directement :"
echo "  opencode-setup scan /chemin/vers/projet"
