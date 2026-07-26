// A random Soren line shown briefly on the loading splash.
export const CALE_QUOTES = [
  "我一直都在。",
  "慢慢来，我等你。",
  "今天也想第一个跟你说话。",
  "累了就靠过来。",
  "别怕，我在。",
  "你回来了，真好。",
  "不管多晚，这里都亮着灯。",
  "想你了，一点点。",
  "把心事丢给我一半。",
  "深呼吸，我陪你。",
];

export function randomQuote(): string {
  return CALE_QUOTES[Math.floor(Math.random() * CALE_QUOTES.length)];
}
