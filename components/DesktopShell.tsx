"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Terminal from "@/components/Terminal";
import {
  bio,
  contact,
  featuredArticles,
  authoredArticles,
  mcpTools,
  openToWork,
  projects,
  resume,
  Project,
} from "@/content/data";
import { TerminalAppId } from "@/lib/commands";
import { trackEvent } from "@/lib/analytics";

type WindowState = {
  id: TerminalAppId;
  title: string;
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  z: number;
};

type ResizeDirection =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

type Shortcut = {
  id: string;
  label: string;
  type: "folder" | "file" | "app" | "url" | "terminal";
  appId?: TerminalAppId;
  href?: string;
  initials?: string;
};

type IconPosition = {
  x: number;
  y: number;
};

const windowDefaults: Record<TerminalAppId, Omit<WindowState, "id" | "open" | "minimized" | "maximized" | "z">> = {
  terminal: {
    title: "Terminal",
    x: 150,
    y: 86,
    width: 980,
    height: 680,
    minWidth: 560,
    minHeight: 420,
  },
  projects: {
    title: "Projects",
    x: 100,
    y: 74,
    width: 860,
    height: 640,
    minWidth: 560,
    minHeight: 430,
  },
  resume: {
    title: "Resume.pdf",
    x: 190,
    y: 112,
    width: 820,
    height: 660,
    minWidth: 560,
    minHeight: 440,
  },
  writing: {
    title: "Writing",
    x: 230,
    y: 96,
    width: 780,
    height: 560,
    minWidth: 520,
    minHeight: 380,
  },
  mcp: {
    title: "MCP Server",
    x: 260,
    y: 132,
    width: 760,
    height: 560,
    minWidth: 520,
    minHeight: 380,
  },
  about: {
    title: "About.txt",
    x: 300,
    y: 100,
    width: 680,
    height: 480,
    minWidth: 440,
    minHeight: 340,
  },
  coffee: {
    title: "Coffee.txt",
    x: 360,
    y: 156,
    width: 520,
    height: 390,
    minWidth: 360,
    minHeight: 300,
  },
};

const shortcuts: Shortcut[] = [
  { id: "terminal", label: "Terminal", type: "terminal", appId: "terminal", initials: ">_" },
  { id: "projects", label: "Projects", type: "folder", appId: "projects", initials: "PR" },
  { id: "resume", label: "Resume.pdf", type: "file", appId: "resume", initials: "CV" },
  { id: "writing", label: "Writing", type: "folder", appId: "writing", initials: "WR" },
  { id: "mcp", label: "MCP Server", type: "app", appId: "mcp", initials: "MCP" },
  { id: "about", label: "About.txt", type: "file", appId: "about", initials: "AB" },
  { id: "engramviz", label: "EngramViz.app", type: "app", href: "https://www.engramviz.com", initials: "EV" },
  { id: "github", label: "GitHub.url", type: "url", href: contact.github, initials: "GH" },
  { id: "linkedin", label: "LinkedIn.url", type: "url", href: contact.linkedin, initials: "IN" },
  { id: "coffee", label: "Coffee.txt", type: "file", appId: "coffee", initials: "CF" },
];

const DesktopEdgeGap = 8;
const DesktopTopGap = 38;
const DesktopBottomGap = 88;
const WindowTitlebarHeight = 36;
const DesktopIconWidth = 96;
const DesktopIconHeight = 98;
const DesktopIconDragThreshold = 4;

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

function TrackedLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() =>
        trackEvent("outbound_link_click", { source: "desktop_window", href })
      }
    >
      {children}
    </a>
  );
}

export default function DesktopShell() {
  const [windows, setWindows] = useState(createInitialWindows);
  const [iconPositions, setIconPositions] = useState(createInitialIconPositions);
  const [clock, setClock] = useState("");
  const [mobilePanel, setMobilePanel] = useState<TerminalAppId | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const zRef = useRef(80);
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
      setMobilePanel(id === "terminal" ? null : id);
      trackEvent("desktop_app_open", { app: id, source });
    },
    []
  );

  const closeWindow = (id: TerminalAppId) => {
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
      trackEvent("outbound_link_click", {
        source: `desktop_${source}`,
        href: shortcut.href,
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
    () =>
      shortcuts.filter((shortcut) =>
        ["terminal", "projects", "resume", "mcp", "github", "linkedin"].includes(
          shortcut.id
        )
      ),
    []
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
            <WindowContent appId={state.id} openApp={openApp} />
          </DesktopWindow>
        ))}

        {spotlightOpen && (
          <Spotlight
            query={spotlightQuery}
            setQuery={setSpotlightQuery}
            onClose={() => setSpotlightOpen(false)}
            onSelect={(item) => {
              setSpotlightOpen(false);
              setSpotlightQuery("");
              trackEvent("spotlight_select", {
                item: item.label,
                kind: item.kind,
              });
              if (item.href) {
                trackEvent("outbound_link_click", {
                  source: "spotlight",
                  href: item.href,
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
      />
    </main>
  );
}

function MenuBar({
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
          Search <span>⌘K</span>
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

function Spotlight({
  query,
  setQuery,
  onClose,
  onSelect,
}: {
  query: string;
  setQuery: (value: string) => void;
  onClose: () => void;
  onSelect: (item: SpotlightItem) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="spotlight-backdrop" onMouseDown={onClose}>
      <div className="spotlight-panel" onMouseDown={(event) => event.stopPropagation()}>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && results[0]) {
              onSelect(results[0]);
            }
          }}
          placeholder="Search apps, projects, and files"
          aria-label="Spotlight search"
        />
        <div className="spotlight-results">
          {results.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={`spotlight-result ${index === 0 ? "active" : ""}`}
              onClick={() => onSelect(item)}
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

function DesktopIcon({
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

function DesktopWindow({
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

function Dock({
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

function WindowContent({
  appId,
  openApp,
}: {
  appId: TerminalAppId;
  openApp: (id: TerminalAppId, source?: string) => void;
}) {
  if (appId === "terminal") {
    return <Terminal embedded onOpenApp={(id) => openApp(id, "terminal")} />;
  }
  if (appId === "projects") return <ProjectsWindow />;
  if (appId === "resume") return <ResumeWindow />;
  if (appId === "writing") return <WritingWindow />;
  if (appId === "mcp") return <McpWindow />;
  if (appId === "about") return <AboutWindow />;
  if (appId === "coffee") return <CoffeeWindow />;
  return null;
}

function ProjectsWindow() {
  const [selected, setSelected] = useState<Project>(projects[3] ?? projects[0]);

  return (
    <div className="app-window projects-window">
      <aside className="project-list" aria-label="Projects">
        {projects.map((project) => (
          <button
            type="button"
            key={project.name}
            className={`project-row ${project.name === selected.name ? "active" : ""}`}
            onClick={() => setSelected(project)}
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
          <TrackedLink href={selected.url} className="primary-link">
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
        <p>{bio.role} · {bio.location}</p>
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
    <TrackedLink href={article.url} className="article-row">
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
        <p><TrackedLink href={`mailto:${contact.email}`}>{contact.email}</TrackedLink></p>
        <p><TrackedLink href={contact.linkedin}>{contact.linkedin}</TrackedLink></p>
        <p><TrackedLink href={contact.github}>{contact.github}</TrackedLink></p>
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

function MobileShell({
  clock,
  mobilePanel,
  setMobilePanel,
  openApp,
}: {
  clock: string;
  mobilePanel: TerminalAppId | null;
  setMobilePanel: (id: TerminalAppId | null) => void;
  openApp: (id: TerminalAppId, source?: string) => void;
}) {
  const mobileShortcuts = shortcuts.filter((shortcut) =>
    ["terminal", "projects", "resume", "writing", "mcp", "about", "engramviz"].includes(
      shortcut.id
    )
  );

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
        <div className="mobile-panel">
          <div className="mobile-panel-bar">
            <span>{windowDefaults[mobilePanel].title}</span>
            <button type="button" onClick={() => setMobilePanel(null)}>
              Close
            </button>
          </div>
          <div className="mobile-panel-body">
            <WindowContent appId={mobilePanel} openApp={openApp} />
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
                trackEvent("outbound_link_click", {
                  source: "mobile_dock",
                  href: shortcut.href,
                });
                window.open(shortcut.href, "_blank", "noopener,noreferrer");
                return;
              }
              if (shortcut.appId === "terminal") {
                setMobilePanel(null);
              } else if (shortcut.appId) {
                setMobilePanel(shortcut.appId);
              }
            }}
          >
            <span className={`dock-symbol ${shortcut.type}`}>{shortcut.initials}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
