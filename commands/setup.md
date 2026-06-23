---
description: Analyze project and recommend OpenCode tools, MCP servers, skills, and agents
---

# OpenCode Setup

Analyse ce projet et la conversation pour recommander des outils, MCP servers, skills, subagents et configurations pertinents.

## Analyse

1. **Stack technique** : Scanne les fichiers du projet avec l'outil `project_scan`
2. **Conversation** : Analyse le contexte de la session
3. **Web** : Consulte les sources pour des recommandations :
   - https://opencode.ai/docs/mcp-servers/
   - https://opencode.ai/docs/tools/
   - https://opencode.ai/docs/agents/
   - https://opencode.ai/docs/skills/
   - https://github.com/modelcontextprotocol/servers
   - https://opencode.ai/ecosystem
4. **Moteur de recherche** : Cherche les MCP servers adaptés à la stack

## Recommandations

Utilise `add_mcp_server` pour ajouter les MCP servers directement, ou génère la config à copier dans `opencode.jsonc`.

Structure des recommandations :
- MCP servers (avec commande exacte)
- Tools personnalisés
- Skills
- Agents / Subagents
- Commandes slash
- Règles AGENTS.md

## Fichier de configuration

@/root/.config/opencode/opencode.jsonc
