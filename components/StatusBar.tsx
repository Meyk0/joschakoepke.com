"use client";

interface StatusBarProps {
  theme?: string;
}

export default function StatusBar({ theme = "dark" }: StatusBarProps) {
  return (
    <div
      className="flex items-center justify-between px-3 sm:px-4 py-1.5 text-xs"
      style={{
        background: "var(--status-bar)",
        color: "var(--status-text)",
        fontWeight: 600,
      }}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        <span>NORMAL</span>
        <span className="hidden sm:inline" style={{ fontWeight: 400 }}>
          joscha-koepke@mcp
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden sm:inline" style={{ fontWeight: 400 }}>
          Tab: autocomplete
        </span>
        <span style={{ fontWeight: 400 }}>↑↓: history</span>
        <span>mcp/v1</span>
        {theme !== "dark" && (
          <span style={{ fontWeight: 400 }}>[{theme}]</span>
        )}
      </div>
    </div>
  );
}
