"use client";

export type Tab = "chat" | "diary" | "calendar" | "settings";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "chat", label: "聊天", icon: "💬" },
  { key: "diary", label: "日记", icon: "📖" },
  { key: "calendar", label: "日历", icon: "📅" },
  { key: "settings", label: "设置", icon: "⚙️" },
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
      className="flex-shrink-0 bg-cale-card border-t border-cale-divider"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="flex">
        {TABS.map((t) => {
          const on = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 active:opacity-70 transition-opacity"
              style={{ color: on ? "#D4849F" : "#8E8E93" }}
            >
              <span className="text-[22px] leading-none">{t.icon}</span>
              <span className="text-[11px] leading-none">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
