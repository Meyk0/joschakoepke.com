import {
  authoredArticles,
  bio,
  contact,
  experience,
  featuredArticles,
  manifesto,
  openToWork,
  projects,
  resume,
} from "@/content/data";
import type {
  AgentAnswer,
  AgentEvidence,
  AgentSource,
  AgentSourceAppId,
} from "@/lib/agent-types";
import { agentStarterQuestions } from "@/lib/agent-types";

type SourceRecord = AgentSource & {
  content: string;
};

type StructuredAgentResponse = {
  answer: string;
  evidence: Array<{
    claim: string;
    source_id: string;
  }>;
  suggested_questions: string[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  error?: {
    message?: string;
  };
};

function normalizeId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function source(
  id: string,
  label: string,
  detail: string,
  appId: AgentSourceAppId,
  content: string,
  projectName: string | null = null,
  url: string | null = null
): SourceRecord {
  return { id, label, detail, appId, content, projectName, url };
}

const sources: SourceRecord[] = [
  source(
    "bio",
    "About Joscha",
    `${bio.role} at ${bio.company}`,
    "about",
    JSON.stringify({ bio, openToWork, contact })
  ),
  ...resume.selectedImpact.map((impact, index) =>
    source(
      `impact-${index + 1}`,
      "Selected impact",
      impact,
      "resume",
      impact
    )
  ),
  ...resume.experience.flatMap((entry) =>
    entry.bullets.map((bullet, index) =>
      source(
        `resume-${normalizeId(entry.company)}-${index + 1}`,
        `${entry.company} · ${entry.role}`,
        bullet,
        "resume",
        JSON.stringify({
          company: entry.company,
          role: entry.role,
          dates: entry.dates,
          context: entry.context,
          bullet,
        })
      )
    )
  ),
  ...experience.map((entry) =>
    source(
      `experience-${normalizeId(entry.message)}`,
      entry.message,
      entry.date,
      "resume",
      JSON.stringify(entry)
    )
  ),
  ...projects.map((project) =>
    source(
      `project-${normalizeId(project.name)}`,
      project.name,
      project.description,
      "projects",
      JSON.stringify(project),
      project.name,
      project.url ?? null
    )
  ),
  ...authoredArticles.map((article) =>
    source(
      `writing-${normalizeId(article.title)}`,
      article.title,
      `${article.publication} · ${article.year}`,
      "writing",
      JSON.stringify(article),
      null,
      article.url
    )
  ),
  ...featuredArticles.map((article) =>
    source(
      `press-${normalizeId(article.title)}`,
      article.title,
      `${article.publication} · ${article.year}`,
      "writing",
      JSON.stringify(article),
      null,
      article.url
    )
  ),
  ...manifesto.map((entry) =>
    source(
      `manifesto-${entry.index}`,
      entry.title,
      `Product principle ${entry.index}`,
      "about",
      JSON.stringify(entry)
    )
  ),
  source(
    "mcp-server",
    "Public MCP server",
    "Agent-readable portfolio with grounded tools",
    "mcp",
    "The portfolio exposes bio, manifesto, projects, experience, writing, contact, resume, availability, and free-form grounded Q&A through MCP."
  ),
];

const sourceById = new Map(sources.map((item) => [item.id, item]));
const sourceIds = sources.map((item) => item.id);

function publicSource(item: SourceRecord): AgentSource {
  const { content: _content, ...result } = item;
  return result;
}

function buildInstructions() {
  const catalog = sources.map((item) => ({
    id: item.id,
    label: item.label,
    app: item.appId,
    evidence: item.content,
  }));

  return `You are Agent.app, the evidence-grounded portfolio assistant for Joscha Koepke.

Rules:
- Answer only from the source catalog below. Never invent facts.
- Refer to Joscha in third person using he/him.
- Be concise, candid, and specific. Avoid generic praise and sales language.
- Prefer measurable evidence and concrete examples.
- If the catalog does not answer the question, say so directly.
- Return 1-4 evidence items. Each factual claim must use the strongest matching source_id.
- Use only source IDs from the catalog.
- Suggested questions must be short, useful follow-ups and must be answerable from the catalog.

SOURCE CATALOG:
${JSON.stringify(catalog)}`;
}

function extractOutputText(response: OpenAIResponse) {
  if (response.output_text) return response.output_text;

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text) {
        return content.text;
      }
    }
  }

  return "";
}

function hydrateAnswer(
  question: string,
  structured: StructuredAgentResponse,
  mode: AgentAnswer["mode"],
  notice: string | null
): AgentAnswer {
  const used = new Set<string>();
  const evidence: AgentEvidence[] = [];

  for (const item of structured.evidence) {
    const matched = sourceById.get(item.source_id);
    if (!matched || used.has(matched.id)) continue;
    used.add(matched.id);
    evidence.push({ claim: item.claim, source: publicSource(matched) });
  }

  return {
    question,
    answer: structured.answer,
    evidence: evidence.slice(0, 4),
    suggestedQuestions: structured.suggested_questions.slice(0, 3),
    mode,
    notice,
  };
}

function localAnswer(question: string, notice: string): AgentAnswer {
  const stopWords = new Set([
    "about",
    "around",
    "built",
    "does",
    "has",
    "joscha",
    "that",
    "what",
    "with",
  ]);
  const terms = question
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2 && !stopWords.has(term));

  const ranked = sources
    .map((item) => {
      const haystack = `${item.label} ${item.detail} ${item.content}`.toLowerCase();
      const score = terms.reduce(
        (total, term) => total + (haystack.includes(term) ? 1 : 0),
        0
      );
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const matches = ranked.length
    ? ranked
    : sources
        .filter((item) => ["bio", "impact-1", "project-engramviz"].includes(item.id))
        .map((item) => ({ item, score: 0 }));

  const evidence = matches.map(({ item }) => ({
    claim: item.detail,
    source: publicSource(item),
  }));
  const strongestClaims = evidence
    .slice(0, 2)
    .map(({ claim }) => claim.replace(/\s+/g, " ").trim());

  return {
    question,
    answer: strongestClaims.length
      ? `The strongest matching evidence is: ${strongestClaims.join(" ")}`
      : "The portfolio does not currently contain enough evidence to answer that question.",
    evidence,
    suggestedQuestions: agentStarterQuestions,
    mode: "local",
    notice,
  };
}

export async function askJoschaAgent(question: string): Promise<AgentAnswer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return localAnswer(
      question,
      "Live synthesis is temporarily unavailable. Showing the strongest indexed evidence."
    );
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      reasoning: { effort: "low" },
      instructions: buildInstructions(),
      input: question,
      max_output_tokens: 1200,
      text: {
        format: {
          type: "json_schema",
          name: "joscha_agent_answer",
          strict: true,
          schema: {
            type: "object",
            properties: {
              answer: { type: "string" },
              evidence: {
                type: "array",
                maxItems: 4,
                items: {
                  type: "object",
                  properties: {
                    claim: { type: "string" },
                    source_id: { type: "string", enum: sourceIds },
                  },
                  required: ["claim", "source_id"],
                  additionalProperties: false,
                },
              },
              suggested_questions: {
                type: "array",
                maxItems: 3,
                items: { type: "string" },
              },
            },
            required: ["answer", "evidence", "suggested_questions"],
            additionalProperties: false,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(25_000),
  });

  const data = (await response.json()) as OpenAIResponse;
  if (!response.ok) {
    throw new Error(data.error?.message ?? `OpenAI request failed (${response.status})`);
  }

  const outputText = extractOutputText(data);
  if (!outputText) {
    throw new Error("OpenAI returned no structured output.");
  }

  const structured = JSON.parse(outputText) as StructuredAgentResponse;
  return hydrateAnswer(question, structured, "openai", null);
}

export function fallbackAgentAnswer(question: string, reason: string) {
  return localAnswer(question, reason);
}
