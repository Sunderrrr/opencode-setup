import os
import json
import subprocess
from pathlib import Path
from typing import Any

try:
    from mcp.server import Server, stdio_server
    from mcp.types import Tool, TextContent
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False


DETECTORS: dict[str, list[str]] = {
    "react": ["package.json"],
    "nextjs": ["package.json"],
    "vue": ["package.json"],
    "svelte": ["package.json"],
    "python": ["pyproject.toml", "requirements.txt", "setup.py", "setup.cfg"],
    "rust": ["Cargo.toml"],
    "go": ["go.mod"],
    "node": ["package.json"],
    "docker": ["Dockerfile", "docker-compose.yml", "compose.yml"],
    "terraform": ["*.tf"],
    "kubernetes": ["*.yaml", "*.yml"],
}

STACK_HINTS = {
    "react": {"name": "React", "mcp": ["@anthropic/create-mcp-server"]},
    "nextjs": {"name": "Next.js", "mcp": ["@anthropic/create-mcp-server"]},
    "python": {"name": "Python", "mcp": ["astral-sh/ruff"]},
    "rust": {"name": "Rust", "mcp": ["rust-analyzer"]},
    "go": {"name": "Go", "mcp": ["golang"]},
    "docker": {"name": "Docker", "mcp": ["docker"]},
    "terraform": {"name": "Terraform", "mcp": ["hashicorp/terraform"]},
    "kubernetes": {"name": "Kubernetes", "mcp": ["kubernetes"]},
}


def detect_stack(project_path: str) -> dict[str, Any]:
    root = Path(project_path).expanduser().resolve()
    if not root.is_dir():
        return {"error": f"Not a directory: {project_path}"}

    detected = set()
    files = {}

    for stack, patterns in DETECTORS.items():
        for pattern in patterns:
            if "*" in pattern:
                matches = list(root.glob(pattern))
                if matches:
                    detected.add(stack)
                    files[stack] = [str(m.relative_to(root)) for m in matches[:3]]
                    break
            else:
                target = root / pattern
                if target.exists():
                    detected.add(stack)
                    files[stack] = [pattern]
                    break

    return {
        "project": root.name,
        "path": str(root),
        "stacks": sorted(detected),
        "files": files,
        "hints": [STACK_HINTS[s] for s in detected if s in STACK_HINTS],
    }


def scan_project(project_path: str) -> str:
    result = detect_stack(project_path)
    parts = [f"## Projet : {result['project']}", ""]

    if "error" in result:
        return result["error"]

    if not result["stacks"]:
        parts.append("Aucune stack détectée.")
        return "\n".join(parts)

    parts.append("### Stack détectée")
    for s in result["stacks"]:
        hint = STACK_HINTS.get(s, {})
        name = hint.get("name", s)
        parts.append(f"- **{name}**")
        if s in result["files"]:
            for f in result["files"][s]:
                parts.append(f"  - `{f}`")

    parts.append("")
    parts.append("### Recommandations MCP")
    mcp_seen = set()
    for s in result["stacks"]:
        hint = STACK_HINTS.get(s, {})
        for mcp in hint.get("mcp", []):
            if mcp not in mcp_seen:
                mcp_seen.add(mcp)
                parts.append(f"- `{mcp}`")

    if not mcp_seen:
        parts.append("Aucune recommandation spécifique (stack générique).")

    parts.append("")
    parts.append("### Prochaines étapes")
    parts.append(
        "Lance `/setup` dans OpenCode pour une analyse complète "
        "avec recherche web et recommandations détaillées."
    )

    return "\n".join(parts)


def run_scan(project_path: str | None = None) -> str:
    """Run a project scan from CLI."""
    path = project_path or os.getcwd()
    return scan_project(path)


def main():
    if not MCP_AVAILABLE:
        # CLI mode
        import argparse
        parser = argparse.ArgumentParser(description="OpenCode Setup Scanner")
        parser.add_argument("scan", nargs="?", default=None, help="Scan a project")
        parser.add_argument("path", nargs="?", default=None, help="Project path")
        args = parser.parse_args()
        path = args.path or os.getcwd()
        print(scan_project(path))
        return

    # MCP server mode
    server = Server("opencode-setup")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return [
            Tool(
                name="project_scan",
                description="Scan a project directory and detect tech stack, then recommend MCP servers and tools",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path to the project directory to scan",
                        }
                    },
                    "required": ["path"],
                },
            ),
            Tool(
                name="add_mcp_server",
                description="Add an MCP server configuration to opencode.jsonc",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "MCP server name"},
                        "command": {"type": "string", "description": "Binary or command to run"},
                        "args": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "Arguments for the command",
                        },
                        "type": {
                            "type": "string",
                            "enum": ["stdio", "remote"],
                            "description": "MCP server type",
                        },
                        "url": {"type": "string", "description": "URL for remote type"},
                    },
                    "required": ["name", "command", "type"],
                },
            ),
            Tool(
                name="get_config",
                description="Show current OpenCode configuration",
                inputSchema={
                    "type": "object",
                    "properties": {},
                },
            ),
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        if name == "project_scan":
            path = arguments.get("path", os.getcwd())
            result = scan_project(path)
            return [TextContent(type="text", text=result)]

        elif name == "add_mcp_server":
            config_path = Path.home() / ".config" / "opencode" / "opencode.jsonc"
            mcp_name = arguments["name"]
            entry = {
                "type": arguments["type"],
                "command": arguments.get("command"),
                "args": arguments.get("args", []),
            }
            if arguments.get("type") == "remote":
                entry["url"] = arguments.get("url", "")
                entry.pop("command", None)
                entry.pop("args", None)

            if config_path.exists():
                config = json.loads(config_path.read_text())
            else:
                config = {"$schema": "https://opencode.ai/config.json", "mcp": {}}

            if "mcp" not in config:
                config["mcp"] = {}
            config["mcp"][mcp_name] = entry
            config_path.write_text(json.dumps(config, indent=2))
            return [TextContent(type="text", text=f"✓ MCP server '{mcp_name}' added to opencode.jsonc")]

        elif name == "get_config":
            config_path = Path.home() / ".config" / "opencode" / "opencode.jsonc"
            if config_path.exists():
                content = config_path.read_text()
            else:
                content = "{}"
            return [TextContent(type="text", text=content)]

        return [TextContent(type="text", text=f"Unknown tool: {name}")]

    import asyncio
    asyncio.run(stdio_server(server))


if __name__ == "__main__":
    main()
