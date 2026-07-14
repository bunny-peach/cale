export interface DiaryAdd {
  title: string;
  content: string;
}

// Pet-care actions Cale can take on his rabbit / Quinn's wolf.
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
 * Extract Cale's self-action markers from a reply and strip them from the
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
      result.diaryAdds.push({ title: "Cale 的日记", content: body.trim() });
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
