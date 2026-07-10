"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/components/AppContext";
import SubPageHeader from "./SubPageHeader";

export default function MemoryManager({ onBack }: { onBack: () => void }) {
  const { memories, setMemories, addMemory, toggleMemoryPrompt } = useApp();
  const [tag, setTag] = useState("");
  const [content, setContent] = useState("");

  const add = () => {
    if (!content.trim()) return;
    addMemory(tag, content, "manual", false);
    setTag("");
    setContent("");
  };

  const sorted = [...memories].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <SubPageHeader title="记忆库" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        <p className="text-[12px] text-cale-textLight px-1 leading-relaxed">
          对话结束后 Cale 会自动总结关键信息存为记忆。你也可以手动补充。
          开启「附加到 prompt」的记忆作为核心设定；关闭的记忆会作为对话背景注入，Cale 依然能感知。
        </p>

        {/* Add form */}
        <div className="bg-cale-card rounded-[14px] p-3 space-y-2">
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="标签（如：喜好、纪念日）"
            className="w-full bg-cale-input rounded-[12px] px-3 py-2 outline-none text-[15px]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记忆内容…"
            className="w-full bg-cale-input rounded-[12px] px-3 py-2 outline-none text-[15px] min-h-[64px] resize-none"
          />
          <button
            onClick={add}
            disabled={!content.trim()}
            className="w-full py-2.5 rounded-[12px] bg-cale-accent text-white font-medium active:opacity-80 disabled:opacity-40"
          >
            添加记忆
          </button>
        </div>

        {sorted.length === 0 && (
          <div className="text-center text-cale-textLight text-[13px] mt-6">
            还没有记忆
          </div>
        )}
        {sorted.map((m) => (
          <div key={m.id} className="bg-cale-card rounded-[14px] px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[11px] bg-cale-userBubble text-cale-accent px-2 py-0.5 rounded-full">
                    {m.tag}
                  </span>
                  <span className="text-[10px] text-cale-textLight">
                    {m.source === "auto" ? "自动" : "手动"}
                  </span>
                </div>
                <div className="text-[14px] text-cale-textDark break-words">
                  {m.content}
                </div>
              </div>
              <button
                onClick={() =>
                  setMemories((prev) => prev.filter((x) => x.id !== m.id))
                }
                className="text-cale-textLight active:opacity-60 flex-shrink-0"
              >
                <Trash2 size={16} strokeWidth={1.8} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-cale-divider">
              <span className="text-[12px] text-cale-textLight">附加到 prompt</span>
              <button
                onClick={() => toggleMemoryPrompt(m.id)}
                className="relative w-10 h-6 rounded-full transition-colors"
                style={{ background: m.appendToPrompt ? "#D4849F" : "#E0D5CE" }}
                aria-label="切换附加到 prompt"
              >
                <span
                  className="absolute top-0.5 w-5 h-5 bg-cale-card rounded-full transition-all"
                  style={{ left: m.appendToPrompt ? 18 : 2 }}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
