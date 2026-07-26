export interface DiaryAdd {
  title: string;
  content: string;
}

// Pet-care actions Soren can take on his rabbit / Quinn's wolf.
export type PetAction = "feed" | "hug" | "prank";

export interface ParsedMarkers {
  cleanText: string;
  mcpAdds: string[];
  songAdds: string[];
  bookAdds: string[];
  moodNotes: string[];
  giftSends: string[];
  diaryAdds: DiaryAdd[];
  petActions: PetAction[];
  petNotes: string[];
}

const SIMPLE_PATTERNS: Record<
  "mcpAdds" | "songAdds" | "bookAdds" | "moodNotes" | "giftSends" | "petNotes",
  RegExp
> = {
  mcpAdds: /\[MCP_ADD:\s*([^\]]+)\]/g,
  songAdds: /\[SONG_ADD:\s*([^\]]+)\]/g,
  bookAdds: /\[BOOK_ADD:\s*([^\]]+)\]/g,
  moodNotes: /\[MOOD_NOTE:\s*([^\]]+)\]/g,
  giftSends: /\[GIFT_SEND:\s*([^\]]+)\]/g,
  petNotes: /\[PET_NOTE:\s*([^\]]+)\]/g,
};

// [DIARY_ADD: 标题|||正文]  (content may span multiple lines)
const DIARY_PATTERN = /\[DIARY_ADD:\s*([\s\S]*?)\]/g;

// [PET_FEED] / [PET_HUG] / [PET_PRANK]
const PET_PATTERN = /\[PET_(FEED|HUG|PRANK)\]/g;

/**
 * Extract Soren's self-action markers from a reply and strip them from the
 * text that gets displayed to the user.
 */
export function parseMarkers(text: string): ParsedMarkers {
  const result: ParsedMarkers = {
    cleanText: text,
    mcpAdds: [],
    songAdds: [],
    bookAdds: [],
    moodNotes: [],
    giftSends: [],
    diaryAdds: [],
    petActions: [],
    petNotes: [],
  };

  (Object.keys(SIMPLE_PATTERNS) as (keyof typeof SIMPLE_PATTERNS)[]).forEach(
    (key) => {
      const re = SIMPLE_PATTERNS[key];
      let m: RegExpExecArray | null;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        result[key].push(m[1].trim());
      }
      result.cleanText = result.cleanText.replace(re, "");
    }
  );

  // Diary marker: split title / content on the |||  separator
  let dm: RegExpExecArray | null;
  DIARY_PATTERN.lastIndex = 0;
  while ((dm = DIARY_PATTERN.exec(text)) !== null) {
    const body = dm[1];
    const sep = body.indexOf("|||");
    if (sep >= 0) {
      result.diaryAdds.push({
        title: body.slice(0, sep).trim(),
        content: body.slice(sep + 3).trim(),
      });
    } else {
      result.diaryAdds.push({ title: "Soren 的日记", content: body.trim() });
    }
  }
  result.cleanText = result.cleanText.replace(DIARY_PATTERN, "");

  // Pet-care markers
  let pm: RegExpExecArray | null;
  PET_PATTERN.lastIndex = 0;
  while ((pm = PET_PATTERN.exec(text)) !== null) {
    const a = pm[1].toLowerCase();
    result.petActions.push(a === "feed" ? "feed" : a === "hug" ? "hug" : "prank");
  }
  result.cleanText = result.cleanText.replace(PET_PATTERN, "");

  // Collapse extra whitespace left behind by removed markers
  result.cleanText = result.cleanText.replace(/[ \t]+\n/g, "\n").trim();
  return result;
}

/**
 * Split a reply into separate chat bubbles on the [MSG_BREAK] marker
 * (聊天模式). Empty segments are dropped.
 */
export function splitMessageBreaks(text: string): string[] {
  return text
    .split(/\[MSG_BREAK\]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Segment a reply for 聊天模式 (send-as-several-bubbles). We prefer the
 * model's own [MSG_BREAK] markers, but models often forget them — so when
 * there's only one segment we fall back to natural boundaries (blank lines,
 * then sentence enders) so the toggle actually does something. Content that
 * looks like code / an HTML artifact is never auto-split.
 */
export function chatSegments(text: string): string[] {
  const byMarker = splitMessageBreaks(text);
  if (byMarker.length > 1) return byMarker;

  const body = byMarker[0] ?? "";
  if (!body) return [];
  // Leave structured content (code fences / raw HTML) as a single bubble.
  if (/```|<\/?[a-z][\s\S]*>/i.test(body)) return [body];

  // Prefer blank-line paragraphs when the model wrote them.
  const paras = body
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (paras.length > 1) return capSegments(paras);

  // Otherwise break on sentence enders, grouping ~1 sentence per bubble but
  // gluing very short fragments onto the previous one so bubbles aren't tiny.
  const pieces = body
    .replace(/\n+/g, " ")
    .split(/(?<=[。！？!?…]["'”’)]?)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (pieces.length <= 1) return [body];

  const merged: string[] = [];
  for (const p of pieces) {
    if (merged.length && (merged[merged.length - 1].length < 6 || p.length < 6)) {
      merged[merged.length - 1] += p;
    } else {
      merged.push(p);
    }
  }
  return capSegments(merged);
}

// Keep the bubble count sane: once we hit the cap, the remainder is one bubble.
function capSegments(segs: string[], max = 6): string[] {
  if (segs.length <= max) return segs;
  const head = segs.slice(0, max - 1);
  head.push(segs.slice(max - 1).join(" "));
  return head;
}

/**
 * Pull a self-contained HTML document out of a reply (网页模式). Handles a
 * ```html fenced block, a generic ``` block that looks like HTML, or raw
 * `<!doctype html>` / `<html>` markup. Returns the html plus whatever prose
 * surrounded it (a short caption to show above the artifact card).
 */
export function extractHtml(text: string): { html: string | null; rest: string } {
  // Fenced ```html … ``` (or ```htm) block.
  const fenced = text.match(/```(?:html?|HTML)?\s*\n([\s\S]*?)```/);
  if (fenced && /<[a-z!][\s\S]*>/i.test(fenced[1])) {
    const html = fenced[1].trim();
    const rest = text.replace(fenced[0], "").trim();
    return { html, rest };
  }
  // Raw document without a fence.
  const raw = text.match(/(<!doctype html[\s\S]*<\/html>|<html[\s\S]*<\/html>)/i);
  if (raw) {
    const html = raw[1].trim();
    const rest = text.replace(raw[1], "").trim();
    return { html, rest };
  }
  return { html: null, rest: text };
}
