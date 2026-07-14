import { ImageResponse } from "next/og";

export const alt = "Joscha Koepke | AI Product Leader";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const metricStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: 4,
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 12,
  background: "rgba(255,255,255,0.08)",
  padding: "18px 20px",
};

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#10253b",
          color: "white",
          fontFamily: "sans-serif",
          padding: 48,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(135deg, #8d173d 0%, #d23d45 31%, #17618b 64%, #10253b 100%)",
            opacity: 0.96,
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            width: "100%",
            height: "100%",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 620,
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "24px 10px 18px 12px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  color: "#a7f3d0",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                Evidence-grounded portfolio
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 60,
                  fontWeight: 800,
                  letterSpacing: 0,
                  lineHeight: 1,
                }}
              >
                Joscha Koepke
              </div>
              <div
                style={{
                  display: "flex",
                  maxWidth: 590,
                  color: "rgba(255,255,255,0.86)",
                  fontSize: 28,
                  lineHeight: 1.25,
                }}
              >
                AI product leader building agent platforms, memory, and evaluation systems.
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={metricStyle}>
                <div style={{ display: "flex", fontSize: 28, fontWeight: 800 }}>$10M+</div>
                <div style={{ display: "flex", color: "rgba(255,255,255,0.7)", fontSize: 15 }}>ARR scaled</div>
              </div>
              <div style={metricStyle}>
                <div style={{ display: "flex", fontSize: 28, fontWeight: 800 }}>40M+</div>
                <div style={{ display: "flex", color: "rgba(255,255,255,0.7)", fontSize: 15 }}>monthly messages</div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              width: 450,
              height: 500,
              alignSelf: "center",
              flexDirection: "column",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.36)",
              borderRadius: 18,
              background: "rgba(248,250,252,0.94)",
              boxShadow: "0 34px 80px rgba(0,0,0,0.34)",
              color: "#0f172a",
            }}
          >
            <div
              style={{
                display: "flex",
                height: 42,
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #dbe3ec",
                padding: "0 16px",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <div style={{ display: "flex", gap: 7 }}>
                <span style={{ width: 11, height: 11, borderRadius: 99, background: "#ff5f57" }} />
                <span style={{ width: 11, height: 11, borderRadius: 99, background: "#febc2e" }} />
                <span style={{ width: 11, height: 11, borderRadius: 99, background: "#28c840" }} />
              </div>
              <div style={{ display: "flex" }}>Agent.app</div>
              <div style={{ display: "flex", width: 42 }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 24 }}>
              <div style={{ display: "flex", color: "#0f766e", fontSize: 13, fontWeight: 800 }}>
                ASK JOSCHA
              </div>
              <div style={{ display: "flex", fontSize: 28, fontWeight: 750, lineHeight: 1.2 }}>
                What evidence shows he can scale AI products?
              </div>
              <div style={{ display: "flex", color: "#475569", fontSize: 17, lineHeight: 1.45 }}>
                Answers are assembled from measurable portfolio evidence, with every claim linked to its source.
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                  border: "1px solid #dbe3ec",
                  borderRadius: 10,
                  background: "white",
                  padding: 15,
                }}
              >
                <div style={{ display: "flex", color: "#0f766e", fontSize: 11, fontWeight: 800 }}>
                  CITED EVIDENCE
                </div>
                <div style={{ display: "flex", fontSize: 16, fontWeight: 750 }}>
                  Connectly AI - Selected impact
                </div>
                <div style={{ display: "flex", color: "#64748b", fontSize: 14 }}>
                  Platform growth, evaluation systems, and enterprise agent infrastructure.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
