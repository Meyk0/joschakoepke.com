"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { projects } from "@/content/data";
import type { TerminalAppId } from "@/lib/commands";
import type {
  IconPosition,
  ResizeDirection,
  Shortcut,
  WindowState,
} from "@/components/desktop/types";

export function MenuBar({
  clock,
  openApp,
  openSpotlight,
}: {
  clock: string;
  openApp: (id: TerminalAppId, source?: string) => void;
  openSpotlight: () => void;
}) {
  const items: Array<{ label: string; appId: TerminalAppId }> = [
    { label: "Projects", appId: "projects" },
    { label: "Resume", appId: "resume" },
    { label: "Writing", appId: "writing" },
    { label: "MCP", appId: "mcp" },
    { label: "Contact", appId: "about" },
  ];

  return (
    <div className="menu-bar">
      <div className="menu-left">
        {items.map((item) => (
          <button
            type="button"
            key={item.label}
            className="menu-item"
            onClick={() => openApp(item.appId, "menu")}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="menu-right">
        <button type="button" className="menu-search" onClick={openSpotlight}>
          Ask or search <span>⌘K</span>
        </button>
        <span>{clock}</span>
      </div>
    </div>
  );
}

type SpotlightItem = {
  id: string;
  label: string;
  description: string;
  kind: string;
  appId: TerminalAppId;
  href?: string;
};

export function Spotlight({
  query,
  setQuery,
  onClose,
  onSelect,
  onAsk,
}: {
  query: string;
  setQuery: (value: string) => void;
  onClose: () => void;
  onSelect: (item: SpotlightItem) => void;
  onAsk: (question: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const items = useMemo<SpotlightItem[]>(
    () => [
      {
        id: "terminal",
        label: "Terminal",
        description: "Open the interactive portfolio terminal.",
        kind: "App",
        appId: "terminal",
      },
      {
        id: "agent",
        label: "Agent.app",
        description: "Ask an evidence-grounded question about Joscha.",
        kind: "App",
        appId: "agent",
      },
      {
        id: "projects",
        label: "Projects",
        description: "Browse active and shipped projects.",
        kind: "Folder",
        appId: "projects",
      },
      {
        id: "resume",
        label: "Resume.pdf",
        description: "View resume, impact metrics, and experience.",
        kind: "Document",
        appId: "resume",
      },
      {
        id: "writing",
        label: "Writing",
        description: "Read authored articles and interviews.",
        kind: "Folder",
        appId: "writing",
      },
      {
        id: "mcp",
        label: "MCP Server",
        description: "Inspect the public agent-readable profile endpoint.",
        kind: "App",
        appId: "mcp",
      },
      {
        id: "surf",
        label: "Surf.app",
        description: "Play Lineup Runner, a one-button NorCal surf dodging game.",
        kind: "App",
        appId: "surf",
      },
      {
        id: "about",
        label: "About.txt",
        description: "Short profile, focus areas, and contact links.",
        kind: "Document",
        appId: "about",
      },
      ...projects.map((project) => ({
        id: `project-${project.name}`,
        label: project.name,
        description: project.description,
        kind: "Project",
        appId: "projects" as TerminalAppId,
        href: project.url,
      })),
    ],
    []
  );

  const normalized = query.trim().toLowerCase();
  const results = items
    .filter((item) => {
      const haystack = `${item.label} ${item.description} ${item.kind}`.toLowerCase();
      return !normalized || haystack.includes(normalized);
    })
    .slice(0, 8);
  const askAvailable = normalized.length >= 3;
  const exactResult = results.find(
    (item) =>
      item.label.toLowerCase() === normalized ||
      item.label.toLowerCase().replace(/\.(app|pdf|txt)$/, "") === normalized
  );
  const askIsDefault = askAvailable && !exactResult;
  const askOffset = askAvailable ? 1 : 0;
  const defaultResultIndex = exactResult
    ? results.indexOf(exactResult)
    : 0;
  const defaultIndex = askIsDefault ? 0 : askOffset + defaultResultIndex;
  const selectionCount = askOffset + results.length;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(defaultIndex);
  }, [normalized]);

  const activateSelection = () => {
    if (askAvailable && activeIndex === 0) {
      onAsk(query);
      return;
    }

    const item = results[activeIndex - askOffset];
    if (item) onSelect(item);
  };

  return (
    <div className="spotlight-backdrop" onMouseDown={onClose}>
      <div className="spotlight-panel" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && selectionCount > 0) {
              event.preventDefault();
              setActiveIndex((current) => (current + 1) % selectionCount);
              return;
            }
            if (event.key === "ArrowUp" && selectionCount > 0) {
              event.preventDefault();
              setActiveIndex(
                (current) => (current - 1 + selectionCount) % selectionCount
              );
              return;
            }
            if (event.key === "Enter") {
              event.preventDefault();
              activateSelection();
            }
          }}
          placeholder="Search or ask anything about Joscha"
          aria-label="Spotlight search"
        />
        <div className="spotlight-results">
          {askAvailable && (
            <button
              type="button"
              className={`spotlight-result spotlight-ask ${activeIndex === 0 ? "active" : ""}`}
              onClick={() => onAsk(query)}
              onMouseEnter={() => setActiveIndex(0)}
            >
              <span className="spotlight-icon agent">AI</span>
              <span className="spotlight-copy">
                <strong>Ask Joscha</strong>
                <small>Agent · “{query.trim()}”</small>
              </span>
            </button>
          )}
          {results.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={`spotlight-result ${activeIndex === index + askOffset ? "active" : ""}`}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setActiveIndex(index + askOffset)}
            >
              <span className="spotlight-icon">{item.label.slice(0, 2).toUpperCase()}</span>
              <span className="spotlight-copy">
                <strong>{item.label}</strong>
                <small>{item.kind} · {item.description}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DesktopIcon({
  shortcut,
  position,
  onOpen,
  onDragStart,
}: {
  shortcut: Shortcut;
  position: IconPosition;
  onOpen: () => void;
  onDragStart: (event: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      className="desktop-icon"
      style={{ left: position.x, top: position.y }}
      onPointerDown={onDragStart}
      onClick={onOpen}
    >
      <span className={`desktop-icon-symbol ${shortcut.type}`}>
        <span>{shortcut.initials}</span>
      </span>
      <span className="desktop-icon-label">{shortcut.label}</span>
    </button>
  );
}

export function DesktopWindow({
  state,
  children,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onDragStart,
  onResizeStart,
}: {
  state: WindowState;
  children: React.ReactNode;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onDragStart: (event: React.PointerEvent<HTMLDivElement>) => void;
  onResizeStart: (
    event: React.PointerEvent<HTMLDivElement>,
    direction: ResizeDirection
  ) => void;
}) {
  const hidden = !state.open || state.minimized;
  const style = state.maximized
    ? {
        left: 16,
        top: 38,
        width: "calc(100vw - 32px)",
        height: "calc(100vh - 124px)",
        zIndex: state.z,
        display: hidden ? "none" : "flex",
      }
    : {
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        zIndex: state.z,
        display: hidden ? "none" : "flex",
      };

  return (
    <section className="desktop-window" style={style} onPointerDown={onFocus}>
      <div className="window-titlebar" onPointerDown={onDragStart}>
        <div className="window-controls" onPointerDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="window-dot close"
            aria-label={`Close ${state.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
          />
          <button
            type="button"
            className="window-dot minimize"
            aria-label={`Minimize ${state.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onMinimize();
            }}
          />
          <button
            type="button"
            className="window-dot maximize"
            aria-label={`Maximize ${state.title}`}
            onClick={(event) => {
              event.stopPropagation();
              onMaximize();
            }}
          />
        </div>
        <div className="window-title">{state.title}</div>
        <div className="window-title-spacer" />
      </div>
      <div className="window-body">{children}</div>
      {!state.maximized && (
        <>
          <div
            className="window-resize-edge right"
            onPointerDown={(event) => onResizeStart(event, "right")}
          />
          <div
            className="window-resize-edge bottom"
            onPointerDown={(event) => onResizeStart(event, "bottom")}
          />
          <div
            className="window-resize-edge left"
            onPointerDown={(event) => onResizeStart(event, "left")}
          />
          <div
            className="window-resize-edge top"
            onPointerDown={(event) => onResizeStart(event, "top")}
          />
          <div
            className="window-resize-corner top-left"
            onPointerDown={(event) => onResizeStart(event, "top-left")}
          />
          <div
            className="window-resize-corner top-right"
            onPointerDown={(event) => onResizeStart(event, "top-right")}
          />
          <div
            className="window-resize-corner bottom-left"
            onPointerDown={(event) => onResizeStart(event, "bottom-left")}
          />
          <div
            className="window-resize-corner bottom-right window-resize-handle"
            aria-label={`Resize ${state.title}`}
            onPointerDown={(event) => onResizeStart(event, "bottom-right")}
          />
        </>
      )}
    </section>
  );
}

export function Dock({
  shortcuts,
  windows,
  onOpen,
}: {
  shortcuts: Shortcut[];
  windows: Record<TerminalAppId, WindowState>;
  onOpen: (shortcut: Shortcut) => void;
}) {
  return (
    <div className="desktop-dock">
      {shortcuts.map((shortcut) => {
        const running =
          shortcut.appId && windows[shortcut.appId]?.open && !windows[shortcut.appId]?.minimized;
        return (
          <button
            type="button"
            key={shortcut.id}
            className="dock-item"
            onClick={() => onOpen(shortcut)}
            aria-label={`Open ${shortcut.label}`}
          >
            <span className={`dock-symbol ${shortcut.type}`}>{shortcut.initials}</span>
            {running && <span className="dock-running" />}
          </button>
        );
      })}
    </div>
  );
}
