import { contact } from "@/content/data";
import type { TerminalAppId } from "@/lib/commands";
import type { Shortcut, WindowState } from "@/components/desktop/types";

export const windowDefaults: Record<
  TerminalAppId,
  Omit<WindowState, "id" | "open" | "minimized" | "maximized" | "z">
> = {
  terminal: {
    title: "Terminal",
    x: 150,
    y: 86,
    width: 980,
    height: 680,
    minWidth: 560,
    minHeight: 420,
  },
  agent: {
    title: "Agent.app",
    x: 34,
    y: 60,
    width: 520,
    height: 650,
    minWidth: 420,
    minHeight: 460,
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
  surf: {
    title: "Surf.app",
    x: 180,
    y: 92,
    width: 760,
    height: 620,
    minWidth: 560,
    minHeight: 480,
  },
};

export const shortcuts: Shortcut[] = [
  {
    id: "terminal",
    label: "Terminal",
    type: "terminal",
    appId: "terminal",
    initials: ">_",
  },
  {
    id: "projects",
    label: "Projects",
    type: "folder",
    appId: "projects",
    initials: "PR",
  },
  {
    id: "resume",
    label: "Resume.pdf",
    type: "file",
    appId: "resume",
    initials: "CV",
  },
  {
    id: "writing",
    label: "Writing",
    type: "folder",
    appId: "writing",
    initials: "WR",
  },
  {
    id: "mcp",
    label: "MCP Server",
    type: "app",
    appId: "mcp",
    initials: "MCP",
  },
  {
    id: "about",
    label: "About.txt",
    type: "file",
    appId: "about",
    initials: "AB",
  },
  {
    id: "engramviz",
    label: "EngramViz.app",
    type: "app",
    href: "https://www.engramviz.com",
    initials: "EV",
  },
  {
    id: "github",
    label: "GitHub.url",
    type: "url",
    href: contact.github,
    initials: "GH",
  },
  {
    id: "linkedin",
    label: "LinkedIn.url",
    type: "url",
    href: contact.linkedin,
    initials: "IN",
  },
  {
    id: "coffee",
    label: "Coffee.txt",
    type: "file",
    appId: "coffee",
    initials: "CF",
  },
  {
    id: "surf",
    label: "Surf.app",
    type: "app",
    appId: "surf",
    initials: "SF",
  },
];

export const agentShortcut: Shortcut = {
  id: "agent",
  label: "Agent.app",
  type: "app",
  appId: "agent",
  initials: "AI",
};

export const DesktopEdgeGap = 8;
export const DesktopTopGap = 38;
export const DesktopBottomGap = 88;
export const WindowTitlebarHeight = 36;
export const DesktopIconWidth = 96;
export const DesktopIconHeight = 98;
export const DesktopIconDragThreshold = 4;
