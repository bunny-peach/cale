"use client";

import { useState } from "react";
import { useApp } from "@/components/AppContext";
import { uid } from "@/lib/storage";
import SubPageHeader from "./SubPageHeader";

export default function MemoryManager({ onBack }: { onBack: () => void }) {
  const { memories, setMemories } = useApp();
  const [tag, setTag] = useState("");
  const [content, setContent] = useState("");

  const add = () => {
    if (!content.trim()) return;
    setMemories((prev) => [
      ...prev,
      {
        id: uid(),
        tag: tag.trim() || "记忆",
        content: content.trim(),
        createdAt: Date.now(),
      },
    ]);
    setTag("");
    setContent("");
  };

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <SubPageHeader title="记忆库" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        {/* Add form */}
        <div className="bg-cale-card rounded-card p-3 space-y-2">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="标签（如：喜好、纪念日）"
            className="w-full bg-cale-input rounded-xl px-3 py-2 outline-none text-[15px]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记忆内容…"
            className="w-full bg-cale-input rounded-xl px-3 py-2 outline-none text-[15px] min-h-[70px] resize-none"
          />
          <button
            onClick={add}
            disabled={!content.trim()}
            className="w-full py-2.5 rounded-xl bg-cale-primary text-white font-medium active:opacity-80 disabled:opacity-40"
          >
            添加记忆
          </button>
        </div>

        {memories.length === 0 && (
          <div className="text-center text-cale-textLight text-[13px] mt-6">
            记忆会自动附加到 Cale 的 system prompt 里
          </div>
        )}
        {memories.map((m) => (
          <div
            key={m.id}
            className="bg-cale-card rounded-card px-4 py-3 flex items-start justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <span className="inline-block text-[11px] bg-cale-userBubble text-cale-accent px-2 py-0.5 rounded-full mb-1">
                {m.tag}
              </span>
              <div className="text-[14px] text-cale-textDark break-words">
                {m.content}
              </div>
            </div>
            <button
              onClick={() =>
                setMemories((prev) => prev.filter((x) => x.id !== m.id))
              }
              className="text-cale-textLight text-lg active:opacity-60"
            >
              🗑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
