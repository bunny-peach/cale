"use client";

import { useState } from "react";
import { ChevronLeft, Trash2, Moon } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { DiaryEntry } from "@/lib/types";
import Markdown from "@/components/Markdown";

export default function DiaryView() {
  const { diary, setDiary } = useApp();
  const [selected, setSelected] = useState<DiaryEntry | null>(null);

  const sorted = [...diary].sort((a, b) => b.createdAt - a.createdAt);

  // ---- Detail view ----
  if (selected) {
    return (
      <div className="h-full flex flex-col bg-cale-bg">
        <header
          className="flex-shrink-0 bg-white border-b border-cale-divider flex items-center px-3 h-12"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          <button
            onClick={() => setSelected(null)}
            className="text-cale-accent flex items-center active:opacity-70"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1 text-center text-[17px] font-semibold truncate px-2">
            {selected.title}
          </div>
          <button
            onClick={() => {
              setDiary((prev) => prev.filter((d) => d.id !== selected.id));
              setSelected(null);
            }}
            className="text-cale-textLight active:opacity-60"
          >
            <Trash2 size={19} strokeWidth={1.8} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5">
          <div className="text-[12px] text-cale-textLight mb-4">
            {new Date(selected.createdAt).toLocaleString("zh-CN")}
          </div>
          <Markdown>{selected.content}</Markdown>
        </div>
      </div>
    );
  }

  // ---- List ----
  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <header
        className="flex-shrink-0 bg-white border-b border-cale-divider flex items-center justify-center h-12"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="text-[17px] font-semibold">Cale 的日记</div>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center text-cale-textLight mt-20 px-8 text-center">
            <Moon size={32} strokeWidth={1.5} className="mb-3 opacity-60" />
            <div className="text-[14px] leading-relaxed">
              还没有日记。<br />
              当你说「我要睡了」或让 Cale 写日记时，<br />
              他会在这里留下一篇睡前日记。
            </div>
          </div>
        )}
        {sorted.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelected(d)}
            className="w-full text-left bg-white rounded-[14px] px-5 py-4 active:opacity-80"
            style={{ boxShadow: "0 1px 2px rgba(45,45,45,0.05)" }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-semibold text-[15px] truncate">{d.title}</div>
              <div className="text-[12px] text-cale-textLight flex-shrink-0">
                {new Date(d.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
            <div className="text-[13px] text-cale-textLight mt-1.5 line-clamp-2 leading-relaxed">
              {d.content.slice(0, 50) || "（无内容）"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
