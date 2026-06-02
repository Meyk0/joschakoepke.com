"use client";

import { CommandResult } from "@/lib/commands";
import { trackEvent } from "@/lib/analytics";

interface CommandOutputProps {
  command: string;
  result: CommandResult;
  index: number;
}

export default function CommandOutput({
  command,
  result,
  index,
}: CommandOutputProps) {
  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${index * 0.02}s`, color: "var(--text)" }}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest("a");
        if (anchor?.href) {
          trackEvent("outbound_link_click", {
            source: "terminal",
            href: anchor.href,
          });
        }
      }}
    >
      <div className="flex gap-2">
        <span style={{ color: "var(--green)", fontWeight: 600 }}>
          joscha-koepke@mcp:~$
        </span>
        <span style={{ color: "var(--text)" }}>{command}</span>
      </div>
      {result.output && (
        <div className="mt-1 mb-3 whitespace-pre-wrap" style={{ color: "var(--text)" }}>
          {result.isHtml ? (
            <div dangerouslySetInnerHTML={{ __html: result.output }} />
          ) : (
            <div>{result.output}</div>
          )}
        </div>
      )}
    </div>
  );
}
