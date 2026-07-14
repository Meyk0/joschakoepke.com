"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  runCommand,
  commandNames,
  CommandResult,
  TerminalAppId,
  terminalAppNames,
  terminalDirectoryNames,
  terminalFileNames,
  terminalProjectNames,
} from "@/lib/commands";
import { trackEvent, trackMeaningfulAction } from "@/lib/analytics";
import CommandOutput from "./CommandOutput";
import StatusBar from "./StatusBar";

interface HistoryEntry {
  command: string;
  result: CommandResult;
}

interface TerminalProps {
  embedded?: boolean;
  className?: string;
  onOpenApp?: (appId: TerminalAppId) => void;
  onCommand?: (command: string) => void;
}

const WELCOME_LINE =
  "Welcome. I'm Joscha Koepke - I love espresso and Golden Retrievers.";

const baseCommandNames = Array.from(
  new Set([
    ...commandNames.filter((command) => !command.includes(" ")),
    "cd",
    "git",
    "history",
    "sound",
    "theme",
  ])
).sort();
const themeNames = ["dark", "light", "matrix"];
const soundNames = ["on", "off"];
const mcpSubcommands = ["tools", "connect"];
const gitCompletions = ["git log", "git log --oneline", "git status"];

function completionsForInput(value: string) {
  const trimmedStart = value.trimStart().toLowerCase();
  if (!trimmedStart) return [];

  const hasSpace = /\s/.test(trimmedStart);
  const hasTrailingSpace = /\s$/.test(value);
  const [command = "", ...rest] = trimmedStart.split(/\s+/);
  const argPrefix = hasTrailingSpace ? "" : rest.join(" ");

  if (!hasSpace) {
    return baseCommandNames.filter((candidate) =>
      candidate.startsWith(trimmedStart)
    );
  }

  if (command === "open") {
    return completeArgument(command, argPrefix, terminalAppNames);
  }
  if (command === "cat") {
    return completeArgument(command, argPrefix, terminalFileNames);
  }
  if (command === "project") {
    return completeArgument(command, argPrefix, terminalProjectNames);
  }
  if (command === "cd") {
    return completeArgument(command, argPrefix, terminalDirectoryNames);
  }
  if (command === "theme") {
    return completeArgument(command, argPrefix, themeNames);
  }
  if (command === "sound") {
    return completeArgument(command, argPrefix, soundNames);
  }
  if (command === "mcp") {
    return completeArgument(command, argPrefix, mcpSubcommands);
  }
  if (command === "git") {
    return gitCompletions.filter((candidate) =>
      candidate.startsWith(trimmedStart)
    );
  }

  return [];
}

function completeArgument(
  command: string,
  argPrefix: string,
  candidates: string[]
) {
  return candidates
    .filter((candidate) => candidate.toLowerCase().startsWith(argPrefix))
    .map((candidate) => `${command} ${candidate}`);
}

export default function Terminal({
  embedded = false,
  className = "",
  onOpenApp,
  onCommand,
}: TerminalProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autocomplete, setAutocomplete] = useState<string[]>([]);
  const [acIndex, setAcIndex] = useState(-1);
  const [typedWelcome, setTypedWelcome] = useState("");
  const [bootDone, setBootDone] = useState(false);
  const [bootDate, setBootDate] = useState("");
  const [theme, setTheme] = useState<"dark" | "light" | "matrix">("dark");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const completionCycleRef = useRef<{
    matches: string[];
    index: number;
  } | null>(null);

  useEffect(() => {
    setBootDate(
      new Date().toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    );
  }, []);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < WELCOME_LINE.length) {
        setTypedWelcome(WELCOME_LINE.slice(0, i + 1));
        i++;
      } else {
        clearInterval(id);
        setBootDone(true);
      }
    }, 30 + Math.random() * 20);
    return () => clearInterval(id);
  }, []);

  const playBeep = useCallback(
    (freq: number, duration: number) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.03;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration / 1000);
      } catch {
        // Ignore browser audio restrictions.
      }
    },
    [soundEnabled]
  );

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom, typedWelcome]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.style.setProperty("--bg", "#e8e8e0");
      root.style.setProperty("--surface", "#f0f0e8");
      root.style.setProperty("--surface-2", "#e0e0d8");
      root.style.setProperty("--border", "#c0c0b0");
      root.style.setProperty("--border-dim", "#d0d0c0");
      root.style.setProperty("--green", "#006633");
      root.style.setProperty("--green-dim", "#338855");
      root.style.setProperty("--green-muted", "#88aa88");
      root.style.setProperty("--text", "#1a1a1a");
      root.style.setProperty("--text-dim", "#555555");
      root.style.setProperty("--text-muted", "#888888");
      root.style.setProperty("--text-faint", "#aaaaaa");
      root.style.setProperty("--status-bar", "#006633");
      root.style.setProperty("--status-text", "#e0f0e0");
    } else if (theme === "matrix") {
      root.style.setProperty("--bg", "#000000");
      root.style.setProperty("--surface", "#000a00");
      root.style.setProperty("--surface-2", "#001a00");
      root.style.setProperty("--border", "#003300");
      root.style.setProperty("--border-dim", "#002200");
      root.style.setProperty("--green", "#00ff00");
      root.style.setProperty("--green-dim", "#00aa00");
      root.style.setProperty("--green-muted", "#005500");
      root.style.setProperty("--text", "#00ff00");
      root.style.setProperty("--text-dim", "#00bb00");
      root.style.setProperty("--text-muted", "#007700");
      root.style.setProperty("--text-faint", "#004400");
      root.style.setProperty("--amber", "#00ff00");
      root.style.setProperty("--status-bar", "#00ff00");
      root.style.setProperty("--status-text", "#000a00");
    } else {
      root.style.setProperty("--bg", "#060a06");
      root.style.setProperty("--surface", "#080d08");
      root.style.setProperty("--surface-2", "#0a120a");
      root.style.setProperty("--border", "#1a2a1a");
      root.style.setProperty("--border-dim", "#0d1a0d");
      root.style.setProperty("--green", "#00ff88");
      root.style.setProperty("--green-dim", "#65b86a");
      root.style.setProperty("--green-muted", "#2a4a2a");
      root.style.setProperty("--text", "#c8d8c8");
      root.style.setProperty("--text-dim", "#8a9e8a");
      root.style.setProperty("--text-muted", "#7f947f");
      root.style.setProperty("--text-faint", "#627062");
      root.style.setProperty("--amber", "#ffb347");
      root.style.setProperty("--status-bar", "#00ff88");
      root.style.setProperty("--status-text", "#003a1a");
    }
  }, [theme]);

  const addHistory = (command: string, result: CommandResult) => {
    if (result.output === "__CLEAR__") {
      setHistory([]);
      return;
    }
    setHistory((prev) => [...prev, { command, result }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const [commandName = "unknown", ...commandArgs] = trimmed
      .toLowerCase()
      .split(/\s+/);
    trackMeaningfulAction("terminal_command", { command: commandName });
    trackEvent("terminal_command", {
      command: commandName,
      has_arguments: commandArgs.length > 0,
      argument_count: commandArgs.length,
    });
    onCommand?.(trimmed);

    if (trimmed.toLowerCase() === "history") {
      const lines = commandHistory
        .slice()
        .reverse()
        .map((c, i) => `  ${String(i + 1).padStart(4)}  ${c}`);
      addHistory(trimmed, {
        output: lines.length ? lines.join("\n") : "  No commands in history.",
      });
    } else if (trimmed.toLowerCase().startsWith("theme ")) {
      const t = trimmed.toLowerCase().split(" ")[1];
      if (t === "dark" || t === "light" || t === "matrix") {
        setTheme(t);
        addHistory(trimmed, { output: `  Theme switched to ${t}.` });
      } else {
        addHistory(trimmed, {
          output: `  Unknown theme: ${t}. Available: dark, light, matrix`,
        });
      }
    } else if (trimmed.toLowerCase() === "theme") {
      addHistory(trimmed, {
        output: `  Current theme: ${theme}\n  Available: dark, light, matrix\n  Usage: theme [name]`,
      });
    } else if (trimmed.toLowerCase() === "sound on") {
      setSoundEnabled(true);
      addHistory(trimmed, { output: "  Sound effects enabled." });
    } else if (trimmed.toLowerCase() === "sound off") {
      setSoundEnabled(false);
      addHistory(trimmed, { output: "  Sound effects disabled." });
    } else if (trimmed.toLowerCase() === "sound") {
      addHistory(trimmed, {
        output: `  Sound: ${soundEnabled ? "on" : "off"}\n  Usage: sound on | sound off`,
      });
    } else {
      const result = runCommand(trimmed);
      addHistory(trimmed, result);
      if (result.action?.type === "open_app") {
        onOpenApp?.(result.action.appId);
      }
    }

    setCommandHistory((prev) => [trimmed, ...prev]);
    setHistoryIndex(-1);
    setInput("");
    setAutocomplete([]);
    setAcIndex(-1);
    completionCycleRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (autocomplete.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAcIndex((prev) =>
          prev < autocomplete.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAcIndex((prev) =>
          prev > 0 ? prev - 1 : autocomplete.length - 1
        );
        return;
      }
      if (e.key === "Enter" && acIndex >= 0) {
        e.preventDefault();
        setInput(autocomplete[acIndex]);
        setAutocomplete([]);
        setAcIndex(-1);
        completionCycleRef.current = null;
        return;
      }
      if (e.key === "Escape") {
        setAutocomplete([]);
        setAcIndex(-1);
        completionCycleRef.current = null;
        return;
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
        completionCycleRef.current = null;
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
        completionCycleRef.current = null;
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
        completionCycleRef.current = null;
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const cycle = completionCycleRef.current;
      if (
        cycle &&
        cycle.matches.length > 1 &&
        cycle.matches[cycle.index] === input
      ) {
        const index = (cycle.index + 1) % cycle.matches.length;
        completionCycleRef.current = { matches: cycle.matches, index };
        setInput(cycle.matches[index]);
        setAutocomplete(cycle.matches);
        setAcIndex(index);
        return;
      }

      const matches = completionsForInput(input);
      if (matches.length === 1) {
        setInput(matches[0]);
        setAutocomplete([]);
        setAcIndex(-1);
        completionCycleRef.current = null;
      } else if (matches.length > 1) {
        setInput(matches[0]);
        setAutocomplete(matches);
        setAcIndex(0);
        completionCycleRef.current = { matches, index: 0 };
      } else {
        playBeep(440, 80);
        completionCycleRef.current = null;
      }
    } else {
      if (autocomplete.length > 0) {
        setAutocomplete([]);
        setAcIndex(-1);
      }
      completionCycleRef.current = null;
      if (soundEnabled && e.key.length === 1) {
        playBeep(800 + Math.random() * 200, 15);
      }
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const content = (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden ${className}`}
      style={{
        background: "var(--surface)",
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      <div
        ref={scrollRef}
        className="terminal-scroll flex-1 min-w-0 overflow-y-auto overflow-x-hidden cursor-text"
        onClick={focusInput}
      >
        <div className="mb-4 text-xs sm:text-sm leading-none hidden md:block font-mono whitespace-pre">
          <div style={{ color: "#ff5f56" }}>{`       __                __             __ __                 __`}</div>
          <div style={{ color: "#ff9f43" }}>{`      / /___  __________/ /_  ____ _   / //_/___  ___  ____  / /__ ___`}</div>
          <div style={{ color: "#ffda6b" }}>{` __  / / __ \\/ ___/ ___/ __ \\/ __ \`/  / ,< / __ \\/ _ \\/ __ \\/ //_/ _ \\`}</div>
          <div style={{ color: "#00ff88" }}>{`/ /_/ / /_/ (__  ) /__/ / / / /_/ /  / /| / /_/ /  __/ /_/ / ,< /  __/`}</div>
          <div style={{ color: "#5fd7ff" }}>{`\\____/\\____/____/\\___/_/ /_/\\__,_/  /_/ |_\\____/\\___/ .___/_/|_|\\___/`}</div>
          <div style={{ color: "#c084fc" }}>{`                                                   /_/`}</div>
        </div>

        <div className="mb-4 text-xs leading-none hidden sm:block md:hidden font-mono whitespace-pre">
          <div style={{ color: "#ff5f56" }}>{`    __ __`}</div>
          <div style={{ color: "#ff9f43" }}>{`   / / /<`}</div>
          <div style={{ color: "#ffda6b" }}>{`  / / ,<    Joscha Koepke`}</div>
          <div style={{ color: "#00ff88" }}>{` / / /|`}</div>
          <div style={{ color: "#5fd7ff" }}>{`/_/_/ |_\\   Head of Product`}</div>
        </div>

        <div className="mb-3 text-[10px] leading-none sm:hidden font-mono whitespace-pre">
          <div style={{ color: "#ff5f56" }}>{`     _ _  __`}</div>
          <div style={{ color: "#ff9f43" }}>{`    | | |/ /`}</div>
          <div style={{ color: "#ffda6b" }}>{` _  | | ' / `}</div>
          <div style={{ color: "#00ff88" }}>{`| |_| | . \\ `}</div>
          <div style={{ color: "#5fd7ff" }}>{` \\___/|_|\\_\\`}</div>
        </div>
        <div
          className="mb-1 text-sm font-bold sm:hidden"
          style={{ color: "var(--green)" }}
        >
          Joscha Koepke
        </div>
        <div
          className="mb-4 text-xs sm:hidden"
          style={{ color: "var(--text-dim)" }}
        >
          Head of Product
        </div>

        <div className="mb-4 text-xs" style={{ color: "var(--text-faint)" }}>
          joscha-koepke.local ↑ bash · {bootDate}
        </div>

        <div className="mb-2" style={{ color: "var(--text)" }}>
          {typedWelcome}
          {!bootDone && (
            <span
              className="inline-block w-[0.6em] h-[1em] ml-0.5 animate-blink"
              style={{
                background: "var(--green)",
                verticalAlign: "text-bottom",
              }}
            />
          )}
        </div>
        {bootDone && (
          <div className="mb-6" style={{ color: "var(--text-muted)" }}>
            Type <span style={{ color: "var(--green)" }}>help</span> to see
            available commands.
          </div>
        )}

        {history.map((entry, i) => (
          <CommandOutput
            key={`${entry.command}-${i}`}
            command={entry.command}
            result={entry.result}
            index={i}
          />
        ))}

        <div className="flex items-center min-w-0">
          <span
            className="shrink-0"
            style={{ color: "var(--green)", fontWeight: 600 }}
          >
            joscha-koepke@mcp:~$
          </span>
          <form onSubmit={handleSubmit} className="flex-1 relative ml-2 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setAutocomplete([]);
                setAcIndex(-1);
                completionCycleRef.current = null;
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none caret-transparent"
              style={{
                color: "var(--text)",
                fontFamily: "inherit",
                fontSize: "inherit",
              }}
              aria-label="Terminal command input"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
            <span
              className="absolute top-0 pointer-events-none"
              style={{ left: `${input.length}ch` }}
            >
              <span
                className="inline-block w-[0.6em] h-[1.2em] animate-blink"
                style={{ background: "var(--green)" }}
              />
            </span>
          </form>
        </div>

        {autocomplete.length > 0 && (
          <div
            className="mt-1 border rounded text-xs overflow-hidden"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            {autocomplete.map((cmd, i) => (
              <div
                key={cmd}
                className="px-3 py-1 cursor-pointer"
                style={{
                  background:
                    i === acIndex ? "var(--green-muted)" : "transparent",
                  color: i === acIndex ? "var(--green)" : "var(--green-dim)",
                  fontWeight: i === acIndex ? 600 : 400,
                }}
                onClick={() => {
                  setInput(cmd);
                  setAutocomplete([]);
                  setAcIndex(-1);
                  completionCycleRef.current = null;
                  inputRef.current?.focus();
                }}
              >
                {cmd}
              </div>
            ))}
          </div>
        )}
      </div>
      <StatusBar theme={theme} />
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div
      className="min-h-screen w-full px-5 py-6 sm:p-8 animate-page-load overflow-x-hidden flex items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="flex flex-col rounded-lg border overflow-hidden mx-auto"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          height: "min(85vh, 900px)",
          width: "100%",
          maxWidth: "min(64rem, calc(100vw - 2.5rem))",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--border-dim)" }}
        >
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full" style={{ background: "var(--red)" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "var(--amber)" }} />
            <span className="w-3 h-3 rounded-full" style={{ background: "var(--green)" }} />
          </div>
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>
            joscha-koepke — terminal
          </span>
          <div
            className="flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded border"
            style={{
              borderColor: "var(--green-muted)",
              color: "var(--green)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--green)" }}
            />
            MCP live
          </div>
        </div>
        {content}
      </div>
    </div>
  );
}
