// Subscription quota tracking (Pro/Max). We can't read Anthropic's real limits
// from the browser, so we estimate usage against known-ish caps: a 5-hour
// sliding window and a rolling 7-day window. Records older than a week are pruned.

export interface QuotaEvent {
  ts: number; // epoch ms
  input: number;
  output: number;
}

export const FIVE_HOURS = 5 * 60 * 60 * 1000;
export const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

// Rough token caps used to draw the progress bars. These are estimates and can
// be tuned; the goal is a relative "how close am I" signal, not an exact meter.
export const FIVE_HOUR_TOKEN_CAP = 200_000;
export const WEEKLY_TOKEN_CAP = 2_500_000;

export function pruneEvents(events: QuotaEvent[], now = Date.now()): QuotaEvent[] {
  const cutoff = now - ONE_WEEK;
  return events.filter((e) => e.ts >= cutoff);
}

function sumTokens(events: QuotaEvent[]): number {
  return events.reduce((n, e) => n + e.input + e.output, 0);
}

export interface QuotaWindow {
  used: number;
  cap: number;
  ratio: number; // 0..1 (clamped)
}

export interface QuotaSummary {
  fiveHour: QuotaWindow;
  weekly: QuotaWindow;
  status: "ok" | "warn" | "full";
}

function windowFor(
  events: QuotaEvent[],
  since: number,
  cap: number,
  now: number
): QuotaWindow {
  const used = sumTokens(events.filter((e) => e.ts >= now - since));
  const ratio = Math.min(used / cap, 1);
  return { used, cap, ratio };
}

export function summarizeQuota(
  events: QuotaEvent[],
  now = Date.now()
): QuotaSummary {
  const fiveHour = windowFor(events, FIVE_HOURS, FIVE_HOUR_TOKEN_CAP, now);
  const weekly = windowFor(events, ONE_WEEK, WEEKLY_TOKEN_CAP, now);
  const worst = Math.max(fiveHour.ratio, weekly.ratio);
  const status = worst >= 0.98 ? "full" : worst >= 0.8 ? "warn" : "ok";
  return { fiveHour, weekly, status };
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}
