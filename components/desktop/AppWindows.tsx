"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Terminal from "@/components/Terminal";
import SurfGame from "@/components/SurfGame";
import type { AgentPhase } from "@/components/desktop/types";
import {
  authoredArticles,
  bio,
  contact,
  featuredArticles,
  mcpTools,
  openToWork,
  projects,
  resume,
} from "@/content/data";
import {
  analyticsDestination,
  currentLayout,
  trackEvent,
  trackMeaningfulAction,
} from "@/lib/analytics";
import type { TerminalAppId } from "@/lib/commands";
import {
  agentStarterQuestions,
  type AgentAnswer,
  type AgentSource,
} from "@/lib/agent-types";

function normalizeAnalyticsLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

function TrackedLink({
  href,
  children,
  className = "",
  eventName = "outbound_link_click",
  eventParams = {},
  download,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  eventName?: string;
  eventParams?: Record<string, string | number | boolean | undefined>;
  download?: string;
}) {
  return (
    <a
      href={href}
      target={download ? undefined : "_blank"}
      rel={download ? undefined : "noopener noreferrer"}
      className={className}
      download={download}
      onClick={() =>
        {
          trackMeaningfulAction(eventName, {
            source: "desktop_window",
          });
          trackEvent(eventName, {
            source: "desktop_window",
            destination: analyticsDestination(href),
            layout: currentLayout(),
            ...eventParams,
          });
        }
      }
    >
      {children}
    </a>
  );
}

export function WindowContent({
  appId,
  openApp,
  active = true,
  selectedProjectName,
  onSelectProject,
  agentQuestion,
  agentAnswer,
  agentLoading,
  agentPhase,
  agentError,
  onAskAgent,
  onOpenAgentSource,
}: {
  appId: TerminalAppId;
  openApp: (id: TerminalAppId, source?: string) => void;
  active?: boolean;
  selectedProjectName: string;
  onSelectProject: (name: string) => void;
  agentQuestion: string;
  agentAnswer: AgentAnswer | null;
  agentLoading: boolean;
  agentPhase: AgentPhase;
  agentError: string | null;
  onAskAgent: (question: string) => void;
  onOpenAgentSource: (source: AgentSource) => void;
}) {
  if (appId === "terminal") {
    return <Terminal embedded onOpenApp={(id) => openApp(id, "terminal")} />;
  }
  if (appId === "agent") {
    return (
      <AgentWindow
        question={agentQuestion}
        answer={agentAnswer}
        loading={agentLoading}
        phase={agentPhase}
        error={agentError}
        onAsk={onAskAgent}
        onOpenSource={onOpenAgentSource}
      />
    );
  }
  if (appId === "projects") {
    return (
      <ProjectsWindow
        selectedProjectName={selectedProjectName}
        onSelectProject={onSelectProject}
      />
    );
  }
  if (appId === "resume") return <ResumeWindow />;
  if (appId === "writing") return <WritingWindow />;
  if (appId === "mcp") return <McpWindow />;
  if (appId === "about") return <AboutWindow />;
  if (appId === "coffee") return <CoffeeWindow />;
  if (appId === "surf") return <SurfGame active={active} />;
  return null;
}

function AgentWindow({
  question,
  answer,
  loading,
  phase,
  error,
  onAsk,
  onOpenSource,
}: {
  question: string;
  answer: AgentAnswer | null;
  loading: boolean;
  phase: AgentPhase;
  error: string | null;
  onAsk: (question: string) => void;
  onOpenSource: (source: AgentSource) => void;
}) {
  const [draft, setDraft] = useState(question);

  useEffect(() => {
    setDraft(question);
  }, [question]);

  const phases: Array<{ id: AgentPhase; label: string }> = [
    { id: "searching", label: "Searching portfolio evidence" },
    { id: "reading", label: "Reading projects and experience" },
    { id: "synthesizing", label: "Grounding the answer" },
  ];
  const phaseOrder: AgentPhase[] = [
    "idle",
    "searching",
    "reading",
    "synthesizing",
    "done",
  ];
  const currentPhase = phaseOrder.indexOf(phase);

  const submit = (value: string) => {
    const next = value.trim();
    if (next.length < 3 || loading) return;
    setDraft(next);
    onAsk(next);
  };

  return (
    <div className="agent-window">
      <header className="agent-header">
        <div>
          <div className="window-kicker">Evidence-grounded portfolio</div>
          <h1>Ask Joscha</h1>
        </div>
        <span className={`agent-mode ${answer?.mode ?? "ready"}`}>
          {answer?.mode === "openai"
            ? "OpenAI grounded"
            : answer?.mode === "local"
              ? "Local evidence"
              : "Ready"}
        </span>
      </header>

      <form
        className="agent-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about Joscha's experience, projects, or product thinking"
          rows={3}
          maxLength={500}
          aria-label="Question for Agent.app"
        />
        <div className="agent-form-actions">
          <span>{draft.length}/500</span>
          <button type="submit" disabled={loading || draft.trim().length < 3}>
            {loading ? "Working…" : "Ask"}
          </button>
        </div>
      </form>

      {!question && !answer && !loading && (
        <div className="agent-starters">
          <span>Try a question</span>
          {agentStarterQuestions.map((starter) => (
            <button type="button" key={starter} onClick={() => submit(starter)}>
              {starter}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="agent-trace" aria-live="polite">
          {phases.map((item) => {
            const itemIndex = phaseOrder.indexOf(item.id);
            const state = itemIndex < currentPhase ? "done" : item.id === phase ? "active" : "pending";
            return (
              <div className={`agent-trace-row ${state}`} key={item.id}>
                <span />
                {item.label}
              </div>
            );
          })}
        </div>
      )}

      {error && <div className="agent-error">{error}</div>}

      {answer && !loading && (
        <div className="agent-response" aria-live="polite">
          {answer.notice && <div className="agent-notice">{answer.notice}</div>}
          <div className="agent-answer-copy">{answer.answer}</div>

          {answer.evidence.length > 0 && (
            <section className="agent-evidence">
              <h2>Evidence</h2>
              {answer.evidence.map(({ claim, source }) => (
                <button
                  type="button"
                  key={source.id}
                  className="agent-source"
                  onClick={() => onOpenSource(source)}
                >
                  <span className="agent-source-app">{source.appId}</span>
                  <strong>{source.label}</strong>
                  <p>{claim}</p>
                  {source.detail !== claim && <small>{source.detail}</small>}
                </button>
              ))}
            </section>
          )}

          {answer.suggestedQuestions.length > 0 && (
            <section className="agent-followups">
              <h2>Ask next</h2>
              {answer.suggestedQuestions.map((suggestion) => (
                <button type="button" key={suggestion} onClick={() => submit(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectsWindow({
  selectedProjectName,
  onSelectProject,
}: {
  selectedProjectName: string;
  onSelectProject: (name: string) => void;
}) {
  const selected =
    projects.find((project) => project.name === selectedProjectName) ??
    projects[3] ??
    projects[0];

  useEffect(() => {
    if (!selected) return;

    let activeSeconds = 0;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      activeSeconds += 1;
      if (activeSeconds < 10) return;

      trackEvent("case_study_complete", {
        project: normalizeAnalyticsLabel(selected.name),
        completion_method: "10s_active_view",
        layout: currentLayout(),
      });
      window.clearInterval(timer);
    }, 1_000);

    return () => window.clearInterval(timer);
  }, [selected]);

  if (!selected) return null;

  return (
    <div className="app-window projects-window">
      <aside className="project-list" aria-label="Projects">
        {projects.map((project) => (
          <button
            type="button"
            key={project.name}
            className={`project-row ${project.name === selected.name ? "active" : ""}`}
            onClick={() => {
              onSelectProject(project.name);
              trackMeaningfulAction("project_view", {
                project: normalizeAnalyticsLabel(project.name),
              });
              trackEvent("project_view", {
                project: normalizeAnalyticsLabel(project.name),
                source: "project_list",
                layout: currentLayout(),
              });
            }}
          >
            <span>{project.name}</span>
            <small>{project.status}</small>
          </button>
        ))}
      </aside>
      <section className="project-detail">
        <div className="window-kicker">{selected.type} project</div>
        <h1>{selected.name}</h1>
        <p>{selected.description}</p>
        {selected.url && (
          <TrackedLink
            href={selected.url}
            className="primary-link"
            eventName="project_outbound_click"
            eventParams={{ project: normalizeAnalyticsLabel(selected.name) }}
          >
            Open project
          </TrackedLink>
        )}
      </section>
    </div>
  );
}

function ResumeWindow() {
  return (
    <div className="app-window document-window">
      <div className="document-header">
        <div>
          <div className="window-kicker">Resume</div>
          <h1>{bio.name}</h1>
        </div>
        <div className="document-header-actions">
          <p>{bio.role} · {bio.location}</p>
          <TrackedLink
            href="/Joscha-Koepke-Resume.pdf"
            className="document-action"
            eventName="resume_download"
            download="Joscha-Koepke-Resume.pdf"
          >
            Download PDF
          </TrackedLink>
        </div>
      </div>
      <p className="lead">{resume.summary}</p>
      <section className="document-section">
        <h2>Selected Impact</h2>
        {resume.selectedImpact.map((impact) => (
          <p key={impact} className="metric-line">{impact}</p>
        ))}
      </section>
      <section className="document-section">
        <h2>Experience</h2>
        {resume.experience.map((entry) => (
          <article key={`${entry.company}-${entry.dates}`} className="resume-entry">
            <h3>{entry.role} · {entry.company}</h3>
            <p className="muted">{entry.dates}{entry.context ? ` · ${entry.context}` : ""}</p>
            <ul>
              {entry.bullets.slice(0, 3).map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}

function WritingWindow() {
  return (
    <div className="app-window document-window">
      <div className="window-kicker">Writing and Press</div>
      <h1>Articles, interviews, and product thinking</h1>
      <section className="document-section">
        <h2>Featured</h2>
        {featuredArticles.map((article) => (
          <ArticleRow key={article.url} article={article} />
        ))}
      </section>
      <section className="document-section">
        <h2>Authored</h2>
        {authoredArticles.map((article) => (
          <ArticleRow key={article.url} article={article} />
        ))}
      </section>
    </div>
  );
}

function ArticleRow({
  article,
}: {
  article: { title: string; url: string; publication: string; year: number };
}) {
  return (
    <TrackedLink
      href={article.url}
      className="article-row"
      eventName="writing_article_click"
      eventParams={{
        article: normalizeAnalyticsLabel(article.title),
        publication: normalizeAnalyticsLabel(article.publication),
      }}
    >
      <span>{article.title}</span>
      <small>{article.publication} · {article.year}</small>
    </TrackedLink>
  );
}

function McpWindow() {
  return (
    <div className="app-window document-window">
      <div className="window-kicker">Agent-readable profile</div>
      <h1>MCP Server</h1>
      <p className="lead">
        This site exposes Joscha's background, projects, writing, and resume data through a public MCP endpoint.
      </p>
      <div className="code-pill">{contact.mcp_url}</div>
      <section className="document-section">
        <h2>Tools</h2>
        <div className="tool-grid">
          {mcpTools.map((tool) => (
            <div className="tool-card" key={tool.name}>
              <strong>{tool.name}</strong>
              <span>{tool.parameters}</span>
              <p>{tool.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AboutWindow() {
  return (
    <div className="app-window document-window">
      <div className="window-kicker">About</div>
      <h1>{bio.name}</h1>
      <p className="lead">{bio.summary}</p>
      <section className="document-section">
        <h2>Current Signal</h2>
        <p>{openToWork.context}</p>
        <p className="muted">{openToWork.ideal_role}</p>
      </section>
      <section className="document-section">
        <h2>Contact</h2>
        <div className="contact-actions">
          <TrackedLink
            href={`mailto:${contact.email}`}
            className="primary-link"
            eventName="contact_click"
            eventParams={{ method: "email" }}
          >
            Email Joscha
          </TrackedLink>
          <TrackedLink
            href={contact.linkedin}
            className="secondary-link"
            eventName="contact_click"
            eventParams={{ method: "linkedin" }}
          >
            LinkedIn
          </TrackedLink>
          <TrackedLink
            href={contact.github}
            className="secondary-link"
            eventName="contact_click"
            eventParams={{ method: "github" }}
          >
            GitHub
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}

function CoffeeWindow() {
  return (
    <div className="app-window note-window">
      <h1>Coffee.txt</h1>
      <p>Current operating assumption: a good espresso machine is a product team productivity tool.</p>
      <p>Preferred shot: 18g in, 36g out, 28 seconds.</p>
      <p className="muted">Status: probably over-caffeinated, still shipping.</p>
    </div>
  );
}
