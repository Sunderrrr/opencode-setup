# OpenCode Setup

> Reproduction d'[`claude-code-setup`](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-code-setup) (le plugin officiel d'Anthropic), **adaptée à [OpenCode](https://opencode.ai)**.
>
> Analyse ton codebase et recommande les automatisations OpenCode les plus utiles — MCP servers, skills, subagents, commands, plugins/hooks. **Read-only** : ça recommande, ça ne modifie rien.

## Comment ça marche

Comme l'original, le cœur est un **skill piloté par le LLM** (pas un script de détection figé). Il suit un workflow en 3 phases — scan → mapping → rapport — et s'appuie sur des fichiers de référence détaillés. Il recommande **1-2 automatisations par catégorie** (ou 3-5 si tu cibles une catégorie précise).

```
opencode-setup/
├── skills/opencode-automation-recommender/
│   ├── SKILL.md                       # le cerveau (workflow + decision framework)
│   └── references/
│       ├── mcp-servers.md             # context7, Playwright, Supabase, GitHub…
│       ├── skills-reference.md        # skills custom à créer
│       ├── subagents.md               # code-reviewer, security-reviewer…
│       ├── commands.md                # /test, /pr, /review…
│       └── plugins-hooks.md           # format/lint/block via l'API plugin
├── command/setup.md                   # commande /setup (déclencheur)
└── plugin/index.js                    # outil read-only `project-scan` (ESM)
```

### Correspondance claude-code-setup → OpenCode

| claude-code-setup | OpenCode |
|---|---|
| MCP Servers | bloc `mcp` dans `opencode.jsonc` (`type: local`/`remote`) |
| Skills | `.opencode/skills/<n>/SKILL.md` |
| Subagents | `.opencode/agent/<n>.md` (`mode: subagent`) |
| Slash Commands | `.opencode/command/<n>.md` |
| **Hooks** | **API plugin** OpenCode (`tool.execute.before/after`, `file.edited`) — OpenCode n'a pas de config `hooks` séparée |

## Installation

```bash
curl -fsSL https://raw.githubusercontent.com/Sunderrrr/opencode-setup/main/install.sh | bash
```

Installe le skill, la commande `/setup` et le plugin `project-scan` dans `~/.config/opencode/`.

## Utilisation

Dans OpenCode :

```
/setup
```

ou simplement, en langage naturel (le skill se déclenche tout seul) :

```
recommend automations for this project
aide-moi à configurer OpenCode pour ce projet
quels plugins/hooks je devrais utiliser ?
```

## Dépendances

- OpenCode 1.17+
- `curl` (installation), Node/Bun (fourni par OpenCode pour le plugin)

## Licence

MIT
