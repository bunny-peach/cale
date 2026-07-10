"use client";

import { useMemo, useState } from "react";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Angry,
  Moon,
  Plus,
  Minus,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import { todayKey } from "@/lib/storage";
import { classifyDate, getPeriodInsight } from "@/lib/period";
import { Mood, MoodEntry } from "@/lib/types";
import UsageStatsPanel from "./UsageStatsPanel";

const MOODS: {
  key: Mood;
  label: string;
  Icon: typeof Smile;
  color: string;
}[] = [
  { key: "happy", label: "开心", Icon: Smile, color: "#E0A63C" },
  { key: "calm", label: "平静", Icon: Meh, color: "#5C9E7A" },
  { key: "sad", label: "难过", Icon: Frown, color: "#5B86C4" },
  { key: "irritated", label: "烦躁", Icon: Angry, color: "#C46B6B" },
  { key: "tired", label: "疲惫", Icon: Moon, color: "#8B72B0" },
];

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function CalendarView() {
  const app = useApp();
  const { settings, periodData, setPeriodData, moods, setMoods } = app;
  const [cursor, setCursor] = useState(() => new Date());
  const [tab, setTab] = useState<"period" | "usage">("period");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);

  const insight = useMemo(
    () => getPeriodInsight(periodData),
    [periodData]
  );

  // Anniversary day count
  const anniversaryDays = useMemo(() => {
    if (!settings.anniversary) return null;
    const [y, m, d] = settings.anniversary.split("-").map(Number);
    const start = new Date(y, m - 1, d);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff + 1;
  }, [settings.anniversary]);

  const moodMap = useMemo(() => {
    const map: Record<string, MoodEntry> = {};
    moods.forEach((m) => (map[m.date] = m));
    return map;
  }, [moods]);

  const markPeriodStart = (dateStr: string) => {
    const exists = periodData.entries.some((e) => e.startDate === dateStr);
    if (exists) {
      setPeriodData({
        ...periodData,
        entries: periodData.entries.filter((e) => e.startDate !== dateStr),
      });
    } else {
      setPeriodData({
        ...periodData,
        entries: [...periodData.entries, { startDate: dateStr }],
      });
    }
  };

  const setMood = (dateStr: string, mood: Mood) => {
    setMoods((prev) => {
      const existing = prev.find((m) => m.date === dateStr);
      if (existing) {
        return prev.map((m) => (m.date === dateStr ? { ...m, mood } : m));
      }
      return [...prev, { date: dateStr, mood }];
    });
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  const today = todayKey();

  return (
    <div className="h-full flex flex-col bg-cale-bg">
      <header
        className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center justify-center h-12"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="text-[17px] font-semibold">日历</div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3">
        {/* Anniversary banner */}
        {anniversaryDays !== null && anniversaryDays > 0 && (
          <div
            className="rounded-card px-4 py-4 text-center"
            style={{ background: "linear-gradient(135deg,#FFF0F5,#F5E0EA)" }}
          >
            <Heart
              size={30}
              className="heart-pulse mx-auto text-cale-accent"
              fill="#E8A0BF"
              strokeWidth={1.5}
            />
            <div className="text-[16px] mt-2 text-cale-textDark">
              和 {settings.caleName || "Cale"} 在一起的第{" "}
              <span className="font-bold text-cale-accent text-[20px]">
                {anniversaryDays}
              </span>{" "}
              天
            </div>
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex bg-cale-input rounded-pill p-1 text-[14px]">
          {(["period", "usage"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-pill transition-colors ${
                tab === t
                  ? "bg-cale-card text-cale-accent font-medium shadow-sm"
                  : "text-cale-textLight"
              }`}
            >
              {t === "period" ? "经期 & 心情" : "消费统计"}
            </button>
          ))}
        </div>

        {tab === "usage" ? (
          <UsageStatsPanel />
        ) : (
          <>
            {/* Period insight card */}
            <div className="bg-cale-card rounded-card px-4 py-3">
              <div className="text-[14px] text-cale-textDark">
                {insight.hasData
                  ? insight.summary
                  : "点击日历上的日期，标记经期开始日"}
              </div>
              {insight.hasData && (
                <div className="text-[12px] text-cale-textLight mt-1">
                  平均周期 {insight.cycleLength} 天 · 经期 {insight.periodLength} 天
                </div>
              )}
            </div>

            {/* Month calendar */}
            <div className="bg-cale-card rounded-card p-3">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setCursor(new Date(year, month - 1, 1))}
                  className="px-3 py-1 text-cale-textLight active:opacity-60"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="font-semibold text-[15px]">
                  {year} 年 {month + 1} 月
                </div>
                <button
                  onClick={() => setCursor(new Date(year, month + 1, 1))}
                  className="px-3 py-1 text-cale-textLight active:opacity-60"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-y-1 text-center">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="text-[12px] text-cale-textLight py-1">
                    {w}
                  </div>
                ))}
                {cells.map((d, i) => {
                  if (d === null) return <div key={`e${i}`} />;
                  const dateObj = new Date(year, month, d);
                  const dateStr = todayKey(dateObj);
                  const mark = classifyDate(periodData, dateObj);
                  const mood = moodMap[dateStr];
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;

                  let bg = "transparent";
                  let border = "none";
                  if (mark === "period") bg = "#E8A0BF";
                  else if (mark === "predicted") {
                    bg = "#FBDCEA";
                    border = "1px dashed #E8A0BF";
                  } else if (mark === "ovulation") bg = "#D8C4E8";

                  return (
                    <button
                      key={dateStr}
                      onClick={() =>
                        setSelectedDate(isSelected ? null : dateStr)
                      }
                      className="aspect-square flex flex-col items-center justify-center relative"
                    >
                      <div
                        className="w-8 h-8 flex items-center justify-center rounded-full text-[14px]"
                        style={{
                          background: bg,
                          border,
                          color: mark === "period" ? "#fff" : "#2D2D2D",
                          outline: isToday ? "2px solid #D4849F" : "none",
                          boxShadow: isSelected
                            ? "0 0 0 2px #D4849F"
                            : "none",
                        }}
                      >
                        {mood
                          ? (() => {
                              const M = MOODS.find((x) => x.key === mood.mood);
                              return M ? (
                                <M.Icon
                                  size={16}
                                  strokeWidth={1.8}
                                  style={{ color: M.color }}
                                />
                              ) : (
                                d
                              );
                            })()
                          : d}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-[11px] text-cale-textLight">
                <Legend color="#E8A0BF" label="经期" />
                <Legend color="#FBDCEA" label="预测" dashed />
                <Legend color="#D8C4E8" label="排卵期" />
              </div>
            </div>

            {/* Selected day actions */}
            {selectedDate && (
              <div className="bg-cale-card rounded-card p-4 space-y-3">
                <div className="text-[14px] font-medium">{selectedDate}</div>
                <button
                  onClick={() => markPeriodStart(selectedDate)}
                  className="w-full py-2.5 rounded-xl bg-cale-userBubble text-cale-accent text-[14px] font-medium active:opacity-80"
                >
                  {periodData.entries.some((e) => e.startDate === selectedDate)
                    ? "取消经期开始标记"
                    : "标记为经期开始日"}
                </button>
                <div>
                  <div className="text-[13px] text-cale-textLight mb-2">
                    记录心情
                  </div>
                  <div className="flex justify-between">
                    {MOODS.map((m) => {
                      const on = moodMap[selectedDate]?.mood === m.key;
                      return (
                        <button
                          key={m.key}
                          onClick={() => setMood(selectedDate, m.key)}
                          className={`flex flex-col items-center gap-1 px-1 transition-transform ${
                            on ? "scale-110" : "opacity-60"
                          }`}
                        >
                          <m.Icon
                            size={26}
                            strokeWidth={1.8}
                            style={{ color: m.color }}
                          />
                          <span className="text-[11px] text-cale-textLight">
                            {m.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Cycle settings */}
            <div className="bg-cale-card rounded-card p-4 space-y-3">
              <div className="text-[14px] font-medium">周期设置</div>
              <NumberRow
                label="平均周期天数"
                value={periodData.cycleLength}
                onChange={(v) =>
                  setPeriodData({ ...periodData, cycleLength: v })
                }
              />
              <NumberRow
                label="经期持续天数"
                value={periodData.periodLength}
                onChange={(v) =>
                  setPeriodData({ ...periodData, periodLength: v })
                }
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="w-3 h-3 rounded-full inline-block"
        style={{
          background: color,
          border: dashed ? "1px dashed #E8A0BF" : "none",
        }}
      />
      {label}
    </span>
  );
}

function NumberRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] text-cale-textDark">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-7 h-7 rounded-full bg-cale-input text-cale-textDark flex items-center justify-center active:opacity-70"
        >
          <Minus size={15} />
        </button>
        <span className="w-8 text-center text-[15px]">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-7 h-7 rounded-full bg-cale-input text-cale-textDark flex items-center justify-center active:opacity-70"
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
