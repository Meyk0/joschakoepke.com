import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  bio,
  manifesto,
  projects,
  experience,
  featuredArticles,
  authoredArticles,
  contact,
  openToWork,
  resume,
} from "@/content/data";

function buildJoschaContext(): string {
  return [
    "# Joscha Koepke — Full Profile\n",
    "## Bio",
    JSON.stringify(bio, null, 2),
    "\n## Product Manifesto",
    JSON.stringify(manifesto, null, 2),
    "\n## Projects",
    JSON.stringify(projects, null, 2),
    "\n## Experience (Summary)",
    JSON.stringify(experience, null, 2),
    "\n## Full Resume / CV",
    JSON.stringify(resume, null, 2),
    "\n## Articles — Featured In",
    JSON.stringify(featuredArticles, null, 2),
    "\n## Articles — Authored",
    JSON.stringify(authoredArticles, null, 2),
    "\n## Contact",
    JSON.stringify(contact, null, 2),
    "\n## Open to Work",
    JSON.stringify(openToWork, null, 2),
  ].join("\n");
}

async function askClaude(question: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return "The ask_joscha tool is not configured yet (missing API key). Please use the other MCP tools to query Joscha's data directly.";
  }

  const systemPrompt = `You are an AI assistant that answers questions about Joscha Koepke based ONLY on the provided data. Rules:
- Answer only using the data below. Do not make things up.
- If the data doesn't cover the question, say "I don't have that information about Joscha."
- Refer to Joscha in third person (he/him), not first person.
- Be concise, conversational, and helpful.
- When relevant, mention specific data points (metrics, dates, company names).

${buildJoschaContext()}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: question }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "No response generated.";
}

export function registerTools(server: McpServer) {
  server.registerTool(
    "get_bio",
    {
      description:
        "Returns Joscha Koepke's name, role, company, location, summary, and tags",
    },
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify(bio, null, 2) }],
    })
  );

  server.registerTool(
    "get_manifesto",
    {
      description:
        "Returns Joscha's product manifesto entries. Pass an index (0-10) for a specific entry, or omit for all entries.",
      inputSchema: {
        index: z
          .number()
          .int()
          .min(0)
          .max(10)
          .optional()
          .describe("Manifesto entry index (0-10). Omit for all entries."),
      },
    },
    async ({ index }) => {
      const data =
        index !== undefined ? manifesto[index] : manifesto;
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    }
  );

  server.registerTool(
    "get_projects",
    {
      description:
        "Returns Joscha's active and shipped projects with tech stacks and status",
    },
    async () => ({
      content: [
        { type: "text" as const, text: JSON.stringify(projects, null, 2) },
      ],
    })
  );

  server.registerTool(
    "get_experience",
    {
      description:
        "Returns Joscha's career history as git-log style entries with dates, roles, and descriptions",
    },
    async () => ({
      content: [
        { type: "text" as const, text: JSON.stringify(experience, null, 2) },
      ],
    })
  );

  server.registerTool(
    "get_writing",
    {
      description: "Returns articles featuring and authored by Joscha, with links and dates",
    },
    async () => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ featured: featuredArticles, authored: authoredArticles }, null, 2),
        },
      ],
    })
  );

  server.registerTool(
    "get_contact",
    {
      description:
        "Returns Joscha's contact information including email, socials, and MCP endpoint",
    },
    async () => ({
      content: [
        { type: "text" as const, text: JSON.stringify(contact, null, 2) },
      ],
    })
  );

  server.registerTool(
    "is_open_to_work",
    {
      description:
        "Returns whether Joscha is open to new opportunities, with context and ideal role description",
    },
    async () => ({
      content: [
        { type: "text" as const, text: JSON.stringify(openToWork, null, 2) },
      ],
    })
  );

  server.registerTool(
    "get_resume",
    {
      description:
        "Returns Joscha's full CV including detailed experience with bullet points, selected impact metrics, core competencies, education, languages, and side projects. More detailed than get_experience.",
    },
    async () => ({
      content: [
        { type: "text" as const, text: JSON.stringify(resume, null, 2) },
      ],
    })
  );

  server.registerTool(
    "ask_joscha",
    {
      description:
        "Ask any free-form question about Joscha Koepke and get a conversational answer grounded in his real data (bio, resume, manifesto, projects, experience, articles). Great for questions like 'Would Joscha be a good fit for our AI PM role?' or 'What does Joscha think about frameworks?'",
      inputSchema: {
        question: z
          .string()
          .describe("The question to ask about Joscha Koepke"),
      },
    },
    async ({ question }) => {
      const answer = await askClaude(question);
      return {
        content: [{ type: "text" as const, text: answer }],
      };
    }
  );
}
