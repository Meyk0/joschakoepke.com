"use client";

interface StatusBarProps {
  mcpLive?: boolean;
}

export default function StatusBar({ mcpLive = true }: StatusBarProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-1 text-xs sm:flex hidden"
      style={{
        background: "var(--status-bar)",
        color: "var(--status-text)",
        fontWeight: 600,
      }}
    >
      <div className="flex items-center gap-3">
        <span>NORMAL</span>
        <span style={{ fontWeight: 400 }}>joscha@mcp</span>
      </div>
      <div className="flex items-center gap-3">
        <span style={{ fontWeight: 400 }}>Tab ↑↓ help</span>
        {mcpLive && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--status-text)" }}
            />
            MCP live
          </span>
        )}
      </div>
    </div>
  );
}
