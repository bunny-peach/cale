import { PeriodData } from "./types";
import { todayKey } from "./storage";

function parse(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export interface PeriodInsight {
  hasData: boolean;
  cycleLength: number;
  periodLength: number;
  lastStart?: string;
  nextStart?: string;
  daysUntilNext?: number;
  isOnPeriod: boolean;
  dayOfPeriod?: number;
  summary: string;
}

/**
 * Estimate the cycle length from the historical entries. Falls back to the
 * configured cycleLength when there is not enough history.
 */
export function estimateCycleLength(data: PeriodData): number {
  const starts = data.entries
    .map((e) => e.startDate)
    .sort()
    .map(parse);
  if (starts.length < 2) return data.cycleLength;
  const gaps: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const g = daysBetween(starts[i - 1], starts[i]);
    if (g > 10 && g < 90) gaps.push(g);
  }
  if (gaps.length === 0) return data.cycleLength;
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  return Math.round(avg);
}

export function getPeriodInsight(data: PeriodData, now = new Date()): PeriodInsight {
  const cycleLength = estimateCycleLength(data);
  const periodLength = data.periodLength;
  if (data.entries.length === 0) {
    return {
      hasData: false,
      cycleLength,
      periodLength,
      isOnPeriod: false,
      summary: "还没有经期记录。",
    };
  }
  const sorted = [...data.entries].sort((a, b) =>
    a.startDate < b.startDate ? 1 : -1
  );
  const lastStart = sorted[0].startDate;
  const lastStartDate = parse(lastStart);
  const today = parse(todayKey(now));

  const sinceLast = daysBetween(lastStartDate, today);
  const isOnPeriod = sinceLast >= 0 && sinceLast < periodLength;
  const dayOfPeriod = isOnPeriod ? sinceLast + 1 : undefined;

  // Next predicted start
  const nextStartDate = new Date(lastStartDate);
  nextStartDate.setDate(nextStartDate.getDate() + cycleLength);
  let daysUntilNext = daysBetween(today, nextStartDate);
  // If the predicted next start is already in the past, roll forward.
  while (daysUntilNext < 0) {
    nextStartDate.setDate(nextStartDate.getDate() + cycleLength);
    daysUntilNext = daysBetween(today, nextStartDate);
  }

  let summary: string;
  if (isOnPeriod) {
    summary = `Quinn 正在经期第 ${dayOfPeriod} 天，请多关心她的身体，注意保暖和休息。`;
  } else if (daysUntilNext <= 3) {
    summary = `距离 Quinn 下次经期还有 ${daysUntilNext} 天，可能会有情绪波动或不适，请温柔一些。`;
  } else {
    summary = `Quinn 目前不在经期，距离下次预计还有 ${daysUntilNext} 天。`;
  }

  return {
    hasData: true,
    cycleLength,
    periodLength,
    lastStart,
    nextStart: todayKey(nextStartDate),
    daysUntilNext,
    isOnPeriod,
    dayOfPeriod,
    summary,
  };
}

export type DayMark = "period" | "predicted" | "ovulation" | null;

/**
 * Classify a given date for calendar rendering.
 */
export function classifyDate(data: PeriodData, date: Date): DayMark {
  if (data.entries.length === 0) return null;
  const cycleLength = estimateCycleLength(data);
  const periodLength = data.periodLength;
  const target = parse(todayKey(date));

  // Actual recorded periods
  for (const e of data.entries) {
    const start = parse(e.startDate);
    const diff = daysBetween(start, target);
    if (diff >= 0 && diff < periodLength) return "period";
  }

  const sorted = [...data.entries].sort((a, b) =>
    a.startDate < b.startDate ? 1 : -1
  );
  const lastStart = parse(sorted[0].startDate);

  // Project future cycles for prediction / ovulation
  for (let c = 1; c <= 12; c++) {
    const cycleStart = new Date(lastStart);
    cycleStart.setDate(cycleStart.getDate() + cycleLength * c);
    const diff = daysBetween(cycleStart, target);
    if (diff >= 0 && diff < periodLength) return "predicted";
    // Ovulation ~14 days before next period
    const ovStart = new Date(cycleStart);
    ovStart.setDate(ovStart.getDate() - 14);
    const ovDiff = daysBetween(ovStart, target);
    if (ovDiff >= -1 && ovDiff <= 1) return "ovulation";
  }
  return null;
}
