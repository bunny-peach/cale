"use client";

import { MessageCircle, PawPrint, BookOpen, Calendar, Settings } from "lucide-react";

export type Tab = "chat" | "pet" | "diary" | "calendar" | "settings";

const TABS: { key: Tab; label: string; Icon: typeof MessageCircle }[] = [
  { key: "chat", label: "Chat", Icon: MessageCircle },
  { key: "pet", label: "Pets", Icon: PawPrint },
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
      className="flex-shrink-0 bg-cale-card"
      style={{
        paddingBottom: "var(--safe-bottom)",
        boxShadow: "0 -1px 0 rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex">
        {TABS.map(({ key, label, Icon }) => {
          const on = key === active;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 active:opacity-60 transition-colors ${
                on ? "text-cale-accent" : "text-cale-textLight"
              }`}
            >
              <span key={on ? "on" : "off"} className={on ? "tab-bounce" : undefined}>
                <Icon size={22} strokeWidth={on ? 2 : 1.7} />
              </span>
              <span
                className="text-[13px] leading-none"
                style={{ fontFamily: SCRIPT_FONT }}
              >
                {label}
              </span>
              {/* small dot indicator for the active tab */}
              <span
                className="w-1 h-1 rounded-full transition-colors"
                style={{ background: on ? "rgb(var(--cale-accent))" : "transparent" }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
