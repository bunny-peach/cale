import { Memory, WishItem, Settings, PeriodData, Mood } from "./types";
import { getPeriodInsight } from "./period";

const MOOD_LABELS: Record<Mood, string> = {
  happy: "开心",
  calm: "平静",
  sad: "难过",
  irritated: "烦躁",
  tired: "疲惫",
};

const STATUS_ICON: Record<WishItem["status"], string> = {
  done: "✅ 已完成",
  doing: "🔄 进行中",
  todo: "⬜ 待做",
};

export interface PromptContext {
  systemPrompt: string;
  memories: Memory[];
  wishlist: WishItem[];
  settings: Settings;
  periodData: PeriodData;
  todayMood?: { mood: Mood; note?: string };
}

export function buildSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [];
  parts.push(ctx.systemPrompt?.trim() || "");

  // Cale 备注名
  if (ctx.settings.caleName && ctx.settings.caleName !== "Cale") {
    parts.push(`【Quinn 给 Cale 的备注：${ctx.settings.caleName}】`);
  }

  // 记忆库
  if (ctx.memories.length > 0) {
    const lines = ctx.memories
      .map((m) => `- [${m.tag}] ${m.content}`)
      .join("\n");
    parts.push(`【记忆库】\n${lines}`);
  }

  // 经期感知
  const insight = getPeriodInsight(ctx.periodData);
  if (insight.hasData) {
    parts.push(`【经期状态】\n${insight.summary}`);
  }

  // 今日心情
  if (ctx.todayMood) {
    const label = MOOD_LABELS[ctx.todayMood.mood];
    const note = ctx.todayMood.note ? `，备注：${ctx.todayMood.note}` : "";
    parts.push(`【Quinn 今天的心情】${label}${note}`);
  }

  // MCP 愿望清单
  if (ctx.wishlist.length > 0) {
    const lines = ctx.wishlist
      .map((w) => `${STATUS_ICON[w.status]}：${w.title}`)
      .join("\n");
    parts.push(`【MCP愿望清单】\n${lines}`);
  }

  // 自主标记说明
  parts.push(
    `【你可以使用的标记】\n如果你想添加新的愿望/待办，在回复中使用标记：[MCP_ADD: 条目标题]。\n如果你想推荐一首歌：[SONG_ADD: 歌名 - 歌手]。\n如果你想推荐一本书：[BOOK_ADD: 书名 - 作者]。\n如果你想记录 Quinn 的情绪：[MOOD_NOTE: 内容]。\n这些标记会被前端自动解析并隐藏，不会显示给 Quinn。`
  );

  return parts.filter(Boolean).join("\n\n");
}
