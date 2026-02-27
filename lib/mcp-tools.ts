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
}
