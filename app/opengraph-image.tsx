import { ImageResponse } from "next/og";

export const alt = "Joscha Koepke — Terminal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#060a06",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          fontFamily: "monospace",
          padding: 60,
        }}
      >
        <div
          style={{
            background: "#080d08",
            border: "1px solid #1a2a1a",
            borderRadius: 12,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom: "1px solid #0d1a0d",
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#ff6b6b",
                }}
              />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#ffb347",
                }}
              />
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#00ff88",
                }}
              />
            </div>
            <div style={{ display: "flex", color: "#8a9e8a", fontSize: 16 }}>
              joscha-koepke — terminal
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#00ff88",
                fontSize: 14,
                border: "1px solid #2a4a2a",
                padding: "4px 12px",
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#00ff88",
                }}
              />
              <div style={{ display: "flex" }}>MCP live</div>
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              padding: "32px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", color: "#3a4a3a", fontSize: 14 }}>
              joscha-koepke.local ↑ bash · mcp/v1 ready
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              <div
                style={{
                  display: "flex",
                  color: "#00ff88",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                joscha-koepke@mcp:~$
              </div>
              <div style={{ display: "flex", color: "#c8d8c8", fontSize: 28 }}>
                Welcome. I'm Joscha Koepke - I love espresso and Golden
                Retrievers.
              </div>
              <div style={{ display: "flex", color: "#5a6a5a", fontSize: 22 }}>
                Type help to see available commands.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                color: "#00ff88",
                fontSize: 22,
                fontWeight: 700,
                marginTop: 12,
              }}
            >
              <div style={{ display: "flex" }}>joscha-koepke@mcp:~$</div>
              <div
                style={{
                  display: "flex",
                  color: "#c8d8c8",
                  fontWeight: 400,
                  marginLeft: 8,
                }}
              >
                _
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div
          style={{
            background: "#00ff88",
            color: "#003a1a",
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 24px",
            fontSize: 14,
            fontWeight: 600,
            borderRadius: "0 0 12px 12px",
            marginTop: -1,
          }}
        >
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ display: "flex" }}>NORMAL</div>
            <div style={{ display: "flex", fontWeight: 400 }}>
              joscha-koepke@mcp
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ display: "flex", fontWeight: 400 }}>
              Tab: autocomplete
            </div>
            <div style={{ display: "flex", fontWeight: 400 }}>
              ↑↓: history
            </div>
            <div style={{ display: "flex" }}>mcp/v1</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
