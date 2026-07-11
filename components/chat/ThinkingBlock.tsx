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
  return (
    <div className="mb-1.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[13px] text-cale-accent flex items-center gap-1 active:opacity-70"
      >
        <Brain size={14} strokeWidth={1.8} />
        <span>Cale&apos;s mind</span>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>
      {open && (
        <div
          className="mt-1 rounded-[14px] px-3 py-2 text-[13px] text-cale-textDark/80 bg-cale-thinking"
          style={{ borderLeft: "3px solid rgb(var(--cale-primary))" }}
        >
          <Markdown>{thinking}</Markdown>
          {streaming && <span className="cale-cursor" />}
        </div>
      )}
    </div>
  );
}
