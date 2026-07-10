"use client";

import { MessageCircle, BookOpen, Calendar, Settings } from "lucide-react";

export type Tab = "chat" | "diary" | "calendar" | "settings";

const TABS: { key: Tab; label: string; Icon: typeof MessageCircle }[] = [
  { key: "chat", label: "聊天", Icon: MessageCircle },
  { key: "diary", label: "日记", Icon: BookOpen },
  { key: "calendar", label: "日历", Icon: Calendar },
  { key: "settings", label: "设置", Icon: Settings },
];

export default function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav
      className="flex-shrink-0 bg-white border-t border-cale-divider"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="flex">
        {TABS.map(({ key, label, Icon }) => {
          const on = key === active;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2 active:opacity-60 transition-opacity"
              style={{ color: on ? "#D4849F" : "#8E8E93" }}
            >
              <Icon size={22} strokeWidth={on ? 2.2 : 1.8} />
              <span className="text-[11px] leading-none tracking-wide">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
