"use client";

import { useState } from "react";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import Markdown from "@/components/Markdown";

export default function ThinkingBlock({
  thinking,
  streaming,
}: {
  thinking: string;
  streaming?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!thinking) return null;
  const preview = thinking.replace(/\s+/g, " ").trim().slice(0, 22);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 max-w-full active:opacity-70"
      >
        <Brain size={13} strokeWidth={1.8} className="text-cale-accent flex-shrink-0" />
        <span className="text-[13px] italic text-cale-accent flex-shrink-0">
          Cale&apos;s mind
        </span>
        {!open && (
          <span className="text-[12px] text-cale-textLight truncate min-w-0">
            {preview}…
          </span>
        )}
        {open ? (
          <ChevronUp size={13} className="text-cale-textLight flex-shrink-0" />
        ) : (
          <ChevronDown size={13} className="text-cale-textLight flex-shrink-0" />
        )}
      </button>
      {open && (
        <div
          className="mt-1.5 rounded-[12px] px-3 py-2.5 text-[13px] leading-relaxed"
          style={{ border: "1px dashed #e8d5cf", color: "#8b7d77" }}
        >
          <Markdown>{thinking}</Markdown>
          {streaming && <span className="cale-cursor" />}
        </div>
      )}
    </div>
  );
}
