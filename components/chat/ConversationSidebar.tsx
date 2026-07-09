"use client";

import { Conversation } from "@/lib/types";

export default function ConversationSidebar({
  open,
  conversations,
  currentId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: {
  open: boolean;
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  return (
    <>
      <div
        onClick={onClose}
        className={`absolute inset-0 z-20 bg-black/25 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`absolute top-0 left-0 bottom-0 z-30 w-[78%] max-w-[320px] bg-cale-bg shadow-xl flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="px-4 py-3 flex items-center justify-between border-b border-cale-divider">
          <span className="text-[17px] font-semibold">对话</span>
          <button
            onClick={onNew}
            className="text-cale-accent text-[14px] active:opacity-70"
          >
            ＋ 新建
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {sorted.length === 0 && (
            <div className="text-center text-cale-textLight text-sm mt-10">
              还没有对话
            </div>
          )}
          {sorted.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`px-4 py-3 flex items-center justify-between cursor-pointer active:bg-cale-input ${
                c.id === currentId ? "bg-cale-userBubble/50" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] text-cale-textDark">
                  {c.title || "新对话"}
                </div>
                <div className="text-[12px] text-cale-textLight">
                  {new Date(c.updatedAt).toLocaleDateString("zh-CN")}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="ml-2 text-cale-textLight text-lg active:opacity-60"
                aria-label="删除对话"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
