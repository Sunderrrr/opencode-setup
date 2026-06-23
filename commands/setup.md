---
description: Analyze project and recommend OpenCode tools, MCP servers, skills, and agents
---

Analyse ce projet et la conversation pour recommander des outils, MCP servers, skills, subagents et configurations pertinents pour OpenCode.

## Étapes

1. **Stack technique** : Utilise l'outil `opencode-setup` pour analyser le projet courant
2. **Conversation** : Analyse le contexte de la session actuelle
3. **Web** : Consulte les docs OpenCode pour des recommandations :
   - https://opencode.ai/docs/mcp-servers/
   - https://opencode.ai/docs/tools/
   - https://opencode.ai/docs/agents/
   - https://opencode.ai/docs/skills/
   - https://opencode.ai/ecosystem
   - https://github.com/modelcontextprotocol/servers
4. **Recherche** : Cherche les MCP servers et outils adaptés à la stack détectée

## Recommandations

Génère les recommandations avec la configuration exacte à copier dans `opencode.jsonc` :
- MCP servers (nom + commande)
- Tools personnalisés
- Skills
- Agents / Subagents
- Commandes slash
- Règles AGENTS.md

## Fichier de configuration actuel

@/root/.config/opencode/opencode.jsonc
