"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, Trash2, Moon, Upload } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { DiaryEntry } from "@/lib/types";
import { uid } from "@/lib/storage";
import Markdown from "@/components/Markdown";

// Parse an imported file into diary entries. Accepts JSON (array of
// {title?, content, createdAt?/date?}) or plain text (entries split on a line
// of --- / ===, first line becomes the title).
function parseImport(text: string): DiaryEntry[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  try {
    const data = JSON.parse(trimmed);
    const arr = Array.isArray(data) ? data : data.diary || data.entries || [];
    return arr
      .map((e: Record<string, unknown>): DiaryEntry | null => {
        const content = String(e.content ?? e.text ?? "").trim();
        if (!content && !e.title) return null;
        const rawDate = e.createdAt ?? e.date ?? e.time;
        let createdAt = Date.now();
        if (typeof rawDate === "number") createdAt = rawDate;
        else if (typeof rawDate === "string") {
          const t = Date.parse(rawDate);
          if (!isNaN(t)) createdAt = t;
        }
        return {
          id: uid(),
          title: String(e.title ?? "旧日记").trim() || "旧日记",
          content,
          createdAt,
        };
      })
      .filter(Boolean) as DiaryEntry[];
  } catch {
    // Plain text: split into entries on --- / === separator lines
    const blocks = trimmed.split(/\n\s*[-=]{3,}\s*\n/);
    return blocks
      .map((b) => b.trim())
      .filter(Boolean)
      .map((b) => {
        const lines = b.split("\n");
        const title = lines[0].slice(0, 30).trim() || "旧日记";
        return { id: uid(), title, content: b, createdAt: Date.now() };
      });
  }
}

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
}

export default function DiaryView() {
  const { diary, setDiary } = useApp();
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1800);
  };

  const groups = useMemo(() => {
    const sorted = [...diary].sort((a, b) => b.createdAt - a.createdAt);
    const map = new Map<string, DiaryEntry[]>();
    for (const d of sorted) {
      const k = monthKey(d.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(d);
    }
    return Array.from(map.entries());
  }, [diary]);

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const entries = parseImport(reader.result as string);
      if (entries.length === 0) {
        showToast("没有解析到日记");
        return;
      }
      setDiary((prev) => [...entries, ...prev].sort((a, b) => b.createdAt - a.createdAt));
      showToast(`导入了 ${entries.length} 篇日记`);
    };
    reader.readAsText(file);
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
    <div className="h-full flex flex-col bg-cale-bg relative">
      <header
        className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-3 h-12"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="w-9" />
        <div className="flex-1 text-center text-[17px] font-semibold">
          Cale 的日记
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-9 h-9 flex items-center justify-center text-cale-textLight active:opacity-60"
          aria-label="导入日记"
          title="导入历史日记"
        >
          <Upload size={19} strokeWidth={1.8} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.txt,text/plain,application/json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
        />
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {diary.length === 0 && (
          <div className="flex flex-col items-center text-cale-textLight mt-20 px-8 text-center">
            <Moon size={32} strokeWidth={1.5} className="mb-3 opacity-60" />
            <div className="text-[14px] leading-relaxed">
              还没有日记。<br />
              当你说「我要睡了」或让 Cale 写日记时，<br />
              他会在这里留下一篇睡前日记。
            </div>
            <div className="text-[12px] mt-3 opacity-80">
              也可以点右上角导入以前写过的日记。
            </div>
          </div>
        )}

        {groups.map(([month, items]) => (
          <div key={month}>
            <div className="text-[12px] text-cale-textLight px-1 mb-1.5">
              {month} · {items.length} 篇
            </div>
            <div className="space-y-2">
              {items.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className="w-full text-left bg-cale-card rounded-[14px] px-5 py-4 active:opacity-80"
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
                  <div className="text-[13px] text-cale-textLight mt-1.5 line-clamp-2 leading-relaxed">
                    {d.content.slice(0, 50) || "（无内容）"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/75 text-white text-[13px] px-4 py-2 rounded-full pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
