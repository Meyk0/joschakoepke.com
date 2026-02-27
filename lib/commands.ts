import {
  bio,
  manifesto,
  projects,
  experience,
  featuredArticles,
  authoredArticles,
  contact,
  openToWork,
  mcpTools,
} from "@/content/data";

export interface CommandResult {
  output: string;
  isHtml?: boolean;
}

type CommandHandler = (args: string) => CommandResult;

const commands: Record<string, CommandHandler> = {
  help: () => ({
    output: [
      "  Available commands:\n",
      "  help          Show this help message",
      "  bio           Who I am",
      "  manifesto     My product principles (try: manifesto 3)",
      "  projects      What I'm building",
      "  experience    Career history (git log style)",
      "  writing       Articles and posts",
      "  contact       How to reach me",
      "  mcp           About the MCP server",
      "  mcp tools     List all MCP tool signatures",
      "  mcp connect   How to connect from Claude",
      "  clear         Clear terminal",
    ].join("\n"),
  }),

  bio: () => ({
    output: [
      `  <span style="color: var(--green); font-weight: 600">${bio.name}</span>`,
      `  ${bio.role} @ ${bio.company}`,
      `  📍 ${bio.location}\n`,
      `  ${bio.summary}\n`,
      `  ${bio.tags.map((t) => `<span style="color: var(--green-dim)">#${t}</span>`).join("  ")}`,
    ].join("\n"),
    isHtml: true,
  }),

  manifesto: (args: string) => {
    const trimmed = args.trim();
    if (trimmed === "") {
      const lines = manifesto.map(
        (m) =>
          `  <span style="color: var(--green-dim)">[${m.index}]</span> ${m.title}`
      );
      return {
        output: [
          "  Product Manifesto\n",
          ...lines,
          `\n  <span style="color: var(--text-muted)">Run manifesto [0-10] to read an entry.</span>`,
        ].join("\n"),
        isHtml: true,
      };
    }
    const idx = parseInt(trimmed, 10);
    if (isNaN(idx) || idx < 0 || idx > 10) {
      return { output: `  Invalid index: ${trimmed}. Use 0-10.` };
    }
    const entry = manifesto[idx];
    return {
      output: [
        `  <span style="color: var(--green)">[${entry.index}] ${entry.title}</span>\n`,
        `  ${entry.body}`,
      ].join("\n"),
      isHtml: true,
    };
  },

  projects: () => {
    const lines = projects.map((p) => {
      const statusColor =
        p.status === "active" ? "var(--green)" : "var(--text-dim)";
      const typeColor =
        p.type === "work" ? "var(--green-dim)" : "var(--amber)";
      return [
        `  <span style="color: ${statusColor}">●</span> <span style="font-weight: 600">${p.name}</span> <span style="color: ${typeColor}">[${p.type}]</span> <span style="color: var(--text-muted)">${p.status}</span>`,
        `    ${p.description}`,
        `    <span style="color: var(--text-muted)">tech: ${p.tech.join(", ")}</span>`,
        p.url
          ? `    <span style="color: var(--text-muted)">url: ${p.url}</span>`
          : null,
      ]
        .filter(Boolean)
        .join("\n");
    });
    return { output: lines.join("\n\n"), isHtml: true };
  },

  experience: () => {
    const lines = experience.map((e) => {
      const branchColor =
        e.branch === "main" ? "var(--green)" : "var(--amber)";
      return [
        `  <span style="color: var(--amber)">*</span> <span style="color: var(--green-dim)">${e.hash}</span> <span style="color: var(--text-muted)">(${e.date})</span> ${e.message} <span style="color: ${branchColor}">(${e.branch})</span>`,
        `  <span style="color: var(--text-dim)">│</span> ${e.body}`,
      ].join("\n");
    });
    return { output: lines.join("\n"), isHtml: true };
  },

  writing: () => {
    const featured = featuredArticles.map(
      (a) =>
        `  <span style="color: var(--green-dim)">→</span> ${a.title}\n    <span style="color: var(--text-muted)">${a.publication} · ${a.year}</span>`
    );
    const authored = authoredArticles.map(
      (a) =>
        `  <span style="color: var(--green-dim)">→</span> ${a.title}\n    <span style="color: var(--text-muted)">${a.publication} · ${a.year}</span>`
    );
    return {
      output: [
        `  <span style="color: var(--green); font-weight: 600">Featured In</span>\n`,
        ...featured,
        "",
        `  <span style="color: var(--green); font-weight: 600">Authored</span>\n`,
        ...authored,
      ].join("\n"),
      isHtml: true,
    };
  },

  contact: () => ({
    output: [
      `  <span style="color: var(--green)">email</span>     ${contact.email}`,
      `  <span style="color: var(--green)">linkedin</span>  ${contact.linkedin}`,
      `  <span style="color: var(--green)">github</span>    ${contact.github}`,
      `  <span style="color: var(--green)">mcp</span>       ${contact.mcp_url}`,
    ].join("\n"),
    isHtml: true,
  }),

  mcp: () => ({
    output: [
      `  <span style="color: var(--green); font-weight: 600">MCP Server — joscha-koepke v1.0.0</span>\n`,
      "  This site exposes a Model Context Protocol (MCP) server.",
      "  AI agents like Claude can query my background programmatically.\n",
      `  <span style="color: var(--green)">endpoint</span>  ${contact.mcp_url}`,
      `  <span style="color: var(--green)">transport</span> SSE (Server-Sent Events)`,
      `  <span style="color: var(--green)">tools</span>     ${mcpTools.length} available\n`,
      `  <span style="color: var(--text-muted)">Run 'mcp tools' or 'mcp connect' for more.</span>`,
    ].join("\n"),
    isHtml: true,
  }),

  "mcp tools": () => {
    const lines = mcpTools.map(
      (t) =>
        `  <span style="color: var(--green)">${t.name}</span>(<span style="color: var(--text-dim)">${t.parameters}</span>)\n    <span style="color: var(--text-muted)">${t.description}</span>`
    );
    return { output: lines.join("\n\n"), isHtml: true };
  },

  "mcp connect": () => ({
    output: [
      "  Connect from Claude.ai:\n",
      "  1. Open Claude.ai → Settings → Connectors",
      `  2. Add custom MCP server: <span style="color: var(--green)">${contact.mcp_url}</span>`,
      '  3. Ask Claude: <span style="color: var(--text-dim)">"Who is Joscha and what is he building?"</span>\n',
      "  Example queries:",
      '  • "What are Joscha\'s product principles?"',
      '  • "Is Joscha open to new opportunities?"',
      '  • "What projects is Joscha working on?"',
    ].join("\n"),
    isHtml: true,
  }),

  clear: () => ({ output: "__CLEAR__" }),
};

export const commandNames = Object.keys(commands);

export function runCommand(input: string): CommandResult {
  const trimmed = input.trim().toLowerCase();

  // Handle "mcp tools" and "mcp connect" as compound commands
  if (trimmed.startsWith("mcp ")) {
    const sub = trimmed;
    if (commands[sub]) {
      return commands[sub]("");
    }
  }

  const [cmd, ...rest] = trimmed.split(/\s+/);
  const args = rest.join(" ");

  if (commands[cmd]) {
    return commands[cmd](args);
  }

  return {
    output: `  bash: ${cmd}: command not found. Try 'help'.`,
  };
}
