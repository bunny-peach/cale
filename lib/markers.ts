export interface ParsedMarkers {
  cleanText: string;
  mcpAdds: string[];
  songAdds: string[];
  bookAdds: string[];
  moodNotes: string[];
}

const PATTERNS: Record<keyof Omit<ParsedMarkers, "cleanText">, RegExp> = {
  mcpAdds: /\[MCP_ADD:\s*([^\]]+)\]/g,
  songAdds: /\[SONG_ADD:\s*([^\]]+)\]/g,
  bookAdds: /\[BOOK_ADD:\s*([^\]]+)\]/g,
  moodNotes: /\[MOOD_NOTE:\s*([^\]]+)\]/g,
};

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
  };

  (Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).forEach((key) => {
    const re = PATTERNS[key];
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      result[key].push(m[1].trim());
    }
    result.cleanText = result.cleanText.replace(re, "");
  });

  // Collapse extra whitespace left behind by removed markers
  result.cleanText = result.cleanText.replace(/[ \t]+\n/g, "\n").trim();
  return result;
}
