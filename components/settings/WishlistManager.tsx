"use client";

import { useState } from "react";
import { Square, CircleDot, CheckSquare, Trash2 } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { WishItem, WishStatus } from "@/lib/types";
import SubPageHeader from "./SubPageHeader";

const STATUS_ORDER: WishStatus[] = ["todo", "doing", "done"];
const STATUS_LABEL: Record<WishStatus, string> = {
  todo: "待做",
  doing: "进行中",
  done: "已完成",
};
const STATUS_ICON: Record<WishStatus, typeof Square> = {
  todo: Square,
  doing: CircleDot,
  done: CheckSquare,
};

export default function WishlistManager({ onBack }: { onBack: () => void }) {
  const { wishlist, setWishlist, addWish } = useApp();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const cycleStatus = (item: WishItem) => {
    const idx = STATUS_ORDER.indexOf(item.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    setWishlist((prev) =>
      prev.map((w) => (w.id === item.id ? { ...w, status: next } : w))
    );
  };

  const saveEdit = (id: string) => {
    setWishlist((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, title: editTitle.trim() || w.title } : w
      )
    );
    setEditingId(null);
  };

  const sorted = [...wishlist].sort((a, b) => {
    const order = { doing: 0, todo: 1, done: 2 };
    return order[a.status] - order[b.status] || a.createdAt - b.createdAt;
  });

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <SubPageHeader title="MCP 愿望清单" onBack={onBack} />
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
        <div className="bg-cale-card rounded-card p-3 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="愿望 / 待办标题"
            className="w-full bg-cale-input rounded-xl px-3 py-2 outline-none text-[15px]"
          />
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="描述（可选）"
            className="w-full bg-cale-input rounded-xl px-3 py-2 outline-none text-[15px]"
          />
          <button
            onClick={() => {
              addWish(title, "quinn", desc.trim() || undefined);
              setTitle("");
              setDesc("");
            }}
            disabled={!title.trim()}
            className="w-full py-2.5 rounded-xl bg-cale-primary text-white font-medium active:opacity-80 disabled:opacity-40"
          >
            添加
          </button>
        </div>

        {wishlist.length === 0 && (
          <div className="text-center text-cale-textLight text-[13px] mt-6">
            清单会自动同步给 Cale，他能主动提及进度
          </div>
        )}

        {sorted.map((w) => {
          const StatusIcon = STATUS_ICON[w.status];
          return (
          <div key={w.id} className="bg-cale-card rounded-[14px] px-3 py-3">
            <div className="flex items-start gap-2">
              <button
                onClick={() => cycleStatus(w)}
                className="flex-shrink-0 flex items-center gap-1 text-[12px] text-cale-textLight active:opacity-60 pt-0.5"
              >
                <StatusIcon
                  size={15}
                  strokeWidth={1.8}
                  className={
                    w.status === "done"
                      ? "text-cale-accent"
                      : w.status === "doing"
                        ? "text-cale-accent"
                        : "text-cale-textLight"
                  }
                />
                {STATUS_LABEL[w.status]}
              </button>
              <div className="flex-1 min-w-0">
                {editingId === w.id ? (
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => saveEdit(w.id)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(w.id)}
                    autoFocus
                    className="w-full bg-cale-input rounded px-2 py-1 outline-none text-[14px]"
                  />
                ) : (
                  <div
                    className={`text-[14px] break-words ${
                      w.status === "done"
                        ? "line-through text-cale-textLight"
                        : "text-cale-textDark"
                    }`}
                    onClick={() => {
                      setEditingId(w.id);
                      setEditTitle(w.title);
                    }}
                  >
                    {w.title}
                  </div>
                )}
                {w.description && (
                  <div className="text-[12px] text-cale-textLight mt-0.5">
                    {w.description}
                  </div>
                )}
                <span
                  className="inline-block text-[10px] px-1.5 py-0.5 rounded-full mt-1"
                  style={{
                    background: w.source === "cale" ? "#FFF0F5" : "#EAF3EE",
                    color: w.source === "cale" ? "#D4849F" : "#5C9E7A",
                  }}
                >
                  {w.source === "cale" ? "Cale 添加" : "Quinn 添加"}
                </span>
              </div>
              <button
                onClick={() =>
                  setWishlist((prev) => prev.filter((x) => x.id !== w.id))
                }
                className="text-cale-textLight active:opacity-60 flex-shrink-0"
              >
                <Trash2 size={16} strokeWidth={1.8} />
              </button>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
