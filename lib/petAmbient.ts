// Ambient context for the pets: time of day, weather, season, holidays and
// the user's mood all shift how the pets look and behave.

import { PetKind } from "./pets";
import { Mood } from "./types";

export type Daypart = "night" | "morning" | "day" | "evening";
export function daypart(d: Date = new Date()): Daypart {
  const h = d.getHours();
  if (h >= 23 || h < 7) return "night";
  if (h < 9) return "morning";
  if (h < 18) return "day";
  return "evening";
}

export type Season = "spring" | "summer" | "autumn" | "winter";
export function season(d: Date = new Date()): Season {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

export interface Holiday {
  key: "birthday" | "christmas" | "halloween" | "valentine" | "newyear";
  name: string;
}
export function holiday(d: Date = new Date()): Holiday | null {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  if (m === 4 && day === 20) return { key: "birthday", name: "Quinn 的生日" };
  if (m === 12 && day === 25) return { key: "christmas", name: "圣诞节" };
  if (m === 10 && day === 31) return { key: "halloween", name: "万圣节" };
  if (m === 2 && day === 14) return { key: "valentine", name: "情人节" };
  if (m === 1 && day === 1) return { key: "newyear", name: "新年" };
  return null;
}

export type WeatherKind = "sunny" | "rain" | "snow" | "wind" | "cloud" | null;
export function weatherKind(desc?: string | null): WeatherKind {
  if (!desc) return null;
  if (/雪/.test(desc)) return "snow";
  if (/雨/.test(desc)) return "rain";
  if (/风/.test(desc)) return "wind";
  if (/晴/.test(desc)) return "sunny";
  if (/云|阴/.test(desc)) return "cloud";
  return null;
}

// Falling-particle kind for the seasonal backdrop.
export function seasonParticle(s: Season, w: WeatherKind): "petal" | "leaf" | "snow" | null {
  if (w === "snow" || s === "winter") return "snow";
  if (s === "spring") return "petal";
  if (s === "autumn") return "leaf";
  return null;
}

// A one-line ambient caption for the pet stage, or null to fall back to the
// normal caption. Priority: holiday > sleep > weather/season > mood.
export function ambientCaption(opts: {
  kind: PetKind;
  daypart: Daypart;
  season: Season;
  weather: WeatherKind;
  holiday: Holiday | null;
  mood?: Mood;
}): string | null {
  const wolf = opts.kind === "wolf";
  if (opts.holiday) {
    switch (opts.holiday.key) {
      case "birthday":
        return "今天两只都来了，面前摆着一个小蛋糕🎂";
      case "christmas":
        return wolf ? "戴上了圣诞帽，尾巴摇得像铃铛" : "围上红围巾，缩在窝里偷看礼物";
      case "halloween":
        return wolf ? "对着自己的影子龇牙，其实有点怂" : "裹了块白布装幽灵，可耳朵露在外面";
      case "valentine":
        return "两只中间放着一颗桃子，谁都不好意思先吃";
      case "newyear":
        return wolf ? "烟花一响，他挡在兔子前面" : "被烟花吓到缩成一团";
    }
  }
  if (opts.daypart === "night")
    return wolf ? "闭着眼趴着睡熟了，耳朵偶尔动一下" : "缩在窝里睡着了，只露出一点鼻子";
  if (opts.daypart === "morning")
    return wolf ? "打了个大哈欠，正伸懒腰" : "赖在窝里不肯动，眼睛还没睁开";
  if (opts.daypart === "evening")
    return wolf ? "安静下来了，窝在毯子旁边" : "窝在毯子边，耳朵软软地垂着";
  // daytime → weather / season colour
  if (opts.weather === "rain")
    return wolf ? "下雨了，窝在毯子里不想动" : "缩成一团，耳朵贴着头";
  if (opts.weather === "snow")
    return wolf ? "用爪子拍打飘下来的雪花" : "窝在窝里只露出鼻子看雪";
  if (opts.weather === "wind" && !wolf) return "耳朵被风吹得乱飘～";
  if (opts.weather === "sunny")
    return wolf ? "在太阳底下打滚，晒得眯眼" : "摊开耳朵晒太阳，暖洋洋的";
  if (opts.season === "summer")
    return wolf ? "吐着舌头散热" : "趴在阴凉处不想动";
  if (opts.season === "autumn") return "踩着落叶玩，沙沙响";
  // user mood contagion
  if (opts.mood === "sad")
    return wolf ? "蔫蔫地趴下来，用鼻子蹭你" : "安静地凑过来陪着你";
  if (opts.mood === "happy")
    return wolf ? "满地打滚，开心得不行" : "在窝里蹦来蹦去";
  if (opts.mood === "irritated") return "乖乖待在旁边，不吵你";
  return null;
}
