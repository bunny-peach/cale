"use client";

import { MessageCircle, Drama, BookOpen, Calendar, Settings } from "lucide-react";

export type Tab = "chat" | "theater" | "diary" | "calendar" | "settings";

const TABS: { key: Tab; label: string; Icon: typeof MessageCircle }[] = [
  { key: "chat", label: "Chat", Icon: MessageCircle },
  { key: "theater", label: "Stories", Icon: Drama },
  { key: "diary", label: "Diary", Icon: BookOpen },
  { key: "calendar", label: "Calendar", Icon: Calendar },
  { key: "settings", label: "Settings", Icon: Settings },
];

// Elegant script/cursive stack — reads as premium on iOS (Snell Roundhand).
const SCRIPT_FONT =
  '"Snell Roundhand", "Apple Chancery", "Segoe Script", "Brush Script MT", cursive';

export default function TabBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav
      className="flex-shrink-0 bg-cale-card border-t border-cale-divider"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="flex">
        {TABS.map(({ key, label, Icon }) => {
          const on = key === active;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 active:opacity-60 transition-opacity ${
                on ? "text-cale-accent" : "text-cale-textLight"
              }`}
            >
              <Icon size={22} strokeWidth={on ? 2.2 : 1.8} />
              <span
                className="text-[15px] leading-none"
                style={{ fontFamily: SCRIPT_FONT }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
