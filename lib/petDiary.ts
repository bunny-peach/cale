// Pet diary: each day's interactions are tallied, then turned into a short
// entry written in the pet's own voice (wolf = terse & tsundere; rabbit =
// aloof, never sure who's been messing with it).

import { PetKind } from "./pets";

export interface DayTally {
  came: boolean; // did anyone interact today
  fed: number;
  fedLike: number;
  fedDislike: number;
  pat: number;
  tease: number;
  play: number;
  mischief: number;
  badItem: number;
  special: number;
  dressed: number;
}

export const emptyTally = (): DayTally => ({
  came: false,
  fed: 0,
  fedLike: 0,
  fedDislike: 0,
  pat: 0,
  tease: 0,
  play: 0,
  mischief: 0,
  badItem: 0,
  special: 0,
  dressed: 0,
});

export interface DiaryEntry {
  date: string; // YYYY-MM-DD
  text: string;
}

export interface PetDiaries {
  wolf: DiaryEntry[];
  rabbit: DiaryEntry[];
}

// Deterministic (no RNG) so a given day's tally always reads the same.
export function genDiaryEntry(kind: PetKind, t: DayTally): string {
  const lines: string[] = [];
  if (kind === "wolf") {
    if (!t.came) {
      lines.push("她今天没来。");
      lines.push("我没有在门口等。骨头也不想啃。");
    } else {
      lines.push("她今天来了。");
      if (t.special) lines.push("桌上出现了奇怪的东西。");
      if (t.fedLike) lines.push("给我喂了爱吃的。");
      else if (t.fed) lines.push("喂了我东西吃。");
      if (t.pat) lines.push("还摸了我的头。我没有摇尾巴。（摇了。）");
      if (t.play) lines.push("陪我玩了一会儿。");
      if (t.tease && !t.pat) lines.push("逗了我半天。");
      if (t.fedDislike) lines.push("有一样东西很难吃。哼。");
      if (lines.length === 1) lines.push("就看了我一眼。也行。");
    }
  } else {
    if (t.mischief || t.badItem) {
      lines.push("有人动了我的窝。");
      lines.push("不知道是谁。哼。");
      if (t.badItem) lines.push("还塞给我一件讨厌的东西。");
    } else if (!t.came) {
      lines.push("今天没人来。");
      lines.push("我自己待着。挺好的。");
    } else {
      if (t.special) lines.push("今天有一样东西出现在我面前。我不知道是谁放的。很好吃。");
      if (t.fedLike) lines.push("有人喂了我爱吃的。");
      else if (t.fed) lines.push("有人喂了我东西。");
      if (t.play) lines.push("有人陪我玩。还不错。");
      if (t.dressed) lines.push("被人换了身衣服。没经过我同意。");
      if (!lines.length) lines.push("普普通通的一天。耳朵动了动。");
    }
  }
  return lines.join("");
}
