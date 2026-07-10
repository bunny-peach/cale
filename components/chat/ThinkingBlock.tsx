"use client";

import { useState } from "react";
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
        <span>💭 Cale的内心</span>
        <span className="text-[11px]">{open ? "收起 ▲" : "展开 ▼"}</span>
      </button>
      {open && (
        <div
          className="mt-1 rounded-xl px-3 py-2 text-[13px] text-cale-textDark/80"
          style={{
            background: "#FFF0F5",
            borderLeft: "3px solid #E8A0BF",
          }}
        >
          <Markdown>{thinking}</Markdown>
          {streaming && <span className="cale-cursor" />}
        </div>
      )}
    </div>
  );
}
