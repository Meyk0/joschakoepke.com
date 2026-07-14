"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DesktopIcon,
  DesktopWindow,
  Dock,
  MenuBar,
  Spotlight,
} from "@/components/desktop/DesktopChrome";
import { WindowContent } from "@/components/desktop/AppWindows";
import { MobileShell } from "@/components/desktop/MobileShell";
import {
  agentShortcut,
  DesktopBottomGap,
  DesktopEdgeGap,
  DesktopIconDragThreshold,
  DesktopIconHeight,
  DesktopIconWidth,
  DesktopTopGap,
  shortcuts,
  WindowTitlebarHeight,
  windowDefaults,
} from "@/components/desktop/config";
import type {
  AgentPhase,
  IconPosition,
  ResizeDirection,
  Shortcut,
  WindowState,
} from "@/components/desktop/types";
import { projects } from "@/content/data";
import { TerminalAppId } from "@/lib/commands";
import {
  analyticsDestination,
  currentLayout,
  startEngagementTracking,
  trackEvent,
  trackMeaningfulAction,
} from "@/lib/analytics";
import type { AgentAnswer, AgentSource } from "@/lib/agent-types";

function createInitialWindows(): Record<TerminalAppId, WindowState> {
  return Object.entries(windowDefaults).reduce((acc, [id, defaults], index) => {
    const appId = id as TerminalAppId;
    acc[appId] = {
      id: appId,
      ...defaults,
      open: appId === "terminal",
      minimized: false,
      maximized: false,
      z: 20 + index,
    };
    return acc;
  }, {} as Record<TerminalAppId, WindowState>);
}

function createInitialIconPositions(): Record<string, IconPosition> {
  return shortcuts.reduce((acc, shortcut, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    acc[shortcut.id] = {
      x: 22 + column * 112,
      y: 54 + row * 114,
    };
    return acc;
  }, {} as Record<string, IconPosition>);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampToRange(value: number, min: number, max: number) {
  return clamp(value, min, Math.max(min, max));
}

function getDragBounds(state: Pick<WindowState, "width" | "height">) {
  const fullMaxY = window.innerHeight - state.height - DesktopBottomGap;
  const titlebarVisibleMaxY =
    window.innerHeight - DesktopBottomGap - WindowTitlebarHeight;

  return {
    minX: DesktopEdgeGap,
    maxX: Math.max(DesktopEdgeGap, window.innerWidth - state.width - DesktopEdgeGap),
    minY: DesktopTopGap,
    maxY:
      fullMaxY >= DesktopTopGap
        ? fullMaxY
        : Math.max(DesktopTopGap, titlebarVisibleMaxY),
  };
}

function getIconBounds() {
  return {
    minX: DesktopEdgeGap,
    maxX: Math.max(DesktopEdgeGap, window.innerWidth - DesktopIconWidth - DesktopEdgeGap),
    minY: DesktopTopGap,
    maxY: Math.max(
      DesktopTopGap,
      window.innerHeight - DesktopIconHeight - DesktopBottomGap
    ),
  };
}

function formatClock(date: Date, compact = false) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: compact ? undefined : "short",
    month: compact ? undefined : "short",
    day: compact ? undefined : "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function DesktopShell() {
  const [windows, setWindows] = useState(createInitialWindows);
  const [iconPositions, setIconPositions] = useState(createInitialIconPositions);
  const [clock, setClock] = useState("");
  const [mobilePanel, setMobilePanel] = useState<TerminalAppId | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const [selectedProjectName, setSelectedProjectName] = useState(
    projects[3]?.name ?? projects[0]?.name ?? ""
  );
  const [agentQuestion, setAgentQuestion] = useState("");
  const [agentAnswer, setAgentAnswer] = useState<AgentAnswer | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentPhase, setAgentPhase] = useState<AgentPhase>("idle");
  const [agentError, setAgentError] = useState<string | null>(null);
  const zRef = useRef(80);
  const agentRequestRef = useRef(0);
  const agentWorkspaceSnapshotRef = useRef<Record<TerminalAppId, WindowState> | null>(
    null
  );
  const suppressIconOpenRef = useRef<string | null>(null);
  const dragRef = useRef<{
    id: TerminalAppId;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);
  const resizeRef = useRef<{
    id: TerminalAppId;
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
    direction: ResizeDirection;
  } | null>(null);
  const iconDragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    x: number;
    y: number;
    hasMoved: boolean;
  } | null>(null);

  useEffect(() => {
    const update = () => setClock(formatClock(new Date()));
    update();
    const id = window.setInterval(update, 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => startEngagementTracking(), []);

  useEffect(() => {
    setWindows((prev) => {
      const terminal = prev.terminal;
      const width = clamp(
        Math.min(980, Math.max(terminal.minWidth, window.innerWidth - 280)),
        terminal.minWidth,
        980
      );
      const height = clamp(
        Math.min(680, Math.max(terminal.minHeight, window.innerHeight - 142)),
        terminal.minHeight,
        680
      );
      const x = clamp(
        Math.max(230, Math.round((window.innerWidth - width) / 2)),
        DesktopEdgeGap,
        Math.max(DesktopEdgeGap, window.innerWidth - width - DesktopEdgeGap)
      );
      const y = clampToRange(76, DesktopTopGap, getDragBounds({ width, height }).maxY);

      return {
        ...prev,
        terminal: {
          ...terminal,
          x,
          y,
          width,
          height,
        },
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSpotlightOpen(true);
        trackEvent("spotlight_open", { source: "keyboard" });
      }
      if (event.key === "Escape") {
        setSpotlightOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const focusWindow = useCallback((id: TerminalAppId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        z: ++zRef.current,
      },
    }));
  }, []);

  const openApp = useCallback(
    (id: TerminalAppId, source = "app") => {
      setWindows((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          open: true,
          minimized: false,
          z: ++zRef.current,
        },
      }));
      trackMeaningfulAction(
        source === "agent_source" ? "agent_source" : `app_open:${id}`,
        { app: id, source }
      );
      trackEvent("app_open", {
        app: id,
        source,
        layout: currentLayout(),
      });
      if (id === "resume") {
        trackEvent("resume_view", { source, layout: currentLayout() });
      }
    },
    []
  );

  const startAgentWorkspace = useCallback((question: string) => {
    setAgentQuestion(question);
    setSpotlightOpen(false);
    setSpotlightQuery("");

    if (window.matchMedia("(max-width: 767px)").matches) {
      setMobilePanel("agent");
      return;
    }

    setWindows((prev) => {
      if (!agentWorkspaceSnapshotRef.current) {
        agentWorkspaceSnapshotRef.current = {
          ...prev,
          agent: {
            ...prev.agent,
            open: false,
            minimized: false,
          },
        };
      }

      const width = Math.min(520, Math.max(440, Math.round(window.innerWidth * 0.38)));
      const height = Math.min(680, window.innerHeight - DesktopBottomGap - 54);
      return {
        ...prev,
        agent: {
          ...prev.agent,
          open: true,
          minimized: false,
          maximized: false,
          x: 24,
          y: 48,
          width,
          height,
          z: ++zRef.current,
        },
      };
    });
  }, []);

  const arrangeAgentEvidence = useCallback((answer: AgentAnswer) => {
    const projectSource = answer.evidence.find(({ source }) => source.projectName);
    if (projectSource?.source.projectName) {
      setSelectedProjectName(projectSource.source.projectName);
    }

    if (window.matchMedia("(max-width: 767px)").matches) return;

    const sourceApps = Array.from(
      new Set(answer.evidence.map(({ source }) => source.appId))
    ).slice(0, 2);
    if (!sourceApps.length) return;

    trackMeaningfulAction("shared_workspace_create", {
      source_count: sourceApps.length,
    });
    trackEvent("shared_workspace_create", {
      source_count: sourceApps.length,
      layout: "desktop",
      trigger: "agent_answer",
    });

    if (window.innerWidth < 1080) {
      setWindows((prev) => {
        const next = { ...prev };
        sourceApps.forEach((appId) => {
          next[appId] = {
            ...prev[appId],
            open: true,
            minimized: false,
            z: ++zRef.current,
          };
        });
        next.agent = { ...prev.agent, z: ++zRef.current };
        return next;
      });
      return;
    }

    setWindows((prev) => {
      const next = { ...prev };
      const agent = prev.agent;
      const rightX = agent.x + agent.width + 20;
      const availableWidth = window.innerWidth - rightX - 20;
      const sourceWidth = Math.max(520, availableWidth);
      const sourceHeight = Math.min(680, window.innerHeight - DesktopBottomGap - 54);

      sourceApps.forEach((appId, index) => {
        next[appId] = {
          ...prev[appId],
          open: true,
          minimized: false,
          maximized: false,
          x: Math.min(rightX + index * 22, window.innerWidth - 540),
          y: 48 + index * 24,
          width: Math.min(sourceWidth, window.innerWidth - rightX - 20),
          height: sourceHeight,
          z: ++zRef.current,
        };
      });

      next.agent = { ...agent, z: ++zRef.current };
      return next;
    });
  }, []);

  const runAgentQuestion = useCallback(
    async (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (question.length < 3 || agentLoading) return;

      const requestId = ++agentRequestRef.current;
      const startedAt = performance.now();
      startAgentWorkspace(question);
      setAgentLoading(true);
      setAgentAnswer(null);
      setAgentError(null);
      setAgentPhase("searching");
      trackMeaningfulAction("agent_question", { layout: currentLayout() });
      trackEvent("agent_question_submit", {
        question_length: question.length,
        layout: currentLayout(),
      });

      const phaseTimers = [
        window.setTimeout(() => {
          if (agentRequestRef.current === requestId) setAgentPhase("reading");
        }, 450),
        window.setTimeout(() => {
          if (agentRequestRef.current === requestId) setAgentPhase("synthesizing");
        }, 1050),
      ];

      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
        const payload = (await response.json()) as AgentAnswer & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Agent.app could not answer that question.");
        }
        if (agentRequestRef.current !== requestId) return;

        setAgentAnswer(payload);
        setAgentPhase("done");
        arrangeAgentEvidence(payload);
        trackEvent("agent_answer_complete", {
          mode: payload.mode,
          source_count: payload.evidence.length,
          response_time_ms: Math.round(performance.now() - startedAt),
          layout: currentLayout(),
        });
      } catch (error) {
        if (agentRequestRef.current !== requestId) return;
        setAgentError(
          error instanceof Error ? error.message : "Agent.app could not answer that question."
        );
        setAgentPhase("idle");
        trackEvent("agent_answer_error", {
          response_time_ms: Math.round(performance.now() - startedAt),
          layout: currentLayout(),
        });
      } finally {
        phaseTimers.forEach((timer) => window.clearTimeout(timer));
        if (agentRequestRef.current === requestId) setAgentLoading(false);
      }
    },
    [agentLoading, arrangeAgentEvidence, startAgentWorkspace]
  );

  const openAgentSource = useCallback(
    (source: AgentSource) => {
      if (source.projectName) setSelectedProjectName(source.projectName);
      openApp(source.appId, "agent_source");
      trackEvent("agent_source_open", {
        source_id: source.id,
        app: source.appId,
      });
    },
    [openApp]
  );

  const closeWindow = (id: TerminalAppId) => {
    if (id === "agent" && agentWorkspaceSnapshotRef.current) {
      setWindows(agentWorkspaceSnapshotRef.current);
      agentWorkspaceSnapshotRef.current = null;
      trackEvent("window_close", { app: id, restored_workspace: true });
      return;
    }

    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        open: false,
        minimized: false,
        maximized: false,
      },
    }));
    trackEvent("window_close", { app: id });
  };

  const minimizeWindow = (id: TerminalAppId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        minimized: true,
      },
    }));
    trackEvent("window_minimize", { app: id });
  };

  const toggleMaximize = (id: TerminalAppId) => {
    setWindows((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        open: true,
        minimized: false,
        maximized: !prev[id].maximized,
        z: ++zRef.current,
      },
    }));
    trackEvent("window_maximize", { app: id });
  };

  const openShortcut = (shortcut: Shortcut, source = "icon") => {
    if (source === "icon" && suppressIconOpenRef.current === shortcut.id) {
      suppressIconOpenRef.current = null;
      return;
    }
    trackEvent("desktop_icon_click", { icon: shortcut.id, type: shortcut.type });
    if (shortcut.href) {
      trackMeaningfulAction("outbound_link", { source: `desktop_${source}` });
      trackEvent("outbound_link_click", {
        source: `desktop_${source}`,
        destination: analyticsDestination(shortcut.href),
      });
      window.open(shortcut.href, "_blank", "noopener,noreferrer");
      return;
    }
    if (shortcut.appId) {
      openApp(shortcut.appId, source);
    }
  };

  const startIconDrag = (
    id: string,
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    if (event.button !== 0) return;
    const position = iconPositions[id];
    if (!position) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    iconDragRef.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      x: position.x,
      y: position.y,
      hasMoved: false,
    };
  };

  const startDrag = (
    id: TerminalAppId,
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const state = windows[id];
    if (state.maximized) return;
    event.preventDefault();
    dragRef.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      x: state.x,
      y: state.y,
    };
    focusWindow(id);
  };

  const startResize = (
    id: TerminalAppId,
    event: React.PointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ) => {
    const state = windows[id];
    if (state.maximized) return;
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      x: state.x,
      y: state.y,
      width: state.width,
      height: state.height,
      direction,
    };
    focusWindow(id);
  };

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (dragRef.current) {
        const drag = dragRef.current;
        setWindows((prev) => {
          const state = prev[drag.id];
          const nextX = drag.x + event.clientX - drag.startX;
          const nextY = drag.y + event.clientY - drag.startY;
          const bounds = getDragBounds(state);
          return {
            ...prev,
            [drag.id]: {
              ...state,
              x: clampToRange(nextX, bounds.minX, bounds.maxX),
              y: clampToRange(nextY, bounds.minY, bounds.maxY),
            },
          };
        });
      }

      if (iconDragRef.current) {
        const drag = iconDragRef.current;
        const deltaX = event.clientX - drag.startX;
        const deltaY = event.clientY - drag.startY;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance >= DesktopIconDragThreshold) {
          drag.hasMoved = true;
          const bounds = getIconBounds();
          setIconPositions((prev) => ({
            ...prev,
            [drag.id]: {
              x: clampToRange(drag.x + deltaX, bounds.minX, bounds.maxX),
              y: clampToRange(drag.y + deltaY, bounds.minY, bounds.maxY),
            },
          }));
        }
      }

      if (resizeRef.current) {
        const resize = resizeRef.current;
        setWindows((prev) => {
          const state = prev[resize.id];
          const deltaX = event.clientX - resize.startX;
          const deltaY = event.clientY - resize.startY;
          const affectsLeft = resize.direction.includes("left");
          const affectsRight = resize.direction.includes("right");
          const affectsTop = resize.direction.includes("top");
          const affectsBottom = resize.direction.includes("bottom");
          const maxRight = window.innerWidth - resize.x - 12;
          const maxBottom = window.innerHeight - resize.y - DesktopBottomGap;

          let width = resize.width;
          let height = resize.height;
          let x = resize.x;
          let y = resize.y;

          if (affectsRight) {
            width = clampToRange(resize.width + deltaX, state.minWidth, maxRight);
          }
          if (affectsBottom) {
            height = clampToRange(resize.height + deltaY, state.minHeight, maxBottom);
          }
          if (affectsLeft) {
            width = clampToRange(
              resize.width - deltaX,
              state.minWidth,
              resize.x + resize.width - DesktopEdgeGap
            );
            x = resize.x + resize.width - width;
          }
          if (affectsTop) {
            height = clampToRange(
              resize.height - deltaY,
              state.minHeight,
              resize.y + resize.height - DesktopTopGap
            );
            y = resize.y + resize.height - height;
          }

          return {
            ...prev,
            [resize.id]: {
              ...state,
              x,
              y,
              width,
              height,
            },
          };
        });
      }
    };

    const handleUp = () => {
      if (iconDragRef.current?.hasMoved) {
        const draggedId = iconDragRef.current.id;
        suppressIconOpenRef.current = draggedId;
        window.setTimeout(() => {
          if (suppressIconOpenRef.current === draggedId) {
            suppressIconOpenRef.current = null;
          }
        }, 0);
      }
      dragRef.current = null;
      resizeRef.current = null;
      iconDragRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  const dockShortcuts = useMemo(
    () => {
      const core = shortcuts.filter((shortcut) =>
        ["terminal", "projects", "resume", "surf", "mcp", "github", "linkedin"].includes(
          shortcut.id
        )
      );
      return [core[0], agentShortcut, ...core.slice(1)].filter(Boolean);
    },
    []
  );
  const activeWindowId = useMemo(
    () =>
      Object.values(windows)
        .filter((state) => state.open && !state.minimized)
        .sort((a, b) => b.z - a.z)[0]?.id,
    [windows]
  );

  return (
    <main className="desktop-shell">
      <div className="wallpaper-layer" />
      <div className="desktop-vignette" />

      <section className="hidden md:block">
        <MenuBar
          clock={clock}
          openApp={openApp}
          openSpotlight={() => {
            setSpotlightOpen(true);
            trackEvent("spotlight_open", { source: "menu" });
          }}
        />

        <div className="desktop-icons" aria-label="Desktop shortcuts">
          {shortcuts.map((shortcut) => (
            <DesktopIcon
              key={shortcut.id}
              shortcut={shortcut}
              position={iconPositions[shortcut.id]}
              onOpen={() => openShortcut(shortcut)}
              onDragStart={(event) => startIconDrag(shortcut.id, event)}
            />
          ))}
        </div>

        {Object.values(windows).map((state) => (
          <DesktopWindow
            key={state.id}
            state={state}
            onFocus={() => focusWindow(state.id)}
            onClose={() => closeWindow(state.id)}
            onMinimize={() => minimizeWindow(state.id)}
            onMaximize={() => toggleMaximize(state.id)}
            onDragStart={(event) => startDrag(state.id, event)}
            onResizeStart={(event, direction) =>
              startResize(state.id, event, direction)
            }
          >
            <WindowContent
              appId={state.id}
              openApp={openApp}
              active={state.id === activeWindowId}
              selectedProjectName={selectedProjectName}
              onSelectProject={setSelectedProjectName}
              agentQuestion={agentQuestion}
              agentAnswer={agentAnswer}
              agentLoading={agentLoading}
              agentPhase={agentPhase}
              agentError={agentError}
              onAskAgent={runAgentQuestion}
              onOpenAgentSource={openAgentSource}
            />
          </DesktopWindow>
        ))}

        {spotlightOpen && (
          <Spotlight
            query={spotlightQuery}
            setQuery={setSpotlightQuery}
            onClose={() => setSpotlightOpen(false)}
            onAsk={(question) => {
              trackEvent("search", {
                search_location: "spotlight",
                result_type: "agent",
              });
              runAgentQuestion(question);
            }}
            onSelect={(item) => {
              setSpotlightOpen(false);
              setSpotlightQuery("");
              trackEvent("spotlight_select", {
                item: item.label,
                kind: item.kind,
              });
              if (spotlightQuery.trim()) {
                trackEvent("search", {
                  search_location: "spotlight",
                  result_type: item.kind.toLowerCase(),
                });
              }
              if (item.href) {
                trackMeaningfulAction("outbound_link", { source: "spotlight" });
                trackEvent("outbound_link_click", {
                  source: "spotlight",
                  destination: analyticsDestination(item.href),
                });
                window.open(item.href, "_blank", "noopener,noreferrer");
                return;
              }
              openApp(item.appId, "spotlight");
            }}
          />
        )}

        <Dock
          shortcuts={dockShortcuts}
          windows={windows}
          onOpen={(shortcut) => {
            trackEvent("dock_click", { item: shortcut.id });
            openShortcut(shortcut, "dock");
          }}
        />
      </section>

      <MobileShell
        clock={clock}
        mobilePanel={mobilePanel}
        setMobilePanel={setMobilePanel}
        openApp={openApp}
        selectedProjectName={selectedProjectName}
        onSelectProject={setSelectedProjectName}
        agentQuestion={agentQuestion}
        agentAnswer={agentAnswer}
        agentLoading={agentLoading}
        agentPhase={agentPhase}
        agentError={agentError}
        onAskAgent={runAgentQuestion}
        onOpenAgentSource={openAgentSource}
      />
    </main>
  );
}
