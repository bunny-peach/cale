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

      {/* Line chart */}
      <div className="bg-cale-card rounded-card p-4">
        <div className="text-[14px] font-medium mb-3">近 14 天 Token 用量</div>
        {Object.keys(usageStats.days).length === 0 ? (
          <div className="text-center text-cale-textLight text-[13px] py-6">
            还没有用量数据，聊几句就有啦
          </div>
        ) : (
          (() => {
            const W = 280;
            const H = 100;
            const pad = 5;
            const pts = days.map((d, i) => {
              const r = rows[i];
              const total = r ? r.inputTokens + r.outputTokens : 0;
              const x = pad + (i / (days.length - 1)) * (W - pad * 2);
              const y = H - pad - (total / maxTotal) * (H - pad * 2);
              return { x, y, total, d };
            });
            const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
            const area =
              `M ${pts[0].x},${H - pad} ` +
              pts.map((p) => `L ${p.x},${p.y}`).join(" ") +
              ` L ${pts[pts.length - 1].x},${H - pad} Z`;
            return (
              <svg
                viewBox={`0 0 ${W} ${H + 14}`}
                className="w-full"
                preserveAspectRatio="none"
              >
                <path d={area} fill="rgb(var(--cale-accent) / 0.12)" />
                <polyline
                  points={line}
                  fill="none"
                  stroke="rgb(var(--cale-accent))"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {pts.map((p, i) => (
                  <g key={p.d}>
                    {p.total > 0 && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={2.4}
                        fill="rgb(var(--cale-accent))"
                      />
                    )}
                    {i % 3 === 0 && (
                      <text
                        x={p.x}
                        y={H + 11}
                        textAnchor="middle"
                        fontSize={8}
                        fill="rgb(var(--cale-textLight))"
                      >
                        {p.d.slice(5)}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            );
          })()
        )}
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
