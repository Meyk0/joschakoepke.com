"use client";

export default function StatusBar() {
  return (
    <div
      className="flex items-center justify-between px-4 py-1.5 text-xs"
      style={{
        background: "var(--status-bar)",
        color: "var(--status-text)",
        fontWeight: 600,
      }}
    >
      <div className="flex items-center gap-4">
        <span>NORMAL</span>
        <span style={{ fontWeight: 400 }}>joscha-koepke@mcp</span>
      </div>
      <div className="flex items-center gap-4">
        <span style={{ fontWeight: 400 }}>
          Tab: autocomplete
        </span>
        <span style={{ fontWeight: 400 }}>
          ↑↓: history
        </span>
        <span>mcp/v1</span>
      </div>
    </div>
  );
}
