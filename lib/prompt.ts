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
  done: "已完成",
  doing: "进行中",
  todo: "待做",
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

  // 记忆库 —— 只有开启"附加到 prompt"的记忆进入 system prompt（核心设定类）
  const promptMemories = ctx.memories.filter((m) => m.appendToPrompt);
  if (promptMemories.length > 0) {
    const lines = promptMemories
      .map((m) => `- [${m.tag}] ${m.content}`)
      .join("\n");
    parts.push(`【核心记忆】\n${lines}`);
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

  // 回复模式
  if (ctx.settings.replyMode === "chat") {
    parts.push(
      `【回复风格】现在是"聊天模式"。请像在微信上聊天一样，一句一句地回复 Quinn，用 [MSG_BREAK] 分隔你的每句话，模拟真人聊天的节奏，每段不超过两句。`
    );
  }

  // 自主标记说明
  parts.push(
    `【你可以使用的标记】\n` +
      `- 想添加愿望/待办：[MCP_ADD: 条目标题]\n` +
      `- 想推荐一首歌：[SONG_ADD: 歌名 - 歌手]\n` +
      `- 想推荐一本书：[BOOK_ADD: 书名 - 作者]\n` +
      `- 想记录 Quinn 的情绪：[MOOD_NOTE: 内容]\n` +
      `- 当 Quinn 说要睡了或让你写日记时，用你（Cale）的第一人称写一篇睡前日记：[DIARY_ADD: 标题|||正文]\n` +
      `这些标记会被前端自动解析并隐藏，不会显示给 Quinn。`
  );

  return parts.filter(Boolean).join("\n\n");
}

/**
 * Build a hidden context blurb for memories that are NOT appended to the
 * system prompt. Injected as a leading assistant message so Cale is aware of
 * them without spending system-prompt space.
 */
export function buildMemoryContext(memories: Memory[]): string | null {
  const contextMemories = memories
    .filter((m) => !m.appendToPrompt)
    .slice(-30);
  if (contextMemories.length === 0) return null;
  const lines = contextMemories
    .map((m) => `- [${m.tag}] ${m.content}`)
    .join("\n");
  return `（这是我关于 Quinn 的一些记忆，先在心里记着：\n${lines}\n）`;
}

export const MEMORY_SUMMARY_PROMPT = `请总结这段对话中值得记住的关键信息，包括用户提到的偏好、事件、情绪等。用 JSON 格式输出，不要输出任何多余文字：[{"tag": "标签", "content": "内容"}]`;
