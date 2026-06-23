const path = require("path");
const fs = require("fs");
const os = require("os");

const DETECTORS = {
  react: ["package.json"],
  nextjs: ["package.json"],
  vue: ["package.json"],
  svelte: ["package.json"],
  python: ["pyproject.toml", "requirements.txt", "setup.py"],
  rust: ["Cargo.toml"],
  go: ["go.mod"],
  node: ["package.json"],
  docker: ["Dockerfile", "docker-compose.yml", "compose.yml"],
  terraform: ["*.tf"],
  kubernetes: ["*.yaml", "*.yml"],
  php: ["composer.json"],
  ruby: ["Gemfile"],
  elixir: ["mix.exs"],
  swift: ["Package.swift"],
};

const STACK_HINTS = {
  react: { name: "React", mcp: ["@anthropic/create-mcp-server"] },
  nextjs: { name: "Next.js" },
  python: { name: "Python", mcp: ["astral-sh/ruff"] },
  rust: { name: "Rust", mcp: ["rust-analyzer"] },
  go: { name: "Go" },
  docker: { name: "Docker" },
  terraform: { name: "Terraform", mcp: ["hashicorp/terraform"] },
  kubernetes: { name: "Kubernetes" },
  php: { name: "PHP" },
  ruby: { name: "Ruby" },
};

function detectStack(projectPath) {
  const detected = [];
  const files = {};
  const root = path.resolve(projectPath);

  if (!fs.existsSync(root)) return { project: path.basename(root), stacks: [] };

  try {
    const entries = fs.readdirSync(root);
    for (const [stack, patterns] of Object.entries(DETECTORS)) {
      for (const pattern of patterns) {
        if (pattern.includes("*")) {
          const matches = entries.filter((e) => {
            const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
            return regex.test(e);
          });
          if (matches.length > 0) {
            detected.push(stack);
            files[stack] = matches.slice(0, 3);
            break;
          }
        } else {
          if (entries.includes(pattern)) {
            detected.push(stack);
            files[stack] = [pattern];
            break;
          }
        }
      }
    }
  } catch (e) {
    return { project: path.basename(root), stacks: [], error: e.message };
  }

  return {
    project: path.basename(root),
    path: root,
    stacks: detected,
    files,
    hints: detected.filter((s) => STACK_HINTS[s]).map((s) => STACK_HINTS[s]),
  };
}

function findPackageManager(dir) {
  const entries = fs.readdirSync(dir);
  if (entries.includes("bun.lock")) return "bun";
  if (entries.includes("pnpm-lock.yaml")) return "pnpm";
  if (entries.includes("yarn.lock")) return "yarn";
  if (entries.includes("package-lock.json")) return "npm";
  return null;
}

function generateRecommendations(stack, projectPath) {
  const recs = { mcp: [], tools: [], config: {} };
  const isNode = stack.stacks.includes("node") || stack.stacks.includes("react") || stack.stacks.includes("nextjs");
  const isPython = stack.stacks.includes("python");
  const isRust = stack.stacks.includes("rust");

  if (isNode) {
    const pm = findPackageManager(projectPath) || "npm";
    recs.tools.push({
      name: "build",
      description: `Build project with ${pm}`,
      command: `${pm} run build`,
    });
    recs.tools.push({
      name: "test",
      description: `Run tests with ${pm}`,
      command: `${pm} test`,
    });
  }
  if (isPython) {
    recs.mcp.push({ name: "astral-sh/ruff", type: "LSP/linter" });
    recs.tools.push({ name: "lint", description: "Run ruff", command: "ruff check ." });
    recs.tools.push({ name: "test", description: "Run pytest", command: "python -m pytest" });
  }
  if (isRust) {
    recs.mcp.push({ name: "rust-analyzer", type: "LSP" });
    recs.tools.push({ name: "build", description: "Build Rust project", command: "cargo build" });
    recs.tools.push({ name: "test", description: "Run tests", command: "cargo test" });
  }
  if (stack.stacks.includes("docker")) {
    recs.mcp.push({ name: "docker", type: "Container management" });
  }
  if (stack.stacks.includes("terraform")) {
    recs.mcp.push({ name: "hashicorp/terraform", type: "Infrastructure" });
  }

  return recs;
}

export const OpenCodeSetup = async (ctx) => {
  const { tool, toolSchema } = ctx;

  return {
    tool: {
      "opencode-setup": tool({
        description:
          "Analyze a project directory and recommend MCP servers, tools, skills, and agents configurations for OpenCode. " +
          "Scans the project for tech stack, package managers, and suggests relevant tools.",
        args: {
          path: toolSchema.string().optional().describe("Project path to analyze (defaults to current directory)"),
          detail: toolSchema
            .string()
            .optional()
            .describe("Level of detail: 'summary' or 'full'"),
        },
        async execute(args, context) {
          const targetPath = args.path || context.directory || process.cwd();
          const detail = args.detail || "full";

          const stack = detectStack(targetPath);
          const recs = generateRecommendations(stack, targetPath);

          let output = `## OpenCode Setup — ${stack.project}\n\n`;

          if (stack.stacks.length === 0) {
            output += "⚠️ Aucune stack technique détectée.\n";
            return { type: "text", content: output };
          }

          // Stack
          output += "### 📦 Stack détectée\n";
          for (const s of stack.stacks) {
            const hint = STACK_HINTS[s];
            const name = hint?.name || s;
            output += `- **${name}**\n`;
          }

          // MCP recommendations
          if (recs.mcp.length > 0) {
            output += "\n### 🔌 MCP Servers recommandés\n";
            for (const m of recs.mcp) {
              output += `- \`${m.name}\` — ${m.type}\n`;
            }
            output += "\nAjoutez-les dans votre opencode.jsonc :\n```json\n\"mcp\": {\n";
            for (const m of recs.mcp) {
              output += `  "${m.name}": { "type": "stdio", "command": "...", "enabled": true },\n`;
            }
            output += "}\n```\n";
          }

          // Tools
          if (recs.tools.length > 0) {
            output += "\n### 🛠️ Commandes recommandées\n";
            output += "Ajoutez dans opencode.jsonc :\n```json\n\"command\": {\n";
            for (const t of recs.tools) {
              output += `  "${t.name}": { "description": "${t.description}", "template": "${t.command}" },\n`;
            }
            output += "}\n```\n";
          }

          // General advice
          output += "\n### 💡 Conseils\n";
          if (!fs.existsSync(path.join(targetPath, "AGENTS.md"))) {
            output += "- Exécutez `/init` dans OpenCode pour créer un AGENTS.md\n";
          }
          output += "- Explorez les MCP servers : https://opencode.ai/docs/mcp-servers/\n";
          output += "- Découvrez les skills : https://opencode.ai/docs/skills/\n";

          return { type: "text", content: output };
        },
      }),
    },
  };
};
