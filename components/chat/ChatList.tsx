"use client";

import { Plus, Heart, Trash2 } from "lucide-react";
import { Conversation } from "@/lib/types";

function preview(c: Conversation): string {
  const last = c.messages[c.messages.length - 1];
  if (!last) return "还没有消息";
  if (last.payload)
    return last.payload.kind === "gift" ? "[礼物]" : "[转账]";
  const who = last.role === "user" ? "你：" : "";
  return who + (last.content || "[图片]").replace(/\s+/g, " ");
}

function stamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (d.toDateString() === now.toDateString())
    return `${String(d.getHours()).padStart(2, "0")}:${mm}`;
  const yst = new Date(now);
  yst.setDate(now.getDate() - 1);
  if (d.toDateString() === yst.toDateString()) return "昨天";
  if ((now.getTime() - d.getTime()) / 86400000 < 7)
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ChatList({
  conversations,
  displayName,
  onOpen,
  onNew,
  onDelete,
}: {
  conversations: Conversation[];
  displayName: string;
  onOpen: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <div className="h-full relative overflow-hidden bg-cale-bg">
      <header
        className="absolute top-0 inset-x-0 z-30 bg-cale-card flex items-center justify-between px-4"
        style={{
          paddingTop: "var(--safe-top)",
          height: "calc(var(--safe-top) + 3.5rem)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
        }}
      >
        <span className="text-[22px] font-bold text-cale-textDark">对话</span>
        <button
          onClick={onNew}
          className="w-9 h-9 rounded-full flex items-center justify-center text-cale-accent active:opacity-60"
          aria-label="新建对话"
        >
          <Plus size={22} strokeWidth={2} />
        </button>
      </header>

      <div
        className="absolute inset-0 overflow-y-auto no-scrollbar px-3 pb-4 space-y-3"
        style={{ paddingTop: "calc(var(--safe-top) + 4rem)" }}
      >
        {sorted.length === 0 && (
          <div className="text-center text-cale-textLight text-[14px] mt-24">
            还没有对话，点右上角开始和 {displayName} 聊天吧～
          </div>
        )}
        {sorted.map((c) => {
          const last = c.messages[c.messages.length - 1];
          const unread = last?.role === "assistant";
          return (
            <div
              key={c.id}
              onClick={() => onOpen(c.id)}
              className="group bg-cale-card no-glass rounded-[16px] p-4 flex items-center gap-3 active:opacity-90 cursor-pointer"
            >
              <span className="relative flex-shrink-0">
                <span
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{ background: "rgb(var(--cale-accent) / 0.14)" }}
                >
                  <Heart size={26} fill="rgb(var(--cale-accent))" className="text-cale-accent" />
                </span>
                {unread && (
                  <span className="absolute -left-0.5 top-1 w-2.5 h-2.5 rounded-full bg-cale-accent ring-2 ring-cale-card" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[16px] text-cale-textDark truncate flex-1">
                    {c.title || displayName}
                  </span>
                  <span className="text-[11px] text-cale-textLight flex-shrink-0">
                    {stamp(c.updatedAt)}
                  </span>
                </div>
                <div className="text-[13px] text-cale-textLight truncate mt-1">
                  {preview(c)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="flex-shrink-0 p-1 text-cale-textLight/60 active:opacity-60"
                aria-label="删除对话"
              >
                <Trash2 size={16} strokeWidth={1.7} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
