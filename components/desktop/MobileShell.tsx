"use client";

import Terminal from "@/components/Terminal";
import { WindowContent } from "@/components/desktop/AppWindows";
import {
  agentShortcut,
  shortcuts,
  windowDefaults,
} from "@/components/desktop/config";
import type { AgentPhase } from "@/components/desktop/types";
import {
  analyticsDestination,
  currentLayout,
  trackEvent,
  trackMeaningfulAction,
} from "@/lib/analytics";
import type { TerminalAppId } from "@/lib/commands";
import type { AgentAnswer, AgentSource } from "@/lib/agent-types";

export function MobileShell({
  clock,
  mobilePanel,
  setMobilePanel,
  openApp,
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
  clock: string;
  mobilePanel: TerminalAppId | null;
  setMobilePanel: (id: TerminalAppId | null) => void;
  openApp: (id: TerminalAppId, source?: string) => void;
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
  const mobileShortcuts = [
    ...shortcuts.filter((shortcut) =>
      ["terminal", "projects", "resume", "writing", "surf", "mcp", "about", "engramviz"].includes(
        shortcut.id
      )
    ),
    agentShortcut,
  ];

  return (
    <section className="mobile-shell md:hidden">
      <div className="mobile-time-chip">{clock}</div>
      <div className="mobile-terminal-frame">
        <Terminal
          embedded
          onOpenApp={(id) => {
            if (id === "terminal") {
              setMobilePanel(null);
            } else {
              setMobilePanel(id);
            }
          }}
        />
      </div>
      {mobilePanel && mobilePanel !== "terminal" && (
        <div className={`mobile-panel mobile-panel-${mobilePanel}`}>
          <div className="mobile-panel-bar">
            <span>{windowDefaults[mobilePanel].title}</span>
            <button type="button" onClick={() => setMobilePanel(null)}>
              Close
            </button>
          </div>
          <div className="mobile-panel-body">
            <WindowContent
              appId={mobilePanel}
              openApp={openApp}
              selectedProjectName={selectedProjectName}
              onSelectProject={onSelectProject}
              agentQuestion={agentQuestion}
              agentAnswer={agentAnswer}
              agentLoading={agentLoading}
              agentPhase={agentPhase}
              agentError={agentError}
              onAskAgent={onAskAgent}
              onOpenAgentSource={(source) => {
                onOpenAgentSource(source);
                setMobilePanel(source.appId);
              }}
            />
          </div>
        </div>
      )}
      <div className="mobile-dock" aria-label="Mobile app drawer">
        {mobileShortcuts.map((shortcut) => (
          <button
            type="button"
            key={shortcut.id}
            className="mobile-dock-item"
            onClick={() => {
              trackEvent("dock_click", { item: shortcut.id, layout: "mobile" });
              if (shortcut.href) {
                trackMeaningfulAction("outbound_link", {
                  source: "mobile_dock",
                });
                trackEvent("outbound_link_click", {
                  source: "mobile_dock",
                  destination: analyticsDestination(shortcut.href),
                });
                window.open(shortcut.href, "_blank", "noopener,noreferrer");
                return;
              }
              if (shortcut.appId === "terminal") {
                trackMeaningfulAction("app_open:terminal", {
                  source: "mobile_dock",
                });
                trackEvent("app_open", {
                  app: "terminal",
                  source: "mobile_dock",
                  layout: currentLayout(),
                });
                setMobilePanel(null);
              } else if (shortcut.appId) {
                trackMeaningfulAction(`app_open:${shortcut.appId}`, {
                  source: "mobile_dock",
                });
                trackEvent("app_open", {
                  app: shortcut.appId,
                  source: "mobile_dock",
                  layout: currentLayout(),
                });
                if (shortcut.appId === "resume") {
                  trackEvent("resume_view", {
                    source: "mobile_dock",
                    layout: currentLayout(),
                  });
                }
                setMobilePanel(shortcut.appId);
              }
            }}
            aria-label={`Open ${shortcut.label}`}
            title={shortcut.label}
          >
            <span className={`dock-symbol ${shortcut.type}`}>{shortcut.initials}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
