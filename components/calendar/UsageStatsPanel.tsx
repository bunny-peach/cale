"use client";

import { useMemo } from "react";
import { useApp } from "@/components/AppContext";
import { todayKey } from "@/lib/storage";

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(todayKey(d));
  }
  return out;
}

export default function UsageStatsPanel() {
  const { usageStats, settings } = useApp();

  const days = useMemo(() => lastNDays(14), []);
  const rows = days.map((d) => usageStats.days[d]);

  const maxTotal = Math.max(
    1,
    ...rows.map((r) => (r ? r.inputTokens + r.outputTokens : 0))
  );

  const cost = (input: number, output: number) =>
    (input / 1_000_000) * settings.inputPrice +
    (output / 1_000_000) * settings.outputPrice;

  const totals = Object.values(usageStats.days).reduce(
    (acc, d) => {
      acc.input += d.inputTokens;
      acc.output += d.outputTokens;
      return acc;
    },
    { input: 0, output: 0 }
  );

  const todayRow = usageStats.days[todayKey()];

  // This-month totals
  const monthPrefix = todayKey().slice(0, 7);
  const monthTotals = Object.values(usageStats.days)
    .filter((d) => d.date.startsWith(monthPrefix))
    .reduce(
      (acc, d) => {
        acc.input += d.inputTokens;
        acc.output += d.outputTokens;
        return acc;
      },
      { input: 0, output: 0 }
    );

  return (
    <div className="space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          label="今日"
          tokens={
            todayRow ? todayRow.inputTokens + todayRow.outputTokens : 0
          }
          cost={
            todayRow ? cost(todayRow.inputTokens, todayRow.outputTokens) : 0
          }
        />
        <StatCard
          label="本月"
          tokens={monthTotals.input + monthTotals.output}
          cost={cost(monthTotals.input, monthTotals.output)}
        />
        <StatCard
          label="累计"
          tokens={totals.input + totals.output}
          cost={cost(totals.input, totals.output)}
        />
      </div>

      {/* Bar chart */}
      <div className="bg-cale-card rounded-card p-4">
        <div className="text-[14px] font-medium mb-3">近 14 天 Token 用量</div>
        {Object.keys(usageStats.days).length === 0 ? (
          <div className="text-center text-cale-textLight text-[13px] py-6">
            还没有用量数据，聊几句就有啦
          </div>
        ) : (
          <div className="flex items-end justify-between gap-1 h-32">
            {days.map((d, i) => {
              const r = rows[i];
              const total = r ? r.inputTokens + r.outputTokens : 0;
              const inH = r ? (r.inputTokens / maxTotal) * 100 : 0;
              const outH = r ? (r.outputTokens / maxTotal) * 100 : 0;
              return (
                <div
                  key={d}
                  className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                >
                  <div
                    className="w-full flex flex-col justify-end rounded-t overflow-hidden"
                    style={{ height: `${Math.max(inH + outH, total ? 4 : 0)}%` }}
                    title={`${d}: ${total} tokens`}
                  >
                    <div
                      style={{
                        height: `${outH === 0 ? 0 : (outH / (inH + outH)) * 100}%`,
                        background: "#D4849F",
                      }}
                    />
                    <div
                      style={{
                        height: `${inH === 0 ? 0 : (inH / (inH + outH)) * 100}%`,
                        background: "#F0C0D4",
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-cale-textLight">
                    {d.slice(8)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div className="flex gap-3 mt-3 text-[11px] text-cale-textLight">
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: "#F0C0D4" }}
            />
            输入
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: "#D4849F" }}
            />
            输出
          </span>
        </div>
      </div>

      {(settings.inputPrice === 0 && settings.outputPrice === 0) && (
        <div className="text-[12px] text-cale-textLight text-center px-4">
          在设置中填写 token 单价，即可看到花费估算
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  tokens,
  cost,
}: {
  label: string;
  tokens: number;
  cost: number;
}) {
  return (
    <div className="bg-cale-card rounded-card px-2 py-3 text-center">
      <div className="text-[12px] text-cale-textLight">{label}</div>
      <div className="text-[16px] font-semibold text-cale-textDark mt-1">
        {tokens >= 1000 ? (tokens / 1000).toFixed(1) + "k" : tokens}
      </div>
      {cost > 0 && (
        <div className="text-[11px] text-cale-accent mt-0.5">
          ¥{cost.toFixed(3)}
        </div>
      )}
    </div>
  );
}
