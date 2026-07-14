export type AgentSourceAppId =
  | "projects"
  | "resume"
  | "writing"
  | "about"
  | "mcp";

export type AgentMode = "openai" | "local";

export interface AgentSource {
  id: string;
  label: string;
  detail: string;
  appId: AgentSourceAppId;
  projectName: string | null;
  url: string | null;
}

export interface AgentEvidence {
  claim: string;
  source: AgentSource;
}

export interface AgentAnswer {
  question: string;
  answer: string;
  evidence: AgentEvidence[];
  suggestedQuestions: string[];
  mode: AgentMode;
  notice: string | null;
}

export const agentStarterQuestions = [
  "What has Joscha built around LLM memory?",
  "What evidence shows he can scale AI products?",
  "How does Joscha think about product leadership?",
];
