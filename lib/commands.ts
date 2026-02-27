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

function link(url: string, text: string): string {
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: var(--green-dim); text-decoration: underline; text-decoration-color: var(--green-muted); text-underline-offset: 2px">${text}</a>`;
}

const commands: Record<string, CommandHandler> = {
  help: () => ({
    output: [
      "  Available commands:\n",
      "  help          Show this help message",
      "  bio           Who I am",
      "  whoami        Alias for bio",
      "  manifesto     My product principles (try: manifesto 3)",
      "  projects      What I'm building",
      "  experience    Career history (git log style)",
      "  writing       Articles and posts",
      "  contact       How to reach me",
      "  neofetch      System info",
      "  mcp           About the MCP server",
      "  mcp tools     List all MCP tool signatures",
      "  mcp connect   How to connect from Claude",
      "  clear         Clear terminal\n",
      `  <span style="color: var(--text-muted)">Also: theme, sound, history, dog, coffee, ls, pwd, date</span>`,
    ].join("\n"),
    isHtml: true,
  }),

  bio: () => ({
    output: [
      `  <span style="color: var(--green); font-weight: 600">${bio.name}</span>`,
      `  ${bio.role} @ ${bio.company}`,
      `  📍 ${bio.location}\n`,
      `  ${bio.summary}\n`,
    ].join("\n"),
    isHtml: true,
  }),

  whoami: () => commands.bio(""),

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
          ? `    ${link(p.url, p.url)}`
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
        `  <span style="color: var(--green-dim)">→</span> ${link(a.url, a.title)}\n    <span style="color: var(--text-muted)">${a.publication} · ${a.year}</span>`
    );
    const authored = authoredArticles.map(
      (a) =>
        `  <span style="color: var(--green-dim)">→</span> ${link(a.url, a.title)}\n    <span style="color: var(--text-muted)">${a.publication} · ${a.year}</span>`
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
      `  <span style="color: var(--green)">email</span>     ${link("mailto:" + contact.email, contact.email)}`,
      `  <span style="color: var(--green)">linkedin</span>  ${link(contact.linkedin, contact.linkedin)}`,
      `  <span style="color: var(--green)">github</span>    ${link(contact.github, contact.github)}`,
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

  // ─── Easter eggs ──────────────────────────────────────────────────────────

  sudo: () => ({
    output: `  <span style="color: var(--red)">Permission denied.</span> Nice try though. 😏`,
    isHtml: true,
  }),

  "rm -rf": () => ({
    output: `  <span style="color: var(--red)">🚨 rm: refusing to remove '/' recursively.</span>\n  This isn't that kind of terminal.`,
    isHtml: true,
  }),

  rm: () => ({
    output: `  <span style="color: var(--red)">🚨 rm: refusing to remove '/' recursively.</span>\n  This isn't that kind of terminal.`,
    isHtml: true,
  }),

  neofetch: () => {
    const art = [
      `    <span style="color: var(--green)">    ╔═══════════╗</span>`,
      `    <span style="color: var(--green)">    ║  ┌─────┐  ║</span>`,
      `    <span style="color: var(--green)">    ║  │ >_  │  ║</span>`,
      `    <span style="color: var(--green)">    ║  │     │  ║</span>`,
      `    <span style="color: var(--green)">    ║  └─────┘  ║</span>`,
      `    <span style="color: var(--green)">    ╚═══════════╝</span>`,
      `    <span style="color: var(--green)">     ╱──────────╲</span>`,
      `    <span style="color: var(--green)">    ╱────────────╲</span>`,
      `    <span style="color: var(--green)">   ════════════════</span>`,
    ];
    const info = [
      `<span style="color: var(--green); font-weight: 600">joscha-koepke@mcp</span>`,
      `<span style="color: var(--green)">──────────────────</span>`,
      `<span style="color: var(--green)">OS:</span>      Product Brain v3.0`,
      `<span style="color: var(--green)">Host:</span>    San Francisco, CA`,
      `<span style="color: var(--green)">Kernel:</span>  Connectly AI`,
      `<span style="color: var(--green)">Uptime:</span>  ${new Date().getFullYear() - 2014} years in product`,
      `<span style="color: var(--green)">Shell:</span>   TypeScript / Python`,
      `<span style="color: var(--green)">DE:</span>      Espresso-Driven Dev`,
      `<span style="color: var(--green)">Theme:</span>   Dark [always]`,
    ];
    const lines = art.map((a, i) =>
      i < info.length ? `${a}   ${info[i]}` : a
    );
    return { output: lines.join("\n"), isHtml: true };
  },

  coffee: () => ({
    output: [
      "  ☕ Brewing espresso...",
      "",
      "      ( (",
      "       ) )",
      "    ........",
      "    |      |]",
      "    \\      /",
      "     `----'",
      "",
      `  <span style="color: var(--amber)">Perfect shot. 18g in, 36g out, 28 seconds.</span>`,
    ].join("\n"),
    isHtml: true,
  }),

  ls: () => ({
    output: [
      `  <span style="color: var(--green-dim)">drwxr-xr-x</span>  manifesto/`,
      `  <span style="color: var(--green-dim)">drwxr-xr-x</span>  projects/`,
      `  <span style="color: var(--green-dim)">drwxr-xr-x</span>  experience/`,
      `  <span style="color: var(--green-dim)">-rw-r--r--</span>  bio.txt`,
      `  <span style="color: var(--green-dim)">-rw-r--r--</span>  contact.json`,
      `  <span style="color: var(--green-dim)">-rw-r--r--</span>  README.md`,
      `\n  <span style="color: var(--text-muted)">Try 'help' for available commands.</span>`,
    ].join("\n"),
    isHtml: true,
  }),

  pwd: () => ({
    output: "  /home/joscha",
  }),

  date: () => ({
    output: `  ${new Date().toString()}`,
  }),

  echo: (args: string) => ({
    output: `  ${args || ""}`,
  }),

  cat: () => ({
    output: `  <span style="color: var(--text-muted)">🐱 meow. Try 'help' for actual commands.</span>`,
    isHtml: true,
  }),

  exit: () => ({
    output: `  <span style="color: var(--text-muted)">There is no escape. Type 'help' instead.</span>`,
    isHtml: true,
  }),

  dog: () => ({
    output: [
      `  <span style="color: var(--amber)">`,
      "         / \\__",
      "        (    @\\___",
      "        /         O",
      "       /   (_____/",
      "      /_____/   U",
      `  </span>`,
      "",
      `  <span style="color: var(--amber)">Good boy! 🐕 Golden Retrievers are the best.</span>`,
    ].join("\n"),
    isHtml: true,
  }),

  man: () => ({
    output: `  <span style="color: var(--text-muted)">No manual entry. This is a website, not a real shell. Try 'help'.</span>`,
    isHtml: true,
  }),

  vim: () => ({
    output: `  <span style="color: var(--text-muted)">You'd never escape. Try 'help' instead.</span>`,
    isHtml: true,
  }),

  nano: () => ({
    output: `  <span style="color: var(--text-muted)">This terminal is read-only. Try 'help' to explore.</span>`,
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

  // Handle "rm -rf" and similar
  if (trimmed.startsWith("rm ")) {
    return commands["rm"]("");
  }

  // Handle "sudo" with anything after it
  if (trimmed.startsWith("sudo")) {
    return commands["sudo"]("");
  }

  // Handle "git" aliases
  if (trimmed === "git log" || trimmed === "git log --oneline") {
    return commands["experience"]("");
  }
  if (trimmed === "git status") {
    return {
      output: [
        `  On branch <span style="color: var(--green)">main</span>`,
        `  Your branch is up to date with 'origin/main'.`,
        "",
        `  nothing to commit, working tree clean`,
        `\n  <span style="color: var(--text-muted)">(try 'experience' for career history)</span>`,
      ].join("\n"),
      isHtml: true,
    };
  }
  if (trimmed.startsWith("git ")) {
    return {
      output: `  <span style="color: var(--text-muted)">git: try 'git log' or 'git status'</span>`,
      isHtml: true,
    };
  }

  // Handle "echo" with arguments
  if (trimmed.startsWith("echo ")) {
    return commands["echo"](trimmed.slice(5));
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
