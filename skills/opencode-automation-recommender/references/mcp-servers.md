# MCP Server Recommendations (OpenCode)

OpenCode connects to MCP servers via the `mcp` block in `opencode.json` / `opencode.jsonc`. Two transport types:

- **`local`** — spawns a process. `command` is an **array** of strings. Optional `environment`, `cwd`, `timeout`.
- **`remote`** — connects to a URL. Optional `headers`, `oauth`, `timeout`.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "server-name": {
      "type": "local",
      "command": ["npx", "-y", "some-mcp-server"],
      "enabled": true,
      "environment": { "API_KEY": "{env:API_KEY}" }
    }
  }
}
```

> Commit `opencode.json` into the repo so the whole team shares the same MCP servers.

## Documentation & Knowledge

### context7
Live, version-accurate documentation lookup for libraries and SDKs. **Recommend whenever the project uses popular frameworks/libraries** (React, Express, Next.js, Prisma, etc.).
```jsonc
"context7": { "type": "local", "command": ["npx", "-y", "@upstash/context7-mcp"], "enabled": true }
```

## Browser & Frontend

### Playwright MCP
Browser automation and UI testing. **Recommend for frontend projects** (React/Vue/Angular/Svelte) or anything with a `playwright.config.*`.
```jsonc
"playwright": { "type": "local", "command": ["npx", "-y", "@playwright/mcp@latest"], "enabled": true }
```

## Databases

### Supabase MCP
Direct database + auth operations. Detect via `@supabase/supabase-js` or `supabase/` dir.
```jsonc
"supabase": {
  "type": "local",
  "command": ["npx", "-y", "@supabase/mcp-server-supabase@latest"],
  "environment": { "SUPABASE_ACCESS_TOKEN": "{env:SUPABASE_ACCESS_TOKEN}" },
  "enabled": true
}
```

### Convex MCP
Live deployment introspection, run queries/mutations, manage env vars and logs. Detect via `convex/` dir or `convex` dep.
```jsonc
"convex": { "type": "local", "command": ["npx", "-y", "convex@latest", "mcp", "start"], "enabled": true }
```

### PostgreSQL MCP
Query + schema tools for raw Postgres/MySQL. Detect via `pg`, `postgres`, `mysql2`, or `DATABASE_URL`.
```jsonc
"postgres": {
  "type": "local",
  "command": ["npx", "-y", "@modelcontextprotocol/server-postgres", "{env:DATABASE_URL}"],
  "enabled": true
}
```

## Version Control & DevOps

### GitHub MCP
Issues, PRs, Actions. Recommend for any GitHub repo (remote `github.com`). Remote server with OAuth:
```jsonc
"github": { "type": "remote", "url": "https://api.githubcopilot.com/mcp/", "enabled": true }
```
Or local with a token: `["npx","-y","@modelcontextprotocol/server-github"]` + `GITHUB_PERSONAL_ACCESS_TOKEN`.

### Linear MCP
Issue management. Detect via Linear references in code/docs.
```jsonc
"linear": { "type": "remote", "url": "https://mcp.linear.app/sse", "enabled": true }
```

## Observability

### Sentry MCP
Error investigation. Detect via `@sentry/*` deps.
```jsonc
"sentry": { "type": "remote", "url": "https://mcp.sentry.dev/mcp", "enabled": true }
```

## Cloud & Infra

### Cloudflare MCP
Workers, D1, KV, R2. Detect via `wrangler.toml`.
```jsonc
"cloudflare": { "type": "remote", "url": "https://observability.mcp.cloudflare.com/sse", "enabled": true }
```

## Quick Reference: Detection → MCP Server

| Detected signal | MCP server |
|-----------------|------------|
| Popular libraries / SDKs | context7 |
| Frontend / UI tests | Playwright |
| `@supabase/supabase-js` | Supabase |
| `convex/` | Convex |
| `pg` / `DATABASE_URL` | PostgreSQL |
| GitHub remote | GitHub |
| Linear references | Linear |
| `@sentry/*` | Sentry |
| `wrangler.toml` | Cloudflare |

**Browse more**: https://opencode.ai/docs/mcp-servers/ · https://github.com/modelcontextprotocol/servers
