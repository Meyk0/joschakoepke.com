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
          {/* Boot line */}
          <div
            className="mb-6 text-xs"
            style={{ color: "var(--text-faint)" }}
          >
            joscha-koepke.local ↑ bash · mcp/v1 ready · {bootDate}
          </div>

          {/* Welcome prompt */}
          <div className="mb-2">
            <div className="flex items-center">
              <span style={{ color: "var(--green)", fontWeight: 600 }}>
                joscha-koepke@mcp:~$
              </span>
            </div>
          </div>
          <div className="mb-2" style={{ color: "var(--text)" }}>
            Welcome. I&apos;m Joscha Koepke - I love espresso and Golden Retrievers.
          </div>
          <div className="mb-6" style={{ color: "var(--text-muted)" }}>
            Type <span style={{ color: "var(--green)" }}>help</span> to see
            available commands.
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
    </div>
  );
}
