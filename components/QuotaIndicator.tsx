"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/components/AppContext";
import {
  summarizeQuota,
  formatTokens,
  QuotaWindow,
} from "@/lib/quota";

const DOT: Record<"ok" | "warn" | "full", string> = {
  ok: "#5C9E7A",
  warn: "#E0A63C",
  full: "#C46B6B",
};

function Bar({ label, w }: { label: string; w: QuotaWindow }) {
  const pct = Math.round(w.ratio * 100);
  const color = pct >= 98 ? DOT.full : pct >= 80 ? DOT.warn : DOT.ok;
  return (
    <div>
      <div className="flex justify-between text-[12px] text-cale-textLight mb-1">
        <span>{label}</span>
        <span>
          {formatTokens(w.used)} / {formatTokens(w.cap)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-cale-input overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(pct, 2)}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function QuotaIndicator() {
  const { quotaEvents } = useApp();
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => summarizeQuota(quotaEvents), [quotaEvents]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-9 flex items-center justify-center active:opacity-60"
        aria-label="订阅额度"
        title="订阅额度"
      >
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: DOT[summary.status],
            boxShadow: `0 0 6px ${DOT[summary.status]}`,
          }}
        />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-10 z-50 w-64 bg-cale-card rounded-[14px] shadow-lg border border-cale-divider p-3.5 space-y-3">
            <div className="text-[13px] font-medium text-cale-textDark">
              订阅额度（估算）
            </div>
            <Bar label="5 小时窗口" w={summary.fiveHour} />
            <Bar label="本周" w={summary.weekly} />
            <p className="text-[11px] text-cale-textLight leading-relaxed">
              按 token 消耗估算剩余额度，非官方精确数据。
            </p>
          </div>
        </>
      )}
    </div>
  );
}
