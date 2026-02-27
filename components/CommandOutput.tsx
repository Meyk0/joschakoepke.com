"use client";

import { CommandResult } from "@/lib/commands";

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
      style={{ animationDelay: `${index * 0.02}s` }}
    >
      <div className="flex gap-2">
        <span style={{ color: "var(--green)", fontWeight: 600 }}>
          joscha-koepke@mcp:~$
        </span>
        <span>{command}</span>
      </div>
      {result.output && (
        <div className="mt-1 mb-3 whitespace-pre-wrap">
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
