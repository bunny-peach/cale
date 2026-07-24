"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Check,
  X,
  Quote,
  Search,
  Gift,
  Asterisk,
  MoreHorizontal,
  Heart,
  AlignLeft,
  ChevronLeft,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import { uid, load, save, KEYS } from "@/lib/storage";
import { PetNotes, emptyNotes } from "@/lib/petNotes";
import {
  Conversation,
  Message,
  ChatImage,
  Sticker,
  MessageQuote,
} from "@/lib/types";
import { streamChat, summarizeConversation } from "@/lib/api";
import {
  buildSystemPrompt,
  buildMemoryContext,
  MEMORY_SUMMARY_PROMPT,
} from "@/lib/prompt";
import { parseMarkers, splitMessageBreaks } from "@/lib/markers";
import { findGift, Gift as GiftType } from "@/lib/gifts";
import { petPromptSummary } from "@/lib/pets";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import TransferSheet from "./TransferSheet";
import GiftShop from "./GiftShop";
import ChatList from "./ChatList";
import QuotaIndicator from "@/components/QuotaIndicator";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// WeChat-style time separators: show one only after a gap since the last message.
const STAMP_GAP = 5 * 60 * 1000;
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
function periodLabel(h: number): string {
  if (h < 6) return "凌晨";
  if (h < 12) return "上午";
  if (h < 13) return "中午";
  if (h < 18) return "下午";
  return "晚上";
}
function formatStamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const h = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  // Today → "下午 3:42" (12-hour with a Chinese period label).
  if (d.toDateString() === now.toDateString()) {
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${periodLabel(h)} ${h12}:${mm}`;
  }
  const hm24 = `${String(h).padStart(2, "0")}:${mm}`;
  const yst = new Date(now);
  yst.setDate(now.getDate() - 1);
  if (d.toDateString() === yst.toDateString()) return `昨天 ${hm24}`;
  if ((now.getTime() - d.getTime()) / 86400000 < 7)
    return `${WEEKDAYS[d.getDay()]} ${hm24}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hm24}`;
}

export default function ChatView({
  onManageStickers,
  onOpenTheater,
}: {
  onManageStickers: () => void;
  onOpenTheater: () => void;
}) {
  const app = useApp();
  const {
    apiConfig,
    conversations,
    setConversations,
    currentId,
    setCurrentId,
    settings,
    setSettings,
    stickers,
  } = app;

  const [listMode, setListMode] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [actionMsg, setActionMsg] = useState<Message | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(settings.caleName);
  const [burstMode, setBurstMode] = useState(false);
  const [pendingQuote, setPendingQuote] = useState<MessageQuote | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [flashId, setFlashId] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [celebrate, setCelebrate] = useState<{
    type: "transfer" | "gift";
    giftName?: string;
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const summarizedLen = useRef<Record<string, number>>({});
  // The bottom chrome (quote preview + composer) is an overlay so messages
  // scroll under its frosted glass; track its height to pad the scroll area.
  const footerRef = useRef<HTMLDivElement>(null);
  const [footerH, setFooterH] = useState(60);
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFooterH(el.offsetHeight));
    ro.observe(el);
    setFooterH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const current = useMemo(
    () => conversations.find((c) => c.id === currentId) ?? null,
    [conversations, currentId]
  );
  const claudeTheme = settings.theme === "claude";

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1600);
  };

  const scrollToBottom = (smooth = true) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    });
  };

  useEffect(() => {
    scrollToBottom(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  const updateConversation = (
    id: string,
    updater: (c: Conversation) => Conversation
  ) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  };

  const newConversation = (): string => {
    const conv: Conversation = {
      id: uid(),
      title: "",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setCurrentId(conv.id);
    return conv.id;
  };

  // ---- Auto memory summary (idle / hidden / every 50 messages) ----
  // addMemory already de-dupes by exact content, so repeated entries are dropped.
  const runSummary = async (cid: string, force = false) => {
    if (apiConfig.provider === "proxy" && !apiConfig.baseURL) return;
    const conv = conversations.find((c) => c.id === cid);
    if (!conv) return;
    const done = summarizedLen.current[cid] ?? 0;
    if (conv.messages.length < 2) return;
    if (!force && conv.messages.length <= done) return;
    summarizedLen.current[cid] = conv.messages.length;
    try {
      const raw = await summarizeConversation(
        apiConfig,
        conv.messages,
        MEMORY_SUMMARY_PROMPT
      );
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return;
      const arr = JSON.parse(match[0]) as { tag?: string; content?: string }[];
      arr.forEach((item) => {
        if (item?.content) app.addMemory(item.tag || "对话", item.content, "auto", false);
      });
    } catch {
      /* summary is best-effort */
    }
  };

  // Every 50 user messages, fire a hidden summary and reset the counter.
  const bumpMsgCount = (cid: string) => {
    const next = (load<number>(KEYS.msgCount, 0) || 0) + 1;
    if (next >= 50) {
      save(KEYS.msgCount, 0);
      void runSummary(cid, true);
    } else {
      save(KEYS.msgCount, next);
    }
  };

  const scheduleIdleSummary = (cid: string) => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => runSummary(cid), 10 * 60 * 1000);
  };

  // Summarize when the page is hidden / closed (session timeout too).
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && currentId) runSummary(currentId);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, conversations, apiConfig]);

  // ---- Core assistant run ----
  const runAssistant = async (
    cid: string,
    apiHistory: Message[],
    assistantMsgId: string,
    newTurn = true
  ) => {
    // Read Quinn's previous visit time for the prompt, then (for a genuinely
    // new user turn) bump it to now so the next reply sees this gap.
    const prevActive = load<number | null>(KEYS.lastActive, null);
    if (newTurn) save(KEYS.lastActive, Date.now());

    const system = buildSystemPrompt({
      systemPrompt: app.systemPrompt,
      memories: app.memories,
      wishlist: app.wishlist,
      settings: app.settings,
      periodData: app.periodData,
      todayMood: app.todayMood
        ? { mood: app.todayMood.mood, note: app.todayMood.note }
        : undefined,
      lastActive: prevActive,
      timeAware: app.settings.timeAwareEnabled,
      weather:
        app.settings.weatherEnabled && app.weather
          ? { tempC: app.weather.tempC, desc: app.weather.desc }
          : null,
      petSummary: petPromptSummary(app.petState),
    });

    // Inject OFF memories as hidden context on the first user message
    let finalHistory = apiHistory;
    const memCtx = buildMemoryContext(app.memories);
    if (memCtx) {
      const idx = apiHistory.findIndex((m) => m.role === "user");
      if (idx >= 0) {
        finalHistory = apiHistory.map((m, i) =>
          i === idx
            ? {
                ...m,
                hiddenText: [memCtx, m.hiddenText].filter(Boolean).join("\n"),
              }
            : m
        );
      }
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    let acc = "";
    let think = "";
    try {
      await streamChat(apiConfig, system, finalHistory, {
        signal: controller.signal,
        onThinking: (d) => {
          think += d;
          updateConversation(cid, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, thinking: think } : m
            ),
          }));
          scrollToBottom();
        },
        onText: (d) => {
          acc += d;
          const preview = acc.replace(/\[MSG_BREAK\]/g, " ");
          updateConversation(cid, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: preview } : m
            ),
          }));
          scrollToBottom();
        },
        onUsage: (input, output) => {
          app.recordUsage(input, output);
          app.recordQuota(input, output);
        },
      });

      const parsed = parseMarkers(acc);
      // Side effects
      parsed.mcpAdds.forEach((t) => app.addWish(t, "cale"));
      parsed.songAdds.forEach((s) =>
        app.setPlaylist((prev) => (prev.includes(s) ? prev : [...prev, s]))
      );
      parsed.bookAdds.forEach((b) =>
        app.setBookshelf((prev) =>
          prev.some((x) => x.title === b) ? prev : [...prev, { title: b }]
        )
      );
      parsed.moodNotes.forEach((n) => app.setTodayMoodNote(n));
      parsed.diaryAdds.forEach((d) => app.addDiary(d.title, d.content));
      // Cale leaves a handwritten sticky note by the pets' nest for Quinn
      if (parsed.petNotes.length) {
        const existing = load<PetNotes>(KEYS.petNotes, emptyNotes());
        const added = parsed.petNotes.map((text) => ({
          id: uid(),
          text,
          at: Date.now(),
        }));
        save(KEYS.petNotes, {
          ...existing,
          toQuinn: [...added, ...existing.toQuinn].slice(0, 60),
        });
        showToast("Cale 在窝边留了一张便签");
      }
      // Cale tends to his own rabbit / pranks Quinn's wolf
      if (parsed.petActions.length) {
        const clampPet = (n: number) => Math.max(0, Math.min(100, n));
        const wolfPranks = [
          "毛发被扎了个歪歪扭扭的小辫子",
          "脖子上多了一条粉色小丝带",
          "爪子上被点了粉色指甲油",
          "头顶被扣了一个兔耳发箍",
        ];
        app.setPetState((prev) => {
          let rabbit = prev.rabbit;
          let wolf = prev.wolf;
          for (const a of parsed.petActions) {
            if (a === "feed") {
              rabbit = {
                ...rabbit,
                fullness: clampPet(rabbit.fullness + 15),
                mood: clampPet(rabbit.mood + 8),
                intimacy: rabbit.intimacy + 2,
                updatedAt: Date.now(),
              };
            } else if (a === "hug") {
              rabbit = {
                ...rabbit,
                mood: clampPet(rabbit.mood + 12),
                mischief: clampPet(rabbit.mischief - 30),
                intimacy: rabbit.intimacy + 2,
                updatedAt: Date.now(),
              };
            } else if (a === "prank") {
              wolf = {
                ...wolf,
                surprise: wolfPranks[Math.floor(Math.random() * wolfPranks.length)],
                updatedAt: Date.now(),
              };
            }
          }
          return { wolf, rabbit };
        });
      }
      // Cale sends Quinn a gift
      parsed.giftSends.forEach((name) => {
        const gift = findGift(name);
        app.applyGift("cale", gift?.name ?? name, gift?.price ?? 0);
        updateConversation(cid, (c) => ({
          ...c,
          messages: [
            ...c.messages,
            {
              id: uid(),
              role: "assistant",
              content: "",
              payload: {
                kind: "gift",
                from: "cale",
                giftName: gift?.name ?? name,
                amount: gift?.price ?? 0,
              },
              createdAt: Date.now(),
            },
          ],
          updatedAt: Date.now(),
        }));
      });
      if (parsed.giftSends.length) {
        celebrateFor({ type: "gift", giftName: parsed.giftSends[0] });
        showToast("Cale 送了你一个礼物");
      }
      if (parsed.diaryAdds.length) showToast("Cale 写了一篇日记");
      else if (parsed.mcpAdds.length || parsed.songAdds.length || parsed.bookAdds.length)
        showToast("Cale 悄悄记下了一些东西");

      const segments = splitMessageBreaks(parsed.cleanText);
      const chatMode = app.settings.replyMode === "chat";

      if (chatMode && segments.length > 1) {
        // First segment replaces the placeholder
        updateConversation(cid, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: segments[0], thinking: think || undefined }
              : m
          ),
          updatedAt: Date.now(),
        }));
        scrollToBottom();
        // Remaining segments as separate bubbles with a typing delay
        for (let i = 1; i < segments.length; i++) {
          await sleep(600 + Math.random() * 500);
          updateConversation(cid, (c) => ({
            ...c,
            messages: [
              ...c.messages,
              {
                id: uid(),
                role: "assistant",
                content: segments[i],
                createdAt: Date.now(),
              },
            ],
            updatedAt: Date.now(),
          }));
          scrollToBottom();
        }
      } else {
        const finalText = parsed.cleanText.replace(/\[MSG_BREAK\]/g, " ").trim();
        updateConversation(cid, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: finalText, thinking: think || undefined }
              : m
          ),
          updatedAt: Date.now(),
        }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        updateConversation(cid, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    (m.content ? m.content + "\n\n" : "") +
                    `（出错了）${(err as Error).message}`,
                }
              : m
          ),
        }));
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
      scheduleIdleSummary(cid);
    }
  };

  // ---- Sending ----
  const appendUserMessage = (
    cid: string,
    partial: Partial<Message>,
    titleSeed: string
  ): Message => {
    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: "",
      createdAt: Date.now(),
      quote: pendingQuote ?? undefined,
      ...partial,
    };
    updateConversation(cid, (c) => ({
      ...c,
      title: c.title || titleSeed.slice(0, 20) || "新对话",
      messages: [...c.messages, userMsg],
      updatedAt: Date.now(),
    }));
    setPendingQuote(null);
    bumpMsgCount(cid);
    return userMsg;
  };

  const ensureConversation = (): string => {
    let cid = currentId;
    if (!cid || !conversations.some((c) => c.id === cid)) cid = newConversation();
    return cid!;
  };

  const handleSubmit = (text: string, images: ChatImage[]) => {
    if (apiConfig.provider === "proxy" && !apiConfig.baseURL) {
      showToast("请先在设置中配置 API");
      return;
    }
    const cid = ensureConversation();
    const base = conversations.find((c) => c.id === cid);
    const prior = base?.messages ?? [];
    const userMsg = appendUserMessage(
      cid,
      { content: text, images: images.length ? images : undefined },
      text || "图片"
    );
    scrollToBottom();
    if (burstMode) return; // wait for "让 Cale 回复"

    const assistantMsg: Message = {
      id: uid(),
      role: "assistant",
      content: "",
      thinking: "",
      createdAt: Date.now(),
    };
    updateConversation(cid, (c) => ({
      ...c,
      messages: [...c.messages, assistantMsg],
    }));
    runAssistant(cid, [...prior, userMsg], assistantMsg.id);
  };

  const handleSendSticker = (s: Sticker) => {
    if (apiConfig.provider === "proxy" && !apiConfig.baseURL) {
      showToast("请先在设置中配置 API");
      return;
    }
    const cid = ensureConversation();
    const base = conversations.find((c) => c.id === cid);
    const prior = base?.messages ?? [];
    const userMsg = appendUserMessage(
      cid,
      {
        images: [{ dataUrl: s.dataUrl, mediaType: s.mediaType }],
        hiddenText: s.prompt ? `（表情包含义：${s.prompt}）` : undefined,
      },
      "表情"
    );
    scrollToBottom();
    if (burstMode) return;

    const assistantMsg: Message = {
      id: uid(),
      role: "assistant",
      content: "",
      thinking: "",
      createdAt: Date.now(),
    };
    updateConversation(cid, (c) => ({
      ...c,
      messages: [...c.messages, assistantMsg],
    }));
    runAssistant(cid, [...prior, userMsg], assistantMsg.id);
  };

  const celebrateFor = (c: { type: "transfer" | "gift"; giftName?: string }) => {
    setCelebrate(c);
    setTimeout(() => setCelebrate(null), 1400);
  };

  const insertPayload = (payload: Message["payload"], hidden: string) => {
    const cid = ensureConversation();
    const base = conversations.find((c) => c.id === cid);
    const prior = base?.messages ?? [];
    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: "",
      payload,
      hiddenText: hidden,
      createdAt: Date.now(),
    };
    updateConversation(cid, (c) => ({
      ...c,
      title: c.title || "聊天",
      messages: [...c.messages, userMsg],
      updatedAt: Date.now(),
    }));
    bumpMsgCount(cid);
    scrollToBottom();
    const apiReady =
      apiConfig.provider === "claude-code" || !!apiConfig.baseURL;
    if (burstMode || !apiReady) return;
    const aMsg: Message = {
      id: uid(),
      role: "assistant",
      content: "",
      thinking: "",
      createdAt: Date.now(),
    };
    updateConversation(cid, (c) => ({
      ...c,
      messages: [...c.messages, aMsg],
    }));
    runAssistant(cid, [...prior, userMsg], aMsg.id);
  };

  const handleTransfer = (amount: number) => {
    setTransferOpen(false);
    if (!app.applyTransfer(amount)) {
      showToast("余额不足");
      return;
    }
    celebrateFor({ type: "transfer" });
    insertPayload(
      { kind: "transfer", from: "quinn", amount },
      `（Quinn 给你转账 ¥${amount}）`
    );
  };

  const handleGift = (gift: GiftType) => {
    setGiftOpen(false);
    if (!app.applyGift("quinn", gift.name, gift.price)) {
      showToast("余额不足");
      return;
    }
    celebrateFor({ type: "gift", giftName: gift.name });
    insertPayload(
      { kind: "gift", from: "quinn", giftName: gift.name, amount: gift.price },
      `（Quinn 送了你一个"${gift.name}"）`
    );
  };

  const triggerBurstReply = () => {
    if (!current) return;
    const cid = current.id;
    const history = current.messages;
    const assistantMsg: Message = {
      id: uid(),
      role: "assistant",
      content: "",
      thinking: "",
      createdAt: Date.now(),
    };
    updateConversation(cid, (c) => ({
      ...c,
      messages: [...c.messages, assistantMsg],
    }));
    runAssistant(cid, history, assistantMsg.id);
  };

  const handleRegenerate = (assistantMsg: Message) => {
    if (!current || streaming) return;
    const cid = current.id;
    const idx = current.messages.findIndex((m) => m.id === assistantMsg.id);
    if (idx < 0) return;
    const history = current.messages.slice(0, idx); // up to preceding user msg
    const fresh: Message = {
      id: uid(),
      role: "assistant",
      content: "",
      thinking: "",
      createdAt: Date.now(),
    };
    updateConversation(cid, (c) => ({
      ...c,
      messages: [...c.messages.slice(0, idx), fresh],
    }));
    runAssistant(cid, history, fresh.id, false);
  };

  const handleUndo = (m: Message) => {
    if (!current) return;
    const cid = current.id;
    updateConversation(cid, (c) => {
      const idx = c.messages.findIndex((x) => x.id === m.id);
      if (idx < 0) return c;
      // remove the user message and a following assistant reply, if any
      const drop = [idx];
      if (c.messages[idx + 1]?.role === "assistant") drop.push(idx + 1);
      return {
        ...c,
        messages: c.messages.filter((_, i) => !drop.includes(i)),
      };
    });
    setActionMsg(null);
    showToast("已撤回");
  };

  const handleLike = (m: Message) => {
    if (!current) return;
    updateConversation(current.id, (c) => ({
      ...c,
      messages: c.messages.map((x) =>
        x.id === m.id ? { ...x, liked: !x.liked } : x
      ),
    }));
  };

  const handleQuote = (m: Message) => {
    setPendingQuote({
      author: settings.caleName || "Cale",
      text: m.content,
    });
    showToast("已引用，输入你的回复");
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const saveAsDiary = (m: Message) => {
    app.addDiary(`来自聊天 · ${new Date().toLocaleDateString("zh-CN")}`, m.content);
    setActionMsg(null);
    showToast("已保存到日记");
  };

  const handleDelete = (m: Message) => {
    if (!current) return;
    updateConversation(current.id, (c) => ({
      ...c,
      messages: c.messages.filter((x) => x.id !== m.id),
    }));
    setActionMsg(null);
    showToast("已删除");
  };

  const clearConversation = () => {
    if (!current) return;
    if (!confirm("确定清空当前对话的所有消息吗？此操作不可恢复。")) return;
    updateConversation(current.id, (c) => ({ ...c, messages: [] }));
    setActionMsg(null);
    showToast("已清空对话");
  };

  const jumpToMessage = (id: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    requestAnimationFrame(() => {
      const el = document.getElementById("msg-" + id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setFlashId(id);
        setTimeout(() => setFlashId(null), 1200);
      }
    });
  };

  const copyMessage = async (m: Message) => {
    try {
      await navigator.clipboard.writeText(m.content);
      showToast("已复制");
    } catch {
      showToast("复制失败");
    }
    setActionMsg(null);
  };

  const saveName = () => {
    app.updateCaleName(nameDraft);
    setEditingName(false);
    showToast("备注名已更新");
  };

  const messages = current?.messages ?? [];
  const showBurstButton =
    burstMode &&
    !streaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "user";
  const displayName = settings.caleName || "Cale";

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return messages
      .filter((m) => m.content && m.content.toLowerCase().includes(q))
      .map((m) => {
        const idx = m.content.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 12);
        const before = (start > 0 ? "…" : "") + m.content.slice(start, idx);
        const match = m.content.slice(idx, idx + q.length);
        const after = m.content.slice(idx + q.length, idx + q.length + 24);
        return { m, before, match, after };
      });
  }, [messages, searchQuery]);

  // Conversation list is the Chat landing; tapping a card opens the thread.
  if (listMode) {
    return (
      <ChatList
        conversations={conversations}
        displayName={displayName}
        onOpen={(id) => {
          setCurrentId(id);
          setListMode(false);
        }}
        onNew={() => {
          newConversation();
          setListMode(false);
        }}
        onDelete={(id) => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (currentId === id) setCurrentId(null);
        }}
      />
    );
  }

  return (
    <div className="h-full relative overflow-hidden cale-slidein">
      {/* Top bar — three regions: back · avatar+name+status · more */}
      <header
        className="absolute top-0 inset-x-0 z-30 bg-cale-card flex items-center justify-between px-2"
        style={{
          paddingTop: "var(--safe-top)",
          height: "calc(var(--safe-top) + 3.5rem)",
          boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
        }}
      >
        {/* Left: back to the conversation list */}
        <button
          onClick={() => setListMode(true)}
          className="w-9 h-9 flex items-center justify-center text-cale-textLight active:opacity-60"
          aria-label="返回对话列表"
        >
          <ChevronLeft size={24} strokeWidth={1.8} />
        </button>

        {/* Middle: avatar + name + status */}
        {editingName ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="w-28 text-center text-[15px] font-semibold bg-cale-input rounded-lg px-2 py-0.5 outline-none"
            />
            <button onClick={saveName} className="text-cale-accent p-1">
              <Check size={18} />
            </button>
            <button
              onClick={() => {
                setEditingName(false);
                setNameDraft(displayName);
              }}
              className="text-cale-textLight p-1"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setNameDraft(displayName);
              setEditingName(true);
            }}
            className="flex items-center gap-2 active:opacity-60"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgb(var(--cale-accent) / 0.14)" }}
            >
              <Heart size={16} fill="rgb(var(--cale-accent))" className="text-cale-accent" />
            </span>
            <span className="flex flex-col items-start leading-none">
              <span className="text-[15px] font-semibold text-cale-textDark">
                {displayName}
              </span>
              <span className="flex items-center gap-1 mt-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: streaming ? "rgb(var(--cale-accent))" : "#8fcf9a" }}
                />
                <span className="text-[10px] text-cale-textLight">
                  {streaming ? "正在想你…" : "在线"}
                </span>
              </span>
            </span>
          </button>
        )}

        {/* Right: more menu */}
        <div className="relative">
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className="w-9 h-9 flex items-center justify-center text-cale-textLight active:opacity-60"
            aria-label="更多"
          >
            <MoreHorizontal size={22} strokeWidth={1.8} />
          </button>
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
              <div className="absolute right-0 top-10 z-50 w-44 bg-cale-card no-glass rounded-[14px] shadow-lg border border-cale-divider py-1.5">
                <button
                  onClick={() => {
                    setMoreOpen(false);
                    setSearchQuery("");
                    setSearchOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-cale-textDark active:bg-cale-input"
                >
                  <Search size={17} className="text-cale-textLight" /> 搜索聊天记录
                </button>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      replyMode: settings.replyMode === "chat" ? "full" : "chat",
                    })
                  }
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-cale-textDark active:bg-cale-input"
                >
                  <AlignLeft size={17} className="text-cale-textLight" /> 整段模式
                  <span
                    className={`ml-auto text-[11px] px-1.5 py-0.5 rounded-full ${settings.replyMode === "full" ? "bg-cale-accent text-white" : "bg-cale-input text-cale-textLight"}`}
                  >
                    {settings.replyMode === "full" ? "开" : "关"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setMoreOpen(false);
                    newConversation();
                    showToast("新对话已开始");
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[14px] text-cale-textDark active:bg-cale-input"
                >
                  <Plus size={17} className="text-cale-textLight" /> 新建对话
                </button>
                <div className="px-3.5 py-2 border-t border-cale-divider mt-1">
                  <QuotaIndicator inline />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto no-scrollbar"
        style={{
          paddingTop: "calc(var(--safe-top) + 3.5rem)",
          paddingBottom: footerH,
        }}
      >
        <div
          className={
            claudeTheme
              ? "max-w-[720px] mx-auto px-4 py-6 space-y-6"
              : "px-4 py-3 space-y-4"
          }
        >
          {messages.length === 0 && (
            <div className="h-[60vh] flex items-center justify-center text-cale-textLight">
              <span className="text-[15px]">和 {displayName} 说点什么…</span>
            </div>
          )}
          {messages.map((m, i) => {
            const showStamp =
              !claudeTheme &&
              (i === 0 || m.createdAt - messages[i - 1].createdAt > STAMP_GAP);
            return (
              <div key={m.id}>
                {showStamp && (
                  <div className="text-center text-[12px] text-cale-textLight my-5 select-none">
                    {formatStamp(m.createdAt)}
                  </div>
                )}
                <div
                  id={"msg-" + m.id}
                  className={flashId === m.id ? "cale-flash" : undefined}
                >
                  <MessageBubble
                    message={m}
                    streaming={
                      streaming &&
                      i === messages.length - 1 &&
                      m.role === "assistant"
                    }
                    onAction={setActionMsg}
                    onLike={handleLike}
                    onQuote={handleQuote}
                    onRegenerate={handleRegenerate}
                  />
                </div>
              </div>
            );
          })}

          {/* Claude-style footer: Cale mark + disclaimer */}
          {claudeTheme && messages.length > 0 && !streaming && (
            <div className="flex items-start gap-2 pt-1 text-cale-textLight">
              <Asterisk
                size={20}
                strokeWidth={2}
                className="text-cale-accent flex-shrink-0 mt-0.5"
              />
              <span className="text-[12px] leading-relaxed">
                {displayName} 也是 AI，可能会出错，重要的事记得自己确认一下。
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom chrome — frosted glass overlay; messages scroll beneath it */}
      <div
        ref={footerRef}
        className="absolute bottom-0 inset-x-0 z-30 bg-cale-card border-t border-cale-divider"
      >
        {/* Burst reply button */}
        {showBurstButton && (
          <div className="px-3 pt-2">
            <button
              onClick={triggerBurstReply}
              className="w-full py-2.5 rounded-[14px] bg-cale-accent text-white text-[14px] font-medium active:opacity-80"
            >
              让 {displayName} 回复
            </button>
          </div>
        )}

        {/* Pending quote preview */}
        {pendingQuote && (
          <div className="px-3 pt-2">
            <div className="flex items-center gap-2 bg-cale-thinking rounded-[12px] px-3 py-2 text-[12px] text-cale-textLight">
              <Quote size={13} className="text-cale-accent flex-shrink-0" />
              <span className="flex-1 truncate">
                {pendingQuote.author}：{pendingQuote.text}
              </span>
              <button onClick={() => setPendingQuote(null)}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <ChatInput
          onSubmit={handleSubmit}
          onSendSticker={handleSendSticker}
          onStop={handleStop}
          streaming={streaming}
          burstMode={burstMode}
          onToggleBurst={() => setBurstMode((b) => !b)}
          stickers={stickers}
          onManageStickers={onManageStickers}
          onTransfer={() => setTransferOpen(true)}
          onGift={() => setGiftOpen(true)}
          onTheater={onOpenTheater}
        />
      </div>

      {/* Action sheet */}
      {actionMsg && (
        <div
          className="absolute inset-0 z-40 flex items-end bg-black/30"
          onClick={() => setActionMsg(null)}
        >
          <div
            className="w-full bg-cale-card rounded-t-2xl p-2"
            style={{ paddingBottom: "calc(1.5rem + var(--safe-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => copyMessage(actionMsg)}
              className="w-full py-3.5 text-center text-[16px] text-cale-textDark active:bg-cale-input rounded-xl"
            >
              复制
            </button>
            {actionMsg.role === "user" && (
              <button
                onClick={() => handleUndo(actionMsg)}
                className="w-full py-3.5 text-center text-[16px] text-cale-textDark active:bg-cale-input rounded-xl"
              >
                撤回（连同 Cale 的回复）
              </button>
            )}
            {actionMsg.role === "assistant" && actionMsg.content && (
              <button
                onClick={() => saveAsDiary(actionMsg)}
                className="w-full py-3.5 text-center text-[16px] text-cale-textDark active:bg-cale-input rounded-xl"
              >
                保存到日记
              </button>
            )}
            <button
              onClick={() => handleDelete(actionMsg)}
              className="w-full py-3.5 text-center text-[16px] text-red-500 active:bg-cale-input rounded-xl"
            >
              删除这条消息
            </button>
            <button
              onClick={clearConversation}
              className="w-full py-3.5 text-center text-[16px] text-red-500 active:bg-cale-input rounded-xl"
            >
              清空整个对话
            </button>
            <button
              onClick={() => setActionMsg(null)}
              className="w-full py-3.5 mt-1 text-center text-[16px] text-cale-accent active:bg-cale-input rounded-xl"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Transfer / gift sheets */}
      {transferOpen && (
        <TransferSheet
          balance={app.wallet.quinn}
          onClose={() => setTransferOpen(false)}
          onConfirm={handleTransfer}
        />
      )}
      {giftOpen && (
        <GiftShop
          balance={app.wallet.quinn}
          onClose={() => setGiftOpen(false)}
          onConfirm={handleGift}
        />
      )}

      {/* Celebration animation */}
      {celebrate && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="gift-float flex flex-col items-center">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center shadow-lg"
              style={{
                background:
                  celebrate.type === "transfer"
                    ? "linear-gradient(135deg,#F6B98A,#E8916B)"
                    : "linear-gradient(135deg,#F3A6C0,#E884A6)",
                color: "#fff",
              }}
            >
              {celebrate.type === "transfer" ? (
                <span className="text-[40px] font-semibold">¥</span>
              ) : (
                <Gift size={44} strokeWidth={1.8} />
              )}
            </div>
            {celebrate.giftName && (
              <div className="mt-2 text-[14px] font-medium text-cale-textDark">
                {celebrate.giftName}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search panel */}
      {searchOpen && (
        <div className="absolute inset-0 z-40 flex flex-col app-bg">
          <div
            className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center gap-2 px-3 h-12"
            style={{ paddingTop: "var(--safe-top)" }}
          >
            <Search size={18} className="text-cale-textLight flex-shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索聊天记录…"
              className="flex-1 bg-transparent outline-none text-[16px] placeholder:text-cale-textLight"
            />
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="text-cale-accent text-[15px] px-1 active:opacity-60"
            >
              取消
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-2">
            {searchQuery.trim() === "" ? (
              <div className="text-center text-cale-textLight text-[14px] mt-10">
                输入关键词，查找这段对话里的消息
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-cale-textLight text-[14px] mt-10">
                没有找到「{searchQuery.trim()}」
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="text-[12px] text-cale-textLight px-1 mb-1">
                  找到 {searchResults.length} 条
                </div>
                {searchResults.map(({ m, before, match, after }) => (
                  <button
                    key={m.id}
                    onClick={() => jumpToMessage(m.id)}
                    className="w-full text-left bg-cale-card rounded-[14px] px-4 py-3 active:opacity-80"
                  >
                    <div className="text-[12px] text-cale-textLight mb-0.5">
                      {m.role === "user" ? "你" : displayName} ·{" "}
                      {new Date(m.createdAt).toLocaleDateString("zh-CN")}
                    </div>
                    <div className="text-[14px] text-cale-textDark">
                      {before}
                      <mark>{match}</mark>
                      {after}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/75 text-white text-[13px] px-4 py-2 rounded-full pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
