"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { runCommand, commandNames, CommandResult } from "@/lib/commands";
import CommandOutput from "./CommandOutput";
import StatusBar from "./StatusBar";

interface HistoryEntry {
  command: string;
  result: CommandResult;
}

export default function Terminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [autocomplete, setAutocomplete] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const result = runCommand(trimmed);

    if (result.output === "__CLEAR__") {
      setHistory([]);
    } else {
      setHistory((prev) => [...prev, { command: trimmed, result }]);
    }

    setCommandHistory((prev) => [trimmed, ...prev]);
    setHistoryIndex(-1);
    setInput("");
    setAutocomplete([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

      const matches = commandNames.filter((c) => c.startsWith(trimmed));
      if (matches.length === 1) {
        setInput(matches[0]);
        setAutocomplete([]);
      } else if (matches.length > 1) {
        setAutocomplete(matches);
      }
    } else {
      setAutocomplete([]);
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const bootDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="flex flex-col h-screen max-h-screen animate-page-load"
      style={{ background: "var(--bg)" }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
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
          <span className="ml-3 text-xs" style={{ color: "var(--text-dim)" }}>
            joscha-koepke — terminal
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--green)" }}
          />
          <span style={{ color: "var(--green-dim)" }}>MCP live</span>
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 cursor-text"
        onClick={focusInput}
        style={{ background: "var(--surface)" }}
      >
        {/* Boot message */}
        <div className="mb-4" style={{ color: "var(--text-muted)" }}>
          <div>joscha-koepke terminal v1.0.0</div>
          <div>{bootDate}</div>
          <div className="mt-2" style={{ color: "var(--text-dim)" }}>
            Welcome. Type{" "}
            <span style={{ color: "var(--green)" }}>help</span> to get started.
          </div>
        </div>

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
          <span style={{ color: "var(--green)" }}>joscha@mcp</span>
          <span style={{ color: "var(--text-muted)" }}>:</span>
          <span style={{ color: "var(--green-dim)" }}>~</span>
          <span style={{ color: "var(--text)" }}>$ </span>
          <form onSubmit={handleSubmit} className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none caret-transparent"
              style={{ color: "var(--text)", fontFamily: "inherit", fontSize: "inherit" }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
            {/* Fake cursor overlay */}
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

        {/* Autocomplete dropdown */}
        {autocomplete.length > 0 && (
          <div
            className="mt-1 p-2 border rounded text-xs"
            style={{
              background: "var(--surface-2)",
              borderColor: "var(--border)",
            }}
          >
            {autocomplete.map((cmd) => (
              <div
                key={cmd}
                className="px-2 py-0.5 cursor-pointer hover:opacity-80"
                style={{ color: "var(--green-dim)" }}
                onClick={() => {
                  setInput(cmd);
                  setAutocomplete([]);
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
      <StatusBar />
    </div>
  );
}
