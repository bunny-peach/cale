"use client";

import { useState } from "react";
import { useApp } from "@/components/AppContext";
import { uid } from "@/lib/storage";
import { DiaryEntry } from "@/lib/types";
import Markdown from "@/components/Markdown";

export default function DiaryView() {
  const { diary, setDiary } = useApp();
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const sorted = [...diary].sort((a, b) => b.createdAt - a.createdAt);

  const openNew = () => {
    setTitle("");
    setContent("");
    setEditing(true);
  };

  const saveNew = () => {
    if (!title.trim() && !content.trim()) {
      setEditing(false);
      return;
    }
    setDiary((prev) => [
      {
        id: uid(),
        title: title.trim() || new Date().toLocaleDateString("zh-CN"),
        content: content.trim(),
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setEditing(false);
  };

  // ---- Detail view ----
  if (selected) {
    return (
      <div className="h-full flex flex-col bg-cale-bg">
        <header
          className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-3 h-12"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          <button
            onClick={() => setSelected(null)}
            className="text-cale-accent text-[15px] active:opacity-70"
          >
            ‹ 返回
          </button>
          <div className="flex-1 text-center text-[17px] font-semibold truncate px-2">
            {selected.title}
          </div>
          <button
            onClick={() => {
              setDiary((prev) => prev.filter((d) => d.id !== selected.id));
              setSelected(null);
            }}
            className="text-cale-textLight text-lg active:opacity-60"
          >
            🗑
          </button>
        </header>
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
          <div className="text-[12px] text-cale-textLight mb-3">
            {new Date(selected.createdAt).toLocaleString("zh-CN")}
          </div>
          <Markdown>{selected.content}</Markdown>
        </div>
      </div>
    );
  }

  // ---- Editor ----
  if (editing) {
    return (
      <div className="h-full flex flex-col bg-cale-bg">
        <header
          className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-3 h-12"
          style={{ paddingTop: "var(--safe-top)" }}
        >
          <button
            onClick={() => setEditing(false)}
            className="text-cale-textLight text-[15px] active:opacity-70"
          >
            取消
          </button>
          <div className="flex-1 text-center text-[17px] font-semibold">
            新日记
          </div>
          <button
            onClick={saveNew}
            className="text-cale-accent text-[15px] font-medium active:opacity-70"
          >
            保存
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="标题"
            className="w-full bg-cale-card rounded-card px-3 py-2.5 outline-none text-[16px]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="写点什么…（支持 Markdown）"
            className="w-full bg-cale-card rounded-card px-3 py-2.5 outline-none text-[16px] min-h-[300px] resize-none"
          />
        </div>
      </div>
    );
  }

  // ---- List ----
  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <header
        className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-3 h-12"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="w-12" />
        <div className="flex-1 text-center text-[17px] font-semibold">日记</div>
        <button
          onClick={openNew}
          className="w-12 text-right text-cale-accent text-xl active:opacity-70"
          aria-label="新建日记"
        >
          ＋
        </button>
      </header>
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-2">
        {sorted.length === 0 && (
          <div className="text-center text-cale-textLight text-sm mt-16">
            还没有日记，点右上角 ＋ 写一篇
          </div>
        )}
        {sorted.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelected(d)}
            className="w-full text-left bg-cale-card rounded-card px-4 py-3 active:opacity-80"
            style={{ boxShadow: "0 1px 2px rgba(45,45,45,0.05)" }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="font-semibold text-[15px] truncate">
                {d.title}
              </div>
              <div className="text-[12px] text-cale-textLight flex-shrink-0">
                {new Date(d.createdAt).toLocaleDateString("zh-CN")}
              </div>
            </div>
            <div className="text-[13px] text-cale-textLight mt-1 line-clamp-2">
              {d.content.slice(0, 50) || "（无内容）"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
