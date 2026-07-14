import type { TerminalAppId } from "@/lib/commands";

export type AgentPhase =
  | "idle"
  | "searching"
  | "reading"
  | "synthesizing"
  | "done";

export type WindowState = {
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

export type ResizeDirection =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

export type Shortcut = {
  id: string;
  label: string;
  type: "folder" | "file" | "app" | "url" | "terminal";
  appId?: TerminalAppId;
  href?: string;
  initials?: string;
};

export type IconPosition = {
  x: number;
  y: number;
};
