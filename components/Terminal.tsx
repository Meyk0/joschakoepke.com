"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { runCommand, commandNames, CommandResult } from "@/lib/commands";
import CommandOutput from "./CommandOutput";
import StatusBar from "./StatusBar";

interface HistoryEntry {
  command: string;
  result: CommandResult;
}

const WELCOME_LINE =
  "Welcome. I'm Joscha Koepke - I love espresso and Golden Retrievers.";

export default function Terminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autocomplete, setAutocomplete] = useState<string[]>([]);
  const [acIndex, setAcIndex] = useState(-1);
  const [typedWelcome, setTypedWelcome] = useState("");
  const [bootDone, setBootDone] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light" | "matrix">("dark");
  const [soundEnabled, setSoundEnabled] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Typing animation ────────────────────────────────────────────────────
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

  // ── Sound helper ────────────────────────────────────────────────────────
  const playBeep = useCallback(
    (freq: number, duration: number) => {
      if (!soundEnabled) return;
      try {
        if (!audioCtxRef.current)
          audioCtxRef.current = new AudioContext();
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
        // ignore audio errors
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

  // ── Theme application ───────────────────────────────────────────────────
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
      // Reset to dark defaults
      root.style.setProperty("--bg", "#060a06");
      root.style.setProperty("--surface", "#080d08");
      root.style.setProperty("--surface-2", "#0a120a");
      root.style.setProperty("--border", "#1a2a1a");
      root.style.setProperty("--border-dim", "#0d1a0d");
      root.style.setProperty("--green", "#00ff88");
      root.style.setProperty("--green-dim", "#4a8a4a");
      root.style.setProperty("--green-muted", "#2a4a2a");
      root.style.setProperty("--text", "#c8d8c8");
      root.style.setProperty("--text-dim", "#8a9e8a");
      root.style.setProperty("--text-muted", "#5a6a5a");
      root.style.setProperty("--text-faint", "#3a4a3a");
      root.style.setProperty("--amber", "#ffb347");
      root.style.setProperty("--status-bar", "#00ff88");
      root.style.setProperty("--status-text", "#003a1a");
    }
  }, [theme]);

  // ── Command execution ───────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Handle special commands in Terminal context
    if (trimmed.toLowerCase() === "history") {
      const lines = commandHistory
        .slice()
        .reverse()
        .map((c, i) => `  ${String(i + 1).padStart(4)}  ${c}`);
      setHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          result: {
            output: lines.length
              ? lines.join("\n")
              : "  No commands in history.",
          },
        },
      ]);
    } else if (trimmed.toLowerCase().startsWith("theme ")) {
      const t = trimmed.toLowerCase().split(" ")[1];
      if (t === "dark" || t === "light" || t === "matrix") {
        setTheme(t);
        setHistory((prev) => [
          ...prev,
          {
            command: trimmed,
            result: { output: `  Theme switched to ${t}.` },
          },
        ]);
      } else {
        setHistory((prev) => [
          ...prev,
          {
            command: trimmed,
            result: {
              output: `  Unknown theme: ${t}. Available: dark, light, matrix`,
            },
          },
        ]);
      }
    } else if (trimmed.toLowerCase() === "theme") {
      setHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          result: {
            output: `  Current theme: ${theme}\n  Available: dark, light, matrix\n  Usage: theme [name]`,
          },
        },
      ]);
    } else if (trimmed.toLowerCase() === "sound on") {
      setSoundEnabled(true);
      setHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          result: { output: "  Sound effects enabled. 🔊" },
        },
      ]);
    } else if (trimmed.toLowerCase() === "sound off") {
      setSoundEnabled(false);
      setHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          result: { output: "  Sound effects disabled. 🔇" },
        },
      ]);
    } else if (trimmed.toLowerCase() === "sound") {
      setHistory((prev) => [
        ...prev,
        {
          command: trimmed,
          result: {
            output: `  Sound: ${soundEnabled ? "on" : "off"}\n  Usage: sound on | sound off`,
          },
        },
      ]);
    } else {
      const result = runCommand(trimmed);
      if (result.output === "__CLEAR__") {
        setHistory([]);
      } else {
        setHistory((prev) => [...prev, { command: trimmed, result }]);
      }
    }

    setCommandHistory((prev) => [trimmed, ...prev]);
    setHistoryIndex(-1);
    setInput("");
    setAutocomplete([]);
    setAcIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Autocomplete navigation
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
        return;
      }
      if (e.key === "Escape") {
        setAutocomplete([]);
        setAcIndex(-1);
        return;
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const trimmed = input.trim().toLowerCase();
      if (!trimmed) return;

      const allCommands = [
        ...commandNames,
        "history",
        "theme",
        "sound",
      ];
      const matches = allCommands.filter((c) => c.startsWith(trimmed));
      if (matches.length === 1) {
        setInput(matches[0]);
        setAutocomplete([]);
        setAcIndex(-1);
      } else if (matches.length > 1) {
        setAutocomplete(matches);
        setAcIndex(0);
      } else {
        // No match — bell
        playBeep(440, 80);
      }
    } else {
      if (autocomplete.length > 0) {
        setAutocomplete([]);
        setAcIndex(-1);
      }
      // Subtle keypress sound
      if (soundEnabled && e.key.length === 1) {
        playBeep(800 + Math.random() * 200, 15);
      }
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const bootDate = new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4 sm:p-8 animate-page-load"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="flex flex-col w-full max-w-5xl rounded-lg border overflow-hidden"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          height: "min(85vh, 900px)",
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: "var(--border-dim)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: "var(--red)" }}
              />
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: "var(--amber)" }}
              />
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: "var(--green)" }}
              />
            </div>
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

        {/* Terminal body */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-5 cursor-text"
          onClick={focusInput}
        >
          {/* ASCII banner — rainbow (desktop) */}
          <div className="mb-4 text-xs sm:text-sm leading-none hidden md:block font-mono whitespace-pre">
            <div style={{ color: "#ff5f56" }}>{`       __                __             __ __                 __`}</div>
            <div style={{ color: "#ff9f43" }}>{`      / /___  __________/ /_  ____ _   / //_/___  ___  ____  / /__ ___`}</div>
            <div style={{ color: "#ffda6b" }}>{` __  / / __ \\/ ___/ ___/ __ \\/ __ \`/  / ,< / __ \\/ _ \\/ __ \\/ //_/ _ \\`}</div>
            <div style={{ color: "#00ff88" }}>{`/ /_/ / /_/ (__  ) /__/ / / / /_/ /  / /| / /_/ /  __/ /_/ / ,< /  __/`}</div>
            <div style={{ color: "#5fd7ff" }}>{`\\____/\\____/____/\\___/_/ /_/\\__,_/  /_/ |_\\____/\\___/ .___/_/|_|\\___/`}</div>
            <div style={{ color: "#c084fc" }}>{`                                                   /_/`}</div>
          </div>
          {/* Tablet: compact ASCII */}
          <div className="mb-4 text-xs leading-none hidden sm:block md:hidden font-mono whitespace-pre">
            <div style={{ color: "#ff5f56" }}>{`    __ __`}</div>
            <div style={{ color: "#ff9f43" }}>{`   / / /<`}</div>
            <div style={{ color: "#ffda6b" }}>{`  / / ,<    Joscha Koepke`}</div>
            <div style={{ color: "#00ff88" }}>{` / / /|`}</div>
            <div style={{ color: "#5fd7ff" }}>{`/_/_/ |_\\   Head of Product`}</div>
          </div>
          {/* Mobile: plain text */}
          <div
            className="mb-4 text-lg font-bold sm:hidden"
            style={{ color: "var(--green)" }}
          >
            Joscha Koepke
          </div>

          {/* Boot line */}
          <div
            className="mb-4 text-xs"
            style={{ color: "var(--text-faint)" }}
          >
            joscha-koepke.local ↑ bash · mcp/v1 ready · {bootDate}
          </div>

          {/* Welcome — typing animation */}
          <div className="mb-2" style={{ color: "var(--text)" }}>
            {typedWelcome}
            {!bootDone && (
              <span
                className="inline-block w-[0.6em] h-[1em] ml-0.5 animate-blink"
                style={{ background: "var(--green)", verticalAlign: "text-bottom" }}
              />
            )}
          </div>
          {bootDone && (
            <div className="mb-6" style={{ color: "var(--text-muted)" }}>
              Type <span style={{ color: "var(--green)" }}>help</span> to see
              available commands.
            </div>
          )}

          {/* Command history */}
          {history.map((entry, i) => (
            <CommandOutput
              key={i}
              command={entry.command}
              result={entry.result}
              index={i}
            />
          ))}

          {/* Current input line */}
          <div className="flex items-center">
            <span style={{ color: "var(--green)", fontWeight: 600 }}>
              joscha-koepke@mcp:~$
            </span>
            <form onSubmit={handleSubmit} className="flex-1 relative ml-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none caret-transparent"
                style={{
                  color: "var(--text)",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
              />
              {/* Fake cursor */}
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

          {/* Autocomplete dropdown — styled */}
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
                    color:
                      i === acIndex ? "var(--green)" : "var(--green-dim)",
                    fontWeight: i === acIndex ? 600 : 400,
                  }}
                  onClick={() => {
                    setInput(cmd);
                    setAutocomplete([]);
                    setAcIndex(-1);
                    inputRef.current?.focus();
                  }}
                >
                  {cmd}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status bar */}
        <StatusBar theme={theme} />
      </div>
    </div>
  );
}
